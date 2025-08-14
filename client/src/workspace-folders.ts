/**
 * @file Utility functions for managing workspace folders in VSCode.
 */

import { Uri, workspace as Workspace, type WorkspaceFolder } from 'vscode';

/**
 * Caches the sorted workspace folders.
 */
let sortedWorkspaceFolders: string[] | undefined;

/**
 * Normalizes a workspace folder URI to always have a trailing slash.
 *
 * @param folder - The workspace folder to normalize.
 * @returns The normalized folder URI as a string, guaranteed to end with `/`.
 */
const normalizeWorkspaceFolder = (folder: WorkspaceFolder): string => {
    const result = folder.uri.toString();
    return result.endsWith('/') ? result : `${result}/`;
};

/**
 * Retrieves the list of workspace folder URIs sorted by their length.
 * This helps with determining the outer-most workspace folder for a given path.
 *
 * The result is cached for performance and reset when the workspace folders change.
 *
 * @returns An array of normalized workspace folder URIs sorted in ascending order by length.
 */
export const getSortedWorkspaceFolders = (): string[] => {
    if (sortedWorkspaceFolders !== undefined) {
        return sortedWorkspaceFolders;
    }

    if (!Workspace.workspaceFolders) {
        sortedWorkspaceFolders = [];
        return sortedWorkspaceFolders;
    }

    sortedWorkspaceFolders = Workspace.workspaceFolders
        .map(normalizeWorkspaceFolder)
        .sort((a, b) => a.length - b.length);

    return sortedWorkspaceFolders;
};

/**
 * Finds the outer-most workspace folder that contains the given folder.
 *
 * If multiple workspace folders are nested, this function returns the top-most
 * folder that includes the provided folder’s path.
 *
 * @param folder The workspace folder to check.
 * @returns The outer-most containing workspace folder, or the given folder if no outer folder exists.
 */
export const getOuterMostWorkspaceFolder = (folder: WorkspaceFolder): WorkspaceFolder => {
    const sorted = getSortedWorkspaceFolders();

    if (sorted.length === 0) {
        return folder;
    }

    for (const element of sorted) {
        const uri = normalizeWorkspaceFolder(folder);
        if (uri.startsWith(element)) {
            return Workspace.getWorkspaceFolder(Uri.parse(element))!;
        }
    }

    return folder;
};

/**
 * Resets the cached sorted workspace folders when the workspace changes.
 */
Workspace.onDidChangeWorkspaceFolders(() => {
    sortedWorkspaceFolders = undefined;
});
