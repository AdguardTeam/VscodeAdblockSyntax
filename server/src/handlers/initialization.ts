/**
 * @file Initialization operations - server initialization logic.
 */

import type { InitializeParams, InitializeResult } from 'vscode-languageserver/node';
import { TextDocumentSyncKind } from 'vscode-languageserver/node';

import type { ServerContext } from '../context/server-context';
import { extractWorkspaceRootUri, getWorkspaceRootFromRootUri } from '../utils/workspace';

/**
 * Handle the server initialization request.
 *
 * @param params Initialization parameters from the client.
 * @param serverContext Server context.
 *
 * @returns Initialization result with server capabilities.
 */
export function handleInitialize(
    params: InitializeParams,
    serverContext: ServerContext,
): InitializeResult {
    const { capabilities, initializationOptions } = params;

    // Get initial debug state from client (based on VSCode's log level)
    if (initializationOptions && typeof initializationOptions.enableAglintDebug === 'boolean') {
        serverContext.updateInitialDebugMode(initializationOptions.enableAglintDebug);
    }

    // Determine workspace root using helper functions
    const workspaceRootUri = extractWorkspaceRootUri(params);
    const rootFromUri = getWorkspaceRootFromRootUri(workspaceRootUri);
    serverContext.setWorkspaceRoot(rootFromUri !== undefined ? rootFromUri : (params.rootPath ?? undefined));

    let message = 'AGLint Language Server initialized ';
    if (serverContext.workspaceRoot) {
        message += `with workspace root: ${serverContext.workspaceRoot}`;
    } else {
        message += 'without workspace root';
    }
    serverContext.connection.console.debug(`[lsp] ${message}`);

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    serverContext.setConfigurationCapability(!!(
        capabilities.workspace && !!capabilities.workspace.configuration
    ));

    serverContext.setWorkspaceFolderCapability(!!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    ));

    // Define the capabilities of the language server here
    const result: InitializeResult = {
        capabilities: {
            codeActionProvider: true,
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
            },
        },
    };

    return result;
}
