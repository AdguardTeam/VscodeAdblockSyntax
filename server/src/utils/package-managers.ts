/**
 * @file Utility functions for package managers
 */

import { execSync } from 'child_process';
import { isAbsolute, join, resolve } from 'path';
import { Files } from 'vscode-languageserver/node';

import { pathExists } from './files';

const UPPER_DIR = '..';

/**
 * Possible package managers
 */
export const enum PackageManager {
    /**
     * Node Package Manager
     *
     * @see https://www.npmjs.com/
     */
    NPM = 'npm',

    /**
     * Yarn Package Manager
     *
     * @see https://yarnpkg.com/
     */
    YARN = 'yarn',

    /**
     * PNPM Package Manager
     *
     * @see https://pnpm.io/
     */
    PNPM = 'pnpm',
}

/**
 * Represents the data of a package manager
 */
interface PackageManagerData {
    /**
     * Set of lock file names
     */
    lockFiles: Set<string>;

    /**
     * Installation command for local packages
     */
    localInstallCommand: string;

    /**
     * Installation command for global packages
     */
    globalInstallCommand: string;
}

const PACKAGE_MANAGER_DATA: Record<PackageManager, PackageManagerData> = Object.freeze({
    [PackageManager.NPM]: {
        lockFiles: new Set(['package-lock.json']),
        localInstallCommand: 'npm install',
        globalInstallCommand: 'npm install -g',
    },
    [PackageManager.YARN]: {
        lockFiles: new Set(['yarn.lock']),
        localInstallCommand: 'yarn install',
        globalInstallCommand: 'yarn global add',
    },
    [PackageManager.PNPM]: {
        lockFiles: new Set(['pnpm-lock.yaml', 'shrinkwrap.yaml']),
        localInstallCommand: 'pnpm install',
        globalInstallCommand: 'pnpm install -g',
    },
});

/**
 * Type of trace function. It's the same as the trace function as used in the VSCode server,
 * but we define it here to give a more convenient way to use it via the type alias.
 */
export type TraceFunction = (message: string, verbose?: string) => void;

/**
 * Finds the global path for PNPM. This isn't implemented in the VSCode server, so we need to do it here.
 *
 * @param tracer Trace function (optional).
 * @returns Path to the global PNPM root or undefined if not found.
 */
export function resolveGlobalPnpmPath(tracer?: TraceFunction): string | undefined {
    try {
        // Execute `pnpm root -g` command to find the global root.
        // If the command fails (e.g. PNPM is not installed or
        // not in the PATH), the execSync will throw an error.
        const result = execSync('pnpm root -g').toString().trim();

        // If the command succeeded, we should check if the result is an absolute path.
        // If it's not, we should ignore it.
        if (isAbsolute(result)) {
            tracer?.(`Found global PNPM root: ${result}`);
            return result;
        }

        tracer?.(`Global PNPM root is not an absolute path: ${result}`);
    } catch (error: unknown) {
        // If the execution failed, we simply ignore the error, and consider the PNPM root as not found
        tracer?.(`Error while finding global PNPM root: ${error}`);
    }

    return undefined;
}

/**
 * Find the path to the global root of the given package manager
 *
 * @param packageManager Name of the package manager (npm, yarn, pnpm).
 * @param tracer Trace function (optional).
 * @returns Path to the root directory of the package manager or undefined if not found or cannot be resolved.
 */
export async function findGlobalPathForPackageManager(
    packageManager: PackageManager,
    tracer?: TraceFunction,
): Promise<string | undefined> {
    try {
        switch (packageManager) {
            case PackageManager.NPM:
                // TODO: It seems that this function marked as deprecated in the VSCode server,
                // so we should find a better way to do this.
                // Anyway, this solution is works for now, so it doesn't seem to be a big problem
                return Files.resolveGlobalNodePath(tracer);
            case PackageManager.YARN:
                return Files.resolveGlobalYarnPath(tracer);
            case PackageManager.PNPM:
                return resolveGlobalPnpmPath(tracer);
            default:
                return undefined;
        }
    } catch (error: unknown) {
        // Error tolerance: if the function throws an error, we simply ignore it,
        // and consider the global path as not found
        return undefined;
    }
}

/**
 * Returns the installation command for the given package manager and package name
 *
 * @param packageManager Name of the package manager (npm, yarn, pnpm)
 * @param packageName Name of the package to install
 * @param global Whether to install the package globally or not (default: false)
 * @returns Corresponding installation command for the given package manager
 */
export function getInstallationCommand(packageManager: PackageManager, packageName: string, global = false): string {
    const packageManagerData = PACKAGE_MANAGER_DATA[packageManager];

    if (global) {
        return `${packageManagerData.globalInstallCommand} ${packageName}`;
    }

    return `${packageManagerData.localInstallCommand} ${packageName}`;
}

/**
 * Get the preferred package manager in the given directory, based on the presence of lock files.
 *
 * @param dir Directory to search in.
 * @returns Array of package managers.
 */
async function getPreferredPackageManagerInDir(dir: string): Promise<PackageManager[]> {
    const result: PackageManager[] = [];

    for (const [packageManager, info] of Object.entries(PACKAGE_MANAGER_DATA)) {
        for (const lockFile of info.lockFiles) {
            if (await pathExists(join(dir, lockFile))) {
                result.push(packageManager as PackageManager);
            }
        }
    }

    return result;
}

/**
 * Get the preferred package manager for the given directory, based on the presence of lock files.
 * If there is no lock file, it will go one directory up, and try again.
 * If there is more than one lock file in the same directory, it will return undefined, since we can't determine
 * the package manager in this case.
 *
 * @param dir Directory to search in.
 * @param tracer Trace function (optional).
 * @returns Preferred package manager or `undefined` if not found.
 */
export async function getPreferredPackageManager(
    dir: string,
    tracer?: TraceFunction,
): Promise<PackageManager | undefined> {
    let actualDir = resolve(dir);

    do {
        const packageManagers = await getPreferredPackageManagerInDir(actualDir);
        const len = packageManagers.length;

        // If there is only one lock file, we can determine the package manager.
        if (len === 1) {
            tracer?.(`Found package manager: ${packageManagers[0]}`);
            return packageManagers[0];
        }

        // If there are more than one lock files, we can't determine the package manager, so we return undefined,
        // and abort the search.
        if (len > 1) {
            tracer?.(`Found more than one package manager: '${packageManagers.join(', ')}' in '${actualDir}'`);
            return undefined;
        }

        // If there are no config files, go one directory up and try again.
        actualDir = join(actualDir, UPPER_DIR);
    }
    while (actualDir !== resolve(actualDir, UPPER_DIR));

    // If we didn't find any lock file, we can't determine the package manager, so we return undefined.
    return undefined;
}
