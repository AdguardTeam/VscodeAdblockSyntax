/* eslint-disable n/no-missing-require */
/* eslint-disable global-require */
// module-resolver.ts
import { createRequire } from 'node:module';
import { join } from 'node:path';

import resolveFrom from 'resolve-from';
import { Files } from 'vscode-languageserver/node';

import {
    BUN,
    findGlobalPathForPackageManager,
    NPM,
    type PackageManager,
    PNPM,
    type TraceFunction,
    YARN,
} from './package-managers';

/**
 * Resolves the path to a module.
 *
 * @param cwd The current working directory.
 * @param tracer The tracer function.
 * @param pkgName The name of the package to resolve.
 * @param managers The package managers to use.
 *
 * @returns The path to the module or undefined if it could not be resolved.
 */
export async function resolveModulePath(
    cwd: string,
    tracer: TraceFunction,
    pkgName: string,
    managers: PackageManager[] = [NPM, YARN, PNPM, BUN],
): Promise<string | undefined> {
    // 1) Try local first (Node’s resolver semantics)
    try {
        const local = resolveFrom(cwd, pkgName);
        if (local) {
            return local;
        }
    } catch {
        // Ignore
    }

    // 1b) Yarn PnP (if extension runs inside the project context)
    try {
        // Will only succeed when the current process is inside a PnP runtime
        // (otherwise require('pnpapi') throws).
        // Safe to wrap in try/catch and ignore on failure.
        // @ts-ignore
        const pnp = require('pnpapi');
        const unq = pnp.resolveToUnqualified(pkgName, cwd);
        if (unq) {
            return unq;
        }
    } catch {
        // Ignore
    }

    // 2) Try each manager’s global node_modules
    for (const pm of managers) {
    // eslint-disable-next-line no-await-in-loop
        const globalModules = await findGlobalPathForPackageManager(pm, tracer);
        if (!globalModules) continue;

        // Try VS Code’s helper (resolves like Node with a custom search path)
        try {
            // eslint-disable-next-line no-await-in-loop
            const resolved = await Files.resolve(pkgName, globalModules, cwd, tracer);
            if (resolved) return resolved;
        } catch {
            // Fallback to Node’s resolver with custom paths
            try {
                const req = createRequire(join(globalModules, 'noop.js'));
                const resolved = req.resolve(pkgName);
                if (resolved) return resolved;
            } catch {
                // Ignore
            }
        }
    }

    return undefined;
}
