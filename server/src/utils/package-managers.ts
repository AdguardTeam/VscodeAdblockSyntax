import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import { isAbsolute, join } from 'node:path';

export type TraceFunction = (message: string, verbose?: string) => void;

export const NPM = 'npm' as const;
export const YARN = 'yarn' as const;
export const PNPM = 'pnpm' as const;
export const BUN = 'bun' as const;

export type PackageManager = typeof NPM | typeof YARN | typeof PNPM | typeof BUN;

/**
 * Runs a command and returns the output.
 *
 * @param cmd Command to run.
 * @param tracer Tracer function.
 *
 * @returns The output of the command or undefined if it failed.
 */
function run(cmd: string, tracer?: TraceFunction): string | undefined {
    try {
        const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        if (out && isAbsolute(out)) {
            return out;
        }

        if (tracer) {
            tracer(`Command returned non-absolute path for "${cmd}": ${out}`);
        }
    } catch (e) {
        if (tracer) {
            tracer(`Failed running "${cmd}": ${String(e)}`);
        }
    }
    return undefined;
}

/**
 * Finds the global node_modules directory for npm.
 *
 * @param tracer Tracer function.
 *
 * @returns The global node_modules directory for npm or undefined if it could not be found.
 */
export function findNpmRoot(tracer?: TraceFunction) {
    // Official: `npm root -g` prints the global node_modules directory
    return run('npm root -g', tracer);
}

/**
 * Finds the global node_modules directory for yarn.
 *
 * @param tracer Tracer function.
 *
 * @returns The global node_modules directory for yarn or undefined if it could not be found.
 */
export function findYarnRoot(tracer?: TraceFunction) {
    // Yarn Classic: `yarn global dir` prints the global node_modules directory
    // Yarn Berry still supports global installs via plugin; fall back to config if needed
    const dir = run('yarn global dir', tracer);
    if (dir) {
        return dir;
    }

    // Yarn Berry: try reading the configured global folder (if present)
    const berry = run('yarn config get globalFolder', tracer);
    if (berry && existsSync(berry)) {
        const candidate = join(berry, 'global', 'node_modules');

        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

/**
 * Finds the global node_modules directory for pnpm.
 *
 * @param tracer Tracer function.
 *
 * @returns The global node_modules directory for pnpm or undefined if it could not be found.
 */
export function findPnpmRoot(tracer?: TraceFunction) {
    // pnpm: `pnpm root -g` prints the global node_modules directory
    return run('pnpm root -g', tracer);
}

/**
 * Finds the global bin directory for pnpm.
 *
 * @param tracer Tracer function.
 *
 * @returns The global bin directory for pnpm or undefined if it could not be found.
 */
export function findPnpmBin(tracer?: TraceFunction) {
    // pnpm: `pnpm bin -g` prints the global bin dir (may require `pnpm setup` first)
    return run('pnpm bin -g', tracer);
}

/**
 * Finds the global node_modules directory for bun.
 *
 * @param tracer Tracer function.
 *
 * @returns The global node_modules directory for bun or undefined if it could not be found.
 */
export function findBunRoot(tracer?: TraceFunction) {
    // Bun uses ~/.bun by default; configurable via bunfig.toml [install.globalDir]
    // If BUN_INSTALL is set, prefer it.
    const bunInstall = process.env.BUN_INSTALL ?? join(os.homedir(), '.bun');
    const candidate = join(bunInstall, 'install', 'global', 'node_modules');
    if (existsSync(candidate)) {
        if (tracer) {
            tracer(`Found Bun global node_modules at ${candidate}`);
        }
        return candidate;
    }
    // If the user customized bunfig, we could try to read bunfig.toml, but that's optional.
    return undefined;
}

/**
 * Finds the global node_modules directory for the specified package manager.
 *
 * @param packageManager The package manager to find the global node_modules directory for.
 * @param tracer Tracer function.
 *
 * @returns The global node_modules directory for the specified package manager or undefined if it could not be found.
 */
export async function findGlobalPathForPackageManager(
    packageManager: PackageManager,
    tracer?: TraceFunction,
): Promise<string | undefined> {
    switch (packageManager) {
        case NPM: return findNpmRoot(tracer);
        case YARN: return findYarnRoot(tracer);
        case PNPM: return findPnpmRoot(tracer);
        case BUN: return findBunRoot(tracer);
        default: return undefined;
    }
}

/**
 * Gets the installation command for the specified package manager.
 *
 * @param pm The package manager to get the installation command for.
 * @param pkg The package to install.
 * @param global Whether to install the package globally.
 *
 * @returns The installation command for the specified package manager.
 */
export function getInstallationCommand(pm: PackageManager, pkg: string, global = false) {
    switch (pm) {
        case NPM: return `npm install ${global ? '-g ' : ''}${pkg}`;
        case YARN: return global ? `yarn global add ${pkg}` : `yarn add ${pkg}`; // fix
        case PNPM: return `pnpm ${global ? 'add -g' : 'add'} ${pkg}`; // prefer `add`
        case BUN: return `bun ${global ? 'add -g' : 'add'} ${pkg}`; // prefer `add`
        default: return 'Unknown package manager';
    }
}
