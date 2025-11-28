import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import { isAbsolute, join } from 'node:path';

/**
 * Checks if the current platform is Windows.
 */
const isWindows = os.platform() === 'win32';

export type TraceFunction = (message: string) => void;

export const NPM = 'npm' as const;
export const YARN = 'yarn' as const;
export const PNPM = 'pnpm' as const;
export const BUN = 'bun' as const;

export type PackageManager = typeof NPM | typeof YARN | typeof PNPM | typeof BUN;

/**
 * Runs a command and returns the output.
 * Based on VSCode language server implementation.
 *
 * @param command Command to run.
 * @param args Command arguments.
 * @param tracer Tracer function.
 *
 * @returns The output of the command or undefined if it failed.
 */
function run(command: string, args: string[], tracer?: TraceFunction): string | undefined {
    const env: typeof process.env = Object.create(null);
    Object.keys(process.env).forEach((key) => {
        env[key] = process.env[key];
    });
    env.NO_UPDATE_NOTIFIER = 'true';

    const options: SpawnSyncOptionsWithStringEncoding = {
        encoding: 'utf8',
        env,
    };

    // On Windows, use .cmd extension and shell
    let cmd = command;
    if (isWindows) {
        cmd = `${command}.cmd`;
        options.shell = true;
    }

    const handler = () => {};
    try {
        process.on('SIGPIPE', handler);
        const { stdout } = spawnSync(cmd, args, options);

        if (!stdout) {
            if (tracer) {
                tracer(`'${cmd} ${args.join(' ')}' didn't return a value.`);
            }
            return undefined;
        }

        const out = stdout.trim();

        if (tracer) {
            tracer(`'${cmd} ${args.join(' ')}' returned: ${out}`);
        }

        if (out && isAbsolute(out)) {
            return out;
        }

        if (tracer) {
            tracer(`Command returned non-absolute path for "${cmd} ${args.join(' ')}": "${out}"`);
        }
    } catch (e) {
        if (tracer) {
            tracer(`Failed running "${cmd} ${args.join(' ')}": ${String(e)}`);
        }
    } finally {
        process.removeListener('SIGPIPE', handler);
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
    // Try direct approach first (faster)
    const direct = run('npm', ['root', '-g'], tracer);
    if (direct) {
        return direct;
    }

    // Fallback: use `npm config get prefix` like VSCode does
    // This is more reliable on Windows where the path structure is different
    const prefix = run('npm', ['config', 'get', 'prefix'], tracer);
    if (!prefix || prefix.length === 0) {
        return undefined;
    }

    // On Windows: prefix\node_modules
    // On Unix: prefix/lib/node_modules
    const candidate = isWindows ? join(prefix, 'node_modules') : join(prefix, 'lib', 'node_modules');

    if (existsSync(candidate)) {
        if (tracer) {
            tracer(`Found npm global node_modules via prefix at: ${candidate}`);
        }
        return candidate;
    }

    return undefined;
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
    const dir = run('yarn', ['global', 'dir'], tracer);
    if (dir) {
        return dir;
    }

    // Yarn Berry: try reading the configured global folder (if present)
    const berry = run('yarn', ['config', 'get', 'globalFolder'], tracer);
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
    return run('pnpm', ['root', '-g'], tracer);
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
    return run('pnpm', ['bin', '-g'], tracer);
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
