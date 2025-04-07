/**
 * @file Dependency-free cleanup script for removing node_modules from all packages
 */

import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const output = execSync('pnpm ls -r --depth=-1 --json').toString();
const packages = JSON.parse(output);

const dirsToRemove = ['node_modules'];

for (const pkg of packages) {
    for (const dir of dirsToRemove) {
        const target = path.join(pkg.path, dir);
        if (existsSync(target)) {
            // eslint-disable-next-line no-console
            console.log(`Removing: ${target}`);
            await rm(target, { recursive: true, force: true });
        }
    }
}
