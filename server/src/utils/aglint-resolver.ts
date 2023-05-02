/**
 * @file Utility functions to find AGLint installations
 */

import { Files } from 'vscode-languageserver/node';
import {
    NPM,
    PNPM,
    PackageManager,
    TraceFunction,
    YARN,
    findGlobalPathForPackageManager,
} from './package-managers';
import { AGLINT_PACKAGE_NAME } from '../common/constants';

/**
 * Priority of package managers. We will try to find global AGLint installation in
 * this order (first element has the highest priority).
 */
export const PACKAGE_MANAGER_PRIORITY: PackageManager[] = [NPM, YARN, PNPM];

/**
 * Resolve the path to the AGLint module. First, we try to find it in the current
 * working directory, then we try to find it in the global path of the package
 * managers in the given priority order.
 *
 * If we didn't find the AGLint module, we return undefined, which means that
 * the extension will use the integrated version of AGLint.
 *
 * @param cwd Current working directory
 * @param tracer Trace function
 * @param packageManagers Package managers to search for global AGLint installations.
 * - The priority of the package managers is defined by the order of the array.
 * - If you specify an empty array, global path search will be skipped.
 * - If you specify only one package manager, we will skip the search for
 * the others. For example, if you specify only NPM in the array, we will
 * try to find AGLint only in the global NPM path, and we will skip the search
 * for Yarn and PNPM.
 * @returns Path to the AGLint module or `undefined` if not found
 */
export async function resolveAglintModulePath(
    cwd: string,
    tracer: TraceFunction,
    packageManagers: PackageManager[] = PACKAGE_MANAGER_PRIORITY,
): Promise<string | undefined> {
    // First, try to find AGLint in the current working directory
    try {
        const aglintPath = await Files.resolve(AGLINT_PACKAGE_NAME, cwd, cwd, tracer);

        // If we found it, return the path and abort the search
        if (aglintPath) {
            return aglintPath;
        }
    } catch (error: unknown) {
        // "Files.resolve" throws an error if the package is not found, but we need
        // to continue our search
    }

    // If we didn't find local installation, try to find it in the global path.
    // We will try to find it in the global path of the package managers in the
    // given order
    for (const packageManager of packageManagers) {
        // Find the global path for the actual package manager
        const globalPath = await findGlobalPathForPackageManager(packageManager, tracer);

        // If we didn't find the global path, continue with the next package manager,
        // because the current one seems to be not installed
        if (!globalPath) {
            continue;
        }

        // Otherwise, try to find AGLint in the found global path
        try {
            const aglintPath = await Files.resolve(AGLINT_PACKAGE_NAME, globalPath, cwd, tracer);

            if (aglintPath) {
                return aglintPath;
            }
        } catch (error: unknown) {
            // Error tolerance: if the function throws an error, we ignore it,
            // and continue with the next package manager. In the worst case,
            // we will return undefined, which means that AGLint is not installed,
            // but the extension will still work, because we have a fallback
            // to the integrated version of AGLint.
        }
    }

    return undefined;
}
