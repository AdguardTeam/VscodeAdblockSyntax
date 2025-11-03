/**
 * @file Utility functions to find module installations.
 */

import resolveFrom from 'resolve-from';
import { Files } from 'vscode-languageserver/node';

import { findGlobalPathForPackageManager, type PackageManager, type TraceFunction } from './package-managers';

/**
 * Resolve the path to the module. First, we try to find it in the current
 * working directory, then we try to find it in the global path of the package
 * managers in the given priority order.
 *
 * @param cwd Current working directory.
 * @param packageName Package name to search for global module installation.
 * @param packageManager Package manager to search for global module installation.
 * @param tracer Trace function.
 *
 * @returns Path to the module or `undefined` if not found.
 */
export async function resolveModulePath(
    cwd: string,
    packageName: string,
    packageManager: PackageManager,
    tracer: TraceFunction,
): Promise<string | undefined> {
    // First, try to find the module in the current working directory
    try {
        const modulePath = resolveFrom(cwd, packageName);

        // If we found it, return the path and abort the search
        if (modulePath) {
            return modulePath;
        }
    } catch {
        // Continue searching in the global path
    }

    // Find the global path for the actual package manager
    // eslint-disable-next-line no-await-in-loop
    const globalPath = await findGlobalPathForPackageManager(packageManager, tracer);

    // If we didn't find the global path, continue with the next package manager,
    // because the current one seems to be not installed
    if (!globalPath) {
        return undefined;
    }

    // Otherwise, try to find the module in the found global path
    try {
        // eslint-disable-next-line no-await-in-loop
        const modulePath = await Files.resolve(packageName, globalPath, cwd, tracer);

        if (modulePath) {
            return modulePath;
        }
    } catch (error: unknown) {
        // Error tolerance: if the function throws an error, we ignore it,
        // and continue with the next package manager. In the worst case,
        // we will return undefined, which means that the module is not installed
    }

    return undefined;
}
