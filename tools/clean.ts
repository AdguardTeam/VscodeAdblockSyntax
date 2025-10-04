/**
 * @file Dependency-free cleanup script for removing node_modules from all packages.
 */

import { execSync } from 'node:child_process';
import { access, rm } from 'node:fs/promises';
import path from 'node:path';

interface Package {
    path: string;
    name: string;
    version: string;
}

const rawPackageList: string = execSync('pnpm ls -r --depth=-1 --json').toString();
const packages: Package[] = JSON.parse(rawPackageList);

const dirsToRemove: string[] = ['node_modules'];

/**
 * Checks if a path exists.
 *
 * @param targetPath Path to check.
 *
 * @returns True if the path exists, false otherwise.
 */
const isPathExists = async (targetPath: string): Promise<boolean> => {
    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
};

/**
 * Removes node_modules directories from all packages.
 */
async function cleanup(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const pkg of packages) {
        for (const dir of dirsToRemove) {
            promises.push(
                (async () => {
                    const target: string = path.join(pkg.path, dir);
                    if (await isPathExists(target)) {
                        // eslint-disable-next-line no-console
                        console.log(`Removing: ${target}`);
                        await rm(target, { recursive: true, force: true });
                    }
                })(),
            );
        }
    }

    await Promise.all(promises);
}

/**
 * Execute the cleanup function.
 */
cleanup().catch((error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Error during cleanup:', error);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
});
