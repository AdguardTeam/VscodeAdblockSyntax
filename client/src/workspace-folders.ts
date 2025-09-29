/**
 * @file Utility functions for managing workspace folders in VSCode.
 */
import * as path from 'path';
import { workspace as Workspace, type WorkspaceFolder } from 'vscode';

/**
 * Cache of WorkspaceFolders sorted by path length (outermost first).
 */
let sortedFoldersCache: WorkspaceFolder[] | undefined;

/**
 * Checks if a file is inside a folder (by absolute fsPath).
 *
 * @param file Absolute or relative file path.
 * @param folderFsPath Absolute or relative folder path.
 *
 * @returns True if the file is inside the folder, false otherwise.
 */
export const fileInFolder = (file: string, folderFsPath: string): boolean => {
    const norm = (p: string) => path.resolve(p);
    const withSep = (p: string) => (p.endsWith(path.sep) ? p : p + path.sep);

    // Optional: make comparison case-insensitive on Windows
    const normalizeForCompare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);

    const root = normalizeForCompare(withSep(norm(folderFsPath)));
    const filePath = normalizeForCompare(norm(file));
    return filePath.startsWith(root);
};

/**
 * Returns workspace folders sorted by fsPath length ascending.
 * Shorter path means more "outer" folder.
 *
 * @returns Array of workspace folders sorted by path length.
 */
export const getSortedWorkspaceFolders = (): WorkspaceFolder[] => {
    if (sortedFoldersCache) {
        return sortedFoldersCache;
    }

    const folders = Workspace.workspaceFolders ?? [];
    sortedFoldersCache = [...folders].sort((a, b) => {
        return a.uri.fsPath.length - b.uri.fsPath.length;
    });

    return sortedFoldersCache;
};

/**
 * Finds the outer-most workspace folder that contains the given folder.
 *
 * @param folder The workspace folder to check.
 *
 * @returns The outer-most containing workspace folder, or the given folder if none contains it.
 */
export const getOuterMostWorkspaceFolder = (folder: WorkspaceFolder): WorkspaceFolder => {
    const target = folder.uri.fsPath;

    for (const candidate of getSortedWorkspaceFolders()) {
        if (fileInFolder(target, candidate.uri.fsPath)) {
            return candidate;
        }
    }

    return folder;
};

/**
 * Invalidate cache on workspace folder changes.
 */
Workspace.onDidChangeWorkspaceFolders(() => {
    sortedFoldersCache = undefined;
});
