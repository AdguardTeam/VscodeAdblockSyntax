import { pathToFileURL } from 'node:url';

import type * as AGLint from '@adguard/aglint';
import preferredPM from 'preferred-pm';
import { satisfies } from 'semver';
import { type Connection } from 'vscode-languageserver';

import { AGLINT_PACKAGE_NAME, LF } from '../common/constants';

import { resolveAglintModulePath } from './aglint-resolver';
import { getErrorMessage } from './error';
import { getInstallationCommand, NPM } from './package-managers';

export type LoadedAglint = {
    module: typeof AGLint;
    path: string;
};

/**
 * Minimum version of the external AGLint module that is supported by the VSCode extension.
 * If the version is lower than this, the extension will fallback to the bundled version.
 */
const MIN_AGLINT_VERSION = '4.0.0-alpha.0';

/**
 * Helper function to import the AGLint module dynamically.
 *
 * @param path Path to the AGLint module.
 *
 * @returns Loaded AGLint module.
 *
 * @throws If the module cannot be found.
 */
const importAglint = async (path: string): Promise<typeof AGLint> => {
    const aglintPkg = await import(path);

    // Module may have a default export
    if ('default' in aglintPkg) {
        return aglintPkg.default as typeof AGLint;
    }

    return aglintPkg;
};

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
        connection.console.info(`Detected preferred package manager: ${preferredPackageManager}`);
    } else {
        connection.console.info('Preferred package manager not found, falling back to NPM');
        preferredPackageManager = {
            name: NPM,
            version: 'unknown',
        };
    }

    const aglintPath = await resolveAglintModulePath(
        dir,
        (message: string, verbose?: string | undefined) => {
            connection.tracer.log(message, verbose);
        },
        preferredPackageManager.name,
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
        const aglint = await importAglint(externalAglintUrlPath);

        connection.console.info('Successfully loaded external AGLint module');
        connection.console.info('Checking the version of external AGLint module');

        const suffix = `version: ${aglint.version}, minimum required version: ${MIN_AGLINT_VERSION}`;

        if (satisfies(aglint.version, `>=${MIN_AGLINT_VERSION}`)) {
            connection.console.info(
                `External AGLint module version is compatible with the VSCode extension (${suffix})`,
            );
            return {
                path: aglintPath,
                module: aglint,
            };
        }

        connection.console.error(
            `External AGLint module version is not compatible with the VSCode extension (${suffix})`,
        );
    } catch (error: unknown) {
        connection.console.error(
            // eslint-disable-next-line max-len
            `Failed to load external AGLint module from: ${aglintPath}, because of the following error: ${getErrorMessage(error)}`,
        );
    }

    return undefined;
}
