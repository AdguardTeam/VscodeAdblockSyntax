/**
 * @file Utility functions to find module installations.
 */

import { createRequire } from 'node:module';

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
    tracer(`Resolving module path for "${packageName}" using package manager: ${packageManager}`);
    tracer(`Current working directory: ${cwd}`);

    // First, try to find the module in the current working directory
    // Use Node's native createRequire which properly handles "exports" field
    try {
        // Create a require function from the cwd context
        const requireFromCwd = createRequire(`${cwd}/package.json`);
        const modulePath = requireFromCwd.resolve(packageName);

        // If we found it, return the path and abort the search
        if (modulePath) {
            tracer(`Found module "${packageName}" in local directory: ${modulePath}`);
            return modulePath;
        }
    } catch (error: unknown) {
        tracer(`Module "${packageName}" not found in local directory: ${String(error)}`);
        // Continue searching in the global path
    }

    // Find the global path for the actual package manager
    tracer(`Searching for global path using package manager: ${packageManager}`);
    const globalPath = await findGlobalPathForPackageManager(packageManager, tracer);

    // If we didn't find the global path, continue with the next package manager,
    // because the current one seems to be not installed
    if (!globalPath) {
        tracer(`No global path found for package manager: ${packageManager}`);
        return undefined;
    }

    tracer(`Found global path for ${packageManager}: ${globalPath}`);

    // Otherwise, try to find the module in the found global path
    try {
        tracer(`Attempting to resolve "${packageName}" from global path: ${globalPath}`);
        const modulePath = await Files.resolve(packageName, globalPath, cwd, tracer);

        if (modulePath) {
            tracer(`Found module "${packageName}" in global path: ${modulePath}`);
            return modulePath;
        }
        tracer(`Module "${packageName}" not found in global path`);
    } catch (error: unknown) {
        tracer(`Error resolving "${packageName}" from global path: ${String(error)}`);
        // Error tolerance: if the function throws an error, we ignore it,
        // and continue with the next package manager. In the worst case,
        // we will return undefined, which means that the module is not installed
    }

    return undefined;
}
