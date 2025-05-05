/**
 * @file Dependency-free cleanup script for removing node_modules from all packages.
 */

import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
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
 * Removes node_modules directories from all packages.
 */
async function cleanup(): Promise<void> {
    for (const pkg of packages) {
        for (const dir of dirsToRemove) {
            const target: string = path.join(pkg.path, dir);
            if (existsSync(target)) {
                // eslint-disable-next-line no-console
                console.log(`Removing: ${target}`);
                await rm(target, { recursive: true, force: true });
            }
        }
    }
}

/**
 * Execute the cleanup function.
 */
cleanup().catch((error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Error during cleanup:', error);
    process.exit(1);
});
