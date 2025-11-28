import { pathToFileURL } from 'node:url';

import type * as AGLint from '@adguard/aglint';
import type * as AGLintCliModule from '@adguard/aglint/cli';
import type * as AGLintLinterModule from '@adguard/aglint/linter';
import preferredPM from 'preferred-pm';
import { satisfies } from 'semver';
import { type Connection } from 'vscode-languageserver';

import { AGLINT_PACKAGE_NAME, LF } from '../common/constants';

import { getErrorMessage } from './error';
import { importModule } from './import';
import { resolveModulePath } from './module-resolver';
import { getInstallationCommand, NPM, type PackageManager } from './package-managers';

/**
 * Minimum version of the external AGLint module that is supported by the VSCode extension.
 * If the version is lower than this, the extension cannot use the external AGLint module.
 */
const MIN_AGLINT_VERSION = '4.0.0-beta.1';

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
                    this.connection.tracer.log(message);
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
            this.connection.console.error(`Failed to load rule '${name}': ${String(error)}`);
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

    const aglintPath = await resolveModulePath(
        dir,
        AGLINT_PACKAGE_NAME,
        preferredPackageManager.name,
        (message: string) => {
            connection.tracer.log(message);
        },
    );

    if (!aglintPath) {
        connection.console.info([
            /* eslint-disable max-len */
            'It seems that the AGLint package is not installed either locally or globally.',
            `You can install AGLint by running: ${getInstallationCommand(preferredPackageManager.name, AGLINT_PACKAGE_NAME)}`,
            /* eslint-enable max-len */
        ].join(LF));

        return undefined;
    }

    // Dynamic import requires a URL, not a path
    const externalAglintUrlPath = pathToFileURL(aglintPath).toString();

    try {
        const aglint = await importModule(externalAglintUrlPath) as typeof AGLint;

        const suffix = `version: ${aglint.version}, minimum required version: ${MIN_AGLINT_VERSION}`;

        if (!satisfies(aglint.version, `>=${MIN_AGLINT_VERSION}`)) {
            connection.console.error(
                `External AGLint module version is not compatible with the VSCode extension (${suffix})`,
            );
            return undefined;
        }
        const linterPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/linter`,
            preferredPackageManager.name,
            (message: string) => {
                connection.tracer.log(message);
            },
        );
        if (!linterPath) {
            connection.console.error('Failed to resolve AGLint linter module');
            return undefined;
        }
        const cliPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/cli`,
            preferredPackageManager.name,
            (message: string) => {
                connection.tracer.log(message);
            },
        );
        if (!cliPath) {
            connection.console.error('Failed to resolve AGLint CLI module');
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
            `Failed to load external AGLint module from: ${aglintPath}, because of the following error: ${getErrorMessage(error)}`,
        );
    }

    return undefined;
}
