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
const MIN_AGLINT_VERSION = '4.0.0-alpha.8';

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
     * @param connection Language server connection.
     * @param dir Workspace directory.
     * @param packageManager Preferred package manager name.
     */
    constructor(
        linter: typeof AGLintLinterModule,
        cli: typeof AGLintCliModule,
        presetsRoot: string,
        version: string,
        connection: Connection,
        dir: string,
        packageManager: PackageManager,
    ) {
        this.linter = linter;
        this.cli = cli;
        this.presetsRoot = presetsRoot;
        this.version = version;
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
        if (this.ruleCache[name]) {
            return this.ruleCache[name];
        }

        const path = await resolveModulePath(
            this.dir,
            `${AGLINT_PACKAGE_NAME}/rules/${name}`,
            this.packageManager,
            (message: string, verbose?: string | undefined) => {
                this.connection.tracer.log(message, verbose);
            },
        );

        if (!path) {
            throw new Error(`Failed to resolve AGLint rule: ${name}`);
        }

        this.connection.console.info(`Loading AGLint rule '${name}' from: ${path}`);

        const rule = await importModule(path);
        this.ruleCache[name] = rule;

        return rule;
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
    connection.console.info(`Loading AGLint module for the directory: ${dir}`);

    let preferredPackageManager = await preferredPM(dir);

    if (preferredPackageManager) {
        // eslint-disable-next-line max-len
        connection.console.info(`Detected preferred package manager: ${preferredPackageManager.name} ${preferredPackageManager.version}`);
    } else {
        connection.console.info('Preferred package manager not found, falling back to npm');
        preferredPackageManager = {
            name: NPM,
            version: 'unknown',
        };
    }

    const aglintPath = await resolveModulePath(
        dir,
        AGLINT_PACKAGE_NAME,
        preferredPackageManager.name,
        (message: string, verbose?: string | undefined) => {
            connection.tracer.log(message, verbose);
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

    connection.console.info(`Found external AGLint at: ${aglintPath}`);

    // Dynamic import requires a URL, not a path
    const externalAglintUrlPath = pathToFileURL(aglintPath).toString();

    connection.console.info(`Loading external AGLint module from: ${aglintPath}`);

    try {
        const aglint = await importModule(externalAglintUrlPath) as typeof AGLint;

        connection.console.info('Successfully loaded external AGLint module');
        connection.console.info('Checking the version of external AGLint module');

        const suffix = `version: ${aglint.version}, minimum required version: ${MIN_AGLINT_VERSION}`;

        if (!satisfies(aglint.version, `>=${MIN_AGLINT_VERSION}`)) {
            connection.console.error(
                `External AGLint module version is not compatible with the VSCode extension (${suffix})`,
            );
            return undefined;
        }

        connection.console.info(
            `External AGLint module version is compatible with the VSCode extension (${suffix})`,
        );

        connection.console.info('Resolving AGLint linter module');
        const linterPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/linter`,
            preferredPackageManager.name,
            (message: string, verbose?: string | undefined) => {
                connection.tracer.log(message, verbose);
            },
        );
        if (!linterPath) {
            connection.console.error('Failed to resolve AGLint linter module');
            return undefined;
        }
        connection.console.info(`Found external AGLint linter at: ${linterPath}`);

        connection.console.info('Resolving AGLint CLI module');
        const cliPath = await resolveModulePath(
            dir,
            `${AGLINT_PACKAGE_NAME}/cli`,
            preferredPackageManager.name,
            (message: string, verbose?: string | undefined) => {
                connection.tracer.log(message, verbose);
            },
        );
        if (!cliPath) {
            connection.console.error('Failed to resolve AGLint CLI module');
            return undefined;
        }
        connection.console.info(`Found external AGLint CLI at: ${cliPath}`);

        const cli = await importModule(cliPath) as typeof AGLintCliModule;
        const pathAdapter = new cli.NodePathAdapter();
        const linter = await importModule(linterPath) as typeof AGLintLinterModule;
        const presetsRoot = pathAdapter.join(pathAdapter.dirname(aglintPath), '../config-presets');

        return new LoadedAglint(
            linter,
            cli,
            presetsRoot,
            aglint.version,
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
