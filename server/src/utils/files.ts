/**
 * @file Utility functions for files
 */

import { access } from 'fs/promises';

/**
 * Checks if the given path exists.
 *
 * @param path Path to check.
 * @returns `true` if the path exists, `false` otherwise.
 */
export async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch (error: unknown) {
        return false;
    }
}
