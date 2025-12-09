/**
 * @file Event handlers - registration and handling of language server events.
 */

import { fileURLToPath } from 'node:url';

import type { Connection, TextDocuments } from 'vscode-languageserver/node';
import { DidChangeConfigurationNotification } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { handleCodeAction } from '../code-actions';
import type { ServerContext } from '../context/server-context';
import { createDebouncedLintFile, refreshLinter, removeAllDiagnostics } from '../linting/orchestration';

import { createRetryAglintLoading, pullSettings } from './configuration';

/**
 * Register all event handlers for the language server.
 *
 * @param connection Language server connection.
 * @param documents Text document manager.
 * @param serverContext Server context.
 */
export function registerEventHandlers(
    connection: Connection,
    documents: TextDocuments<TextDocument>,
    serverContext: ServerContext,
): void {
    // Create debounced lintFile function
    const lintFileDebounced = createDebouncedLintFile(serverContext, connection);

    // Create retry AGLint loading function
    const retryAglintLoading = createRetryAglintLoading(serverContext, connection);

    // Code action handler
    connection.onCodeAction((params) => handleCodeAction(params, serverContext));

    // Configuration change handler
    connection.onDidChangeConfiguration(async () => {
        await pullSettings(serverContext, connection);
    });

    // Log level change handler
    connection.onNotification('client/logLevelChanged', (params: { enableAglintDebug: boolean }) => {
        const requestedDebugMode = params.enableAglintDebug;

        // If AGLint context exists, check current state and update if needed
        if (serverContext.aglintContext) {
            const currentDebugMode = serverContext.aglintContext.debuggerInstance.isEnabled();

            // If debug state didn't change, nothing to do
            if (currentDebugMode === requestedDebugMode) {
                return;
            }

            const status = requestedDebugMode ? 'enabled' : 'disabled';
            connection.console.info(`[lsp] AGLint debug mode ${status} (log level changed)`);

            if (requestedDebugMode) {
                serverContext.aglintContext.debuggerInstance.enable();
            } else {
                serverContext.aglintContext.debuggerInstance.disable();
            }
        } else {
            // AGLint not initialized yet, just store the initial state for when it is created
            serverContext.updateInitialDebugMode(requestedDebugMode);
        }
    });

    // Watched files change handler
    connection.onDidChangeWatchedFiles(async (events) => {
        const { changes } = events;
        let shouldRetryAglint = false;
        let hasConfigChanges = false;

        connection.console.debug(`[lsp] Watched files changed: ${changes.length} file(s)`);

        for (const change of changes) {
            const filePath = fileURLToPath(change.uri);
            connection.console.info(`[lsp] File changed: ${filePath} (type: ${change.type})`);

            // Check if package.json or node_modules changed (for AGLint installation detection)
            if (filePath.endsWith('package.json') || filePath.endsWith('node_modules')) {
                shouldRetryAglint = true;
            }

            // Check if it's a config file change
            const isConfigFile = filePath.includes('.aglintrc') || filePath.includes('aglint.config');
            if (isConfigFile) {
                hasConfigChanges = true;
                connection.console.debug(`[lsp] Config file detected: ${filePath}`);
            }

            // Notify AGLint's linter tree about the change
            if (serverContext.aglintContext) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await serverContext.aglintContext.linterTree.changed(filePath);
                    connection.console.debug(`[lsp] Notified linterTree about change: ${filePath}`);
                } catch (error) {
                    connection.console.error(`[lsp] Error notifying linterTree: ${String(error)}`);
                }
            } else {
                connection.console.warn('[lsp] AGLint context not initialized, skipping linterTree notification');
            }
        }

        // If package.json or node_modules changed and loading previously failed, schedule a retry
        // Use debounce to wait for file system operations to settle (e.g., during npm install)
        if (shouldRetryAglint && serverContext.aglintLoadingFailed && !serverContext.aglintLoading) {
            connection.console.info(
                '[lsp] package.json or node_modules changed, will retry AGLint loading after settle',
            );
            retryAglintLoading();
        }

        // If config files changed, refresh all diagnostics
        if (hasConfigChanges) {
            connection.console.info('[lsp] Config file changed, refreshing linter');
            // Reset current file diagnostics
            removeAllDiagnostics(documents, connection);

            // Note: No need to clear cache here - cache keys include config hash,
            // so config changes are handled automatically
            await refreshLinter(serverContext, connection);
        }
    });

    // Document content change handler
    documents.onDidChangeContent((change) => {
        lintFileDebounced(change.document);
    });

    // Initialized handler
    connection.onInitialized(async () => {
        if (serverContext.hasConfigurationCapability) {
            // Register for all configuration changes.
            connection.client.register(DidChangeConfigurationNotification.type, undefined);
        }

        if (serverContext.hasWorkspaceFolderCapability) {
            connection.workspace.onDidChangeWorkspaceFolders(() => {
                connection.console.warn('[lsp] Workspace folder change event received.');
            });
        }

        if (!serverContext.workspaceRoot) {
            connection.console.error('[lsp] Could not determine the workspace root of the VSCode instance');
        } else {
            // Pull the settings from VSCode
            await pullSettings(serverContext, connection);

            connection.console.info(
                `[lsp] AGLint Language Server initialized in workspace: ${serverContext.workspaceRoot}`,
            );
        }
    });
}

/**
 * Setup workspace folder capability handler.
 *
 * @param connection Language server connection.
 * @param serverContext Server context.
 */
export function setupWorkspaceFolderHandler(connection: Connection, serverContext: ServerContext): void {
    // Since we start a new server instance for each workspace folder,
    // we do not need to handle workspace folder changes.
    if (serverContext.hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(() => {
            connection.console.warn(
                '[lsp] Workspace folder change event received (ignored by per-folder server instance).',
            );
        });
    }
}
