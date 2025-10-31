import { access } from 'node:fs/promises';

/**
 * Checks if a file exists.
 *
 * @param path Path to the file.
 *
 * @returns True if the file exists, false otherwise.
 */
export const fileExists = async (path: string): Promise<boolean> => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};
