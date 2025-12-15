/**
 * @file Workspace-related utility functions.
 */

import { fileURLToPath } from 'node:url';

import type { InitializeParams } from 'vscode-languageserver/node';

import { isFileUri } from './uri';

/**
 * Extract the workspace root URI from initialization parameters.
 *
 * @param params Initialization parameters.
 *
 * @returns Workspace root URI or undefined if not found.
 */
export function extractWorkspaceRootUri(params: InitializeParams): string | undefined {
    let workspaceRootUri: string | undefined;

    if (params.initializationOptions && params.initializationOptions.workspaceFolder?.uri) {
        workspaceRootUri = params.initializationOptions.workspaceFolder.uri;
    } else if (params.rootUri) {
        workspaceRootUri = params.rootUri;
    } else if (params.workspaceFolders?.length) {
        workspaceRootUri = params.workspaceFolders[0].uri;
    }

    return workspaceRootUri;
}

/**
 * Get the workspace root path from the workspace root URI.
 *
 * @param rootUri Workspace root URI.
 *
 * @returns Workspace root path or undefined if the URI is not a file URI.
 */
export function getWorkspaceRootFromRootUri(rootUri: string | undefined): string | undefined {
    if (!rootUri || !isFileUri(rootUri)) {
        return undefined;
    }
    const path = fileURLToPath(rootUri);
    return path === null ? undefined : path;
}
