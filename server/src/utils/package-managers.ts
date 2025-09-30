/**
 * @file Utility functions for package managers.
 */

import { execSync } from 'node:child_process';
import { isAbsolute } from 'node:path';

import { Files } from 'vscode-languageserver/node';

import { EMPTY } from '../common/constants';

/**
 * Node Package Manager.
 *
 * @see https://www.npmjs.com/
 */
export const NPM = 'npm';

/**
 * Yarn Package Manager.
 *
 * @see https://yarnpkg.com/
 */
export const YARN = 'yarn';

/**
 * PNPM Package Manager.
 *
 * @see https://pnpm.io/
 */
export const PNPM = 'pnpm';

/**
 * Type of supported package managers.
 */
export type PackageManager = typeof NPM | typeof YARN | typeof PNPM;

/**
 * Type of trace function. It's the same as the trace function
 * as used in the VSCode server, but we define it here to give
 * a more convenient way to use it via the type alias.
 */
export type TraceFunction = (message: string, verbose?: string) => void;

/**
 * Finds the global path for PNPM. This isn't implemented in the
 * VSCode server, so we need to do it here.
 *
 * @param tracer Trace function (optional).
 *
 * @returns Path to the global PNPM root or undefined if not found.
 */
export function findPnpmRoot(tracer?: TraceFunction): string | undefined {
    try {
        // Execute `pnpm root -g` command to find the global root.
        // If the command fails (e.g. PNPM is not installed or
        // not in the PATH), the execSync will throw an error
        const result = execSync('pnpm root -g').toString().trim();

        // If the command succeeded, we should check if the result
        // is an absolute path. If it's not, we should ignore it
        if (isAbsolute(result)) {
            if (tracer) {
                tracer(`Found global PNPM root: ${result}`);
            }

            return result;
        }

        if (tracer) {
            tracer(`Global PNPM root is not an absolute path: ${result}`);
        }
    } catch (error: unknown) {
        // If the execution failed, we simply ignore the error,
        // and consider the PNPM root as not found
        if (tracer) {
            tracer(`Error while finding global PNPM root: ${error}`);
        }
    }

    return undefined;
}

/**
 * Find the path to the global root of the given package manager.
 *
 * @param packageManager Name of the package manager (npm, yarn, pnpm).
 * @param tracer Trace function (optional).
 *
 * @returns Path to the root directory of the package manager or undefined if not found
 * or cannot be resolved.
 */
export async function findGlobalPathForPackageManager(
    packageManager: PackageManager,
    tracer?: TraceFunction,
): Promise<string | undefined> {
    try {
        switch (packageManager) {
            case NPM:
                // eslint-disable-next-line max-len
                // TODO: It seems that this function marked as deprecated in the VSCode server, so we should find a better way to do this.
                // Anyway, this solution is works for now, so it doesn't seem to be a big problem
                return Files.resolveGlobalNodePath(tracer);
            case YARN:
                return Files.resolveGlobalYarnPath(tracer);
            case PNPM:
                return findPnpmRoot(tracer);
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
 * Returns the installation command for the given package manager and package name.
 *
 * @param packageManager Name of the package manager (npm, yarn, pnpm).
 * @param packageName Name of the package to install.
 * @param global Whether to install the package globally or not (default: false).
 *
 * @returns Corresponding installation command for the given package manager.
 */
export function getInstallationCommand(packageManager: PackageManager, packageName: string, global = false): string {
    switch (packageManager) {
        case NPM:
            return `npm install ${global ? '-g ' : EMPTY}${packageName}`;
        case YARN:
            return `yarn add ${global ? 'global ' : EMPTY}${packageName}`;
        case PNPM:
            return `pnpm install ${global ? '-g ' : EMPTY}${packageName}`;
        default:
            // Theoretically, this should never happen
            return 'Cannot determine the package manager';
    }
}
