import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import type * as AGLint from '@adguard/aglint';
import type * as AGLintCliModule from '@adguard/aglint/cli';
import type * as AGLintLinterModule from '@adguard/aglint/linter';
import preferredPM from 'preferred-pm';
import * as resolve from 'resolve';
import { satisfies } from 'semver';
import { type Connection } from 'vscode-languageserver';

import { AGLINT_PACKAGE_NAME } from '../common/constants';

import { getErrorMessage } from './error';
import { fileExists } from './file-exists';
import { importModule } from './import';
import { resolveModulePath } from './module-resolver';
import { findGlobalPathForPackageManager, NPM, type PackageManager } from './package-managers';

/**
 * Minimum version of the external AGLint module that is supported by the VSCode extension.
 * If the version is lower than this, the extension cannot use the external AGLint module.
 */
const MIN_AGLINT_VERSION = '4.0.0-beta.1';

/**
 * Try to resolve AGLint package.json using the resolve package.
 * This handles local node_modules, monorepos, and respects Node.js resolution algorithm.
 *
 * @param baseDir Starting directory for resolution.
 * @param globalPath Optional global node_modules path to check.
 *
 * @returns Path to AGLint's package root directory if found, undefined otherwise.
 */
function tryResolveAglintPackage(baseDir: string, globalPath?: string): string | undefined {
    const paths = [baseDir];
    if (globalPath) {
        paths.push(globalPath);
    }

    try {
        // Try to resolve package.json from AGLint package
        const packageJsonPath = resolve.sync(`${AGLINT_PACKAGE_NAME}/package.json`, {
            basedir: baseDir,
            paths,
            preserveSymlinks: false,
        });

        // Return the package root directory (parent of package.json)
        return dirname(packageJsonPath);
    } catch {
        // Try without /package.json suffix - some versions might work
        try {
            const mainPath = resolve.sync(AGLINT_PACKAGE_NAME, {
                basedir: baseDir,
                paths,
                preserveSymlinks: false,
            });
            // Walk up to find package.json
            let currentDir = dirname(mainPath);
            // eslint-disable-next-line no-await-in-loop
            while (currentDir !== dirname(currentDir)) {
                const pkgPath = join(currentDir, 'package.json');
                try {
                    // Check if this package.json is for AGLint
                    const content = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                    if (content.name === AGLINT_PACKAGE_NAME) {
                        return currentDir;
                    }
                } catch {
                    // Continue searching
                }
                currentDir = dirname(currentDir);
            }
        } catch {
            // Resolution failed completely
        }
    }

    return undefined;
}

/**
 * Loaded AGLint module with instance-level rule cache.
 */
export class LoadedAglint {
    /**
     * AGLint linter module.
     */
    public linter: typeof AGLintLinterModule;

    /**
     * AGLint CLI module.
     */
    public cli: typeof AGLintCliModule;

    /**
     * Root directory of the AGLint presets.
     */
    public presetsRoot: string;

    /**
     * Version of the loaded AGLint module.
     */
    public version: string;

    /**
     * Path to the loaded AGLint module.
     */
    public modulePath: string;

    /**
     * Cache of loaded linter rules for this instance.
     */
    private ruleCache: Record<string, AGLintLinterModule.LinterRule> = {};

    /**
     * Connection for logging.
     */
    private connection: Connection;

    /**
     * Workspace directory.
     */
    private dir: string;

    /**
     * Preferred package manager name.
     */
    private packageManager: PackageManager;

    /**
     * Creates a new LoadedAglint instance.
     *
     * @param linter AGLint linter module.
     * @param cli AGLint CLI module.
     * @param presetsRoot Root directory of the AGLint presets.
     * @param version Version of the loaded AGLint module.
     * @param modulePath Path to the loaded AGLint module.
     * @param connection Language server connection.
     * @param dir Workspace directory.
     * @param packageManager Preferred package manager name.
     */
    constructor(
        linter: typeof AGLintLinterModule,
        cli: typeof AGLintCliModule,
        presetsRoot: string,
        version: string,
        modulePath: string,
        connection: Connection,
        dir: string,
        packageManager: PackageManager,
    ) {
        this.linter = linter;
        this.cli = cli;
        this.presetsRoot = presetsRoot;
        this.version = version;
        this.modulePath = modulePath;
        this.connection = connection;
        this.dir = dir;
        this.packageManager = packageManager;
    }

    /**
     * Load a linter rule.
     *
     * @param name Name of the rule.
     *
     * @returns The loaded rule.
     *
     * @throws If the rule cannot be loaded.
     */
    public loadRule: AGLintLinterModule.LinterRunOptions['loadRule'] = async (name: string) => {
        try {
            if (this.ruleCache[name]) {
                return this.ruleCache[name];
            }

            const path = await resolveModulePath(
                this.dir,
                `${AGLINT_PACKAGE_NAME}/rules/${name}`,
                this.packageManager,
                (message: string) => {
                    this.connection.tracer.log(`[lsp] ${message}`);
                },
            );

            if (!path) {
                throw new Error(`Failed to resolve AGLint rule: ${name}`);
            }

            // Convert file path to file:// URL for dynamic import (required on Windows)
            const ruleUrl = pathToFileURL(path).toString();

            const rule = await importModule(ruleUrl);
            this.ruleCache[name] = rule;

            return rule;
        } catch (error: unknown) {
            this.connection.console.error(`[lsp] Failed to load rule '${name}': ${String(error)}`);
            throw error;
        }
    };
}

/**
 * Load the installed AGLint module.
 *
 * @param connection Language server connection.
 * @param dir Workspace root path.
 *
 * @returns The loaded AGLint module or undefined if it could not be loaded.
 */
export async function loadAglintModule(
    connection: Connection,
    dir: string,
): Promise<LoadedAglint | undefined> {
    let preferredPackageManager = await preferredPM(dir);

    if (!preferredPackageManager) {
        preferredPackageManager = {
            name: NPM,
            version: 'unknown',
        };
    }

    // Try to resolve the main AGLint module
    const aglintPath = await resolveModulePath(
        dir,
        AGLINT_PACKAGE_NAME,
        preferredPackageManager.name,
        (message: string) => {
            connection.tracer.log(`[lsp] ${message}`);
        },
    );

    if (aglintPath) {
        connection.console.info(`[lsp] AGLint found at: ${aglintPath}`);
    }

    if (!aglintPath) {
        // Failed to resolve - try using resolve package with global path support
        // Get global node_modules path if available
        const globalPath = await findGlobalPathForPackageManager(preferredPackageManager.name);
        const aglintPackageDir = tryResolveAglintPackage(dir, globalPath);
        const localPackageJsonPath = aglintPackageDir ? join(aglintPackageDir, 'package.json') : undefined;

        if (aglintPackageDir) {
            connection.console.info(`[lsp] AGLint found at: ${aglintPackageDir}`);
        }

        if (localPackageJsonPath) {
            // Package exists locally - read it to diagnose the issue
            try {
                const packageJsonContent = await readFile(localPackageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageJsonContent);
                const installedVersion = packageJson.version as string;

                // Check if it's a version issue
                if (!satisfies(installedVersion, `>=${MIN_AGLINT_VERSION}`)) {
                    connection.console.error(
                        // eslint-disable-next-line max-len
                        `[lsp] AGLint ${installedVersion} is not compatible with the VSCode extension (minimum required: ${MIN_AGLINT_VERSION})`,
                    );
                } else if (!packageJson.exports || packageJson.type !== 'module') {
                    connection.console.error(
                        `[lsp] AGLint ${installedVersion} is not an ESM package (corrupted or incompatible)`,
                    );
                } else {
                    connection.console.error(
                        `[lsp] AGLint ${installedVersion} cannot be loaded (incompatible package structure)`,
                    );
                }
            } catch (error) {
                // Can't read package.json - corrupted installation
                connection.console.error(`[lsp] AGLint package.json is unreadable: ${getErrorMessage(error)}`);
            }
            return undefined;
        }

        // Try to check if package.json can be resolved (for better error messages)
        const aglintPackageJsonPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/package.json`,
            preferredPackageManager.name,
            (message: string) => {
                connection.tracer.log(`[lsp] ${message}`);
            },
        );

        if (aglintPackageJsonPath && (await fileExists(aglintPackageJsonPath))) {
            // Package exists globally but can't be loaded
            connection.console.error(
                '[lsp] AGLint is installed globally but cannot be loaded (likely incompatible version)',
            );
        } else {
            // Package is truly not installed
            connection.console.info('[lsp] AGLint package is not installed');
        }

        return undefined;
    }

    // Dynamic import requires a URL, not a path
    const externalAglintUrlPath = pathToFileURL(aglintPath).toString();

    try {
        const aglint = await importModule(externalAglintUrlPath) as typeof AGLint;

        const suffix = `version: ${aglint.version}, minimum required version: ${MIN_AGLINT_VERSION}`;

        if (!satisfies(aglint.version, `>=${MIN_AGLINT_VERSION}`)) {
            connection.console.error(
                `[lsp] External AGLint module version is not compatible with the VSCode extension (${suffix})`,
            );
            return undefined;
        }

        const linterPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/linter`,
            preferredPackageManager.name,
            (message: string) => {
                connection.tracer.log(`[lsp] ${message}`);
            },
        );
        if (!linterPath) {
            connection.console.error('[lsp] Failed to resolve AGLint linter module');
            return undefined;
        }
        const cliPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/cli`,
            preferredPackageManager.name,
            (message: string) => {
                connection.tracer.log(`[lsp] ${message}`);
            },
        );
        if (!cliPath) {
            connection.console.error('[lsp] Failed to resolve AGLint CLI module');
            return undefined;
        }

        // Convert file paths to file:// URLs for dynamic import (required on Windows)
        const linterUrl = pathToFileURL(linterPath).toString();
        const cliUrl = pathToFileURL(cliPath).toString();

        const cli = await importModule(cliUrl) as typeof AGLintCliModule;
        const pathAdapter = new cli.NodePathAdapter();
        const linter = await importModule(linterUrl) as typeof AGLintLinterModule;

        // aglintPath points to .../dist/index.js, we need to go up to the package root
        // and then to config-presets directory
        const packageRoot = pathAdapter.dirname(pathAdapter.dirname(aglintPath));
        const presetsRoot = pathAdapter.join(packageRoot, 'config-presets');

        return new LoadedAglint(
            linter,
            cli,
            presetsRoot,
            aglint.version,
            aglintPath,
            connection,
            dir,
            preferredPackageManager.name as PackageManager,
        );
    } catch (error: unknown) {
        connection.console.error(
            // eslint-disable-next-line max-len
            `[lsp] Failed to load external AGLint module from: ${aglintPath}, because of the following error: ${getErrorMessage(error)}`,
        );
    }

    return undefined;
}
