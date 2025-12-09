/**
 * @file Settings operations - configuration and settings management for the language server.
 */

import { pathToFileURL } from 'node:url';

import debounce from 'debounce';
import type { Connection } from 'vscode-languageserver/node';

import { AglintContext } from '../context/aglint-context';
import type { ServerContext } from '../context/server-context';
import { refreshLinter, removeAllDiagnostics } from '../linting/orchestration';
import { defaultSettings } from '../settings';

/**
 * Fetch settings from the workspace configuration.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 */
async function fetchSettings(serverContext: ServerContext, connection: Connection): Promise<void> {
    if (serverContext.hasConfigurationCapability) {
        const scopeUri = serverContext.workspaceRoot
            ? pathToFileURL(serverContext.workspaceRoot).toString()
            : undefined;
        const receivedSettings = await connection.workspace.getConfiguration({ scopeUri, section: 'adblock' });

        // Update the settings. No need to validate them, VSCode does this for us based on the schema
        // specified in the package.json
        // If we didn't receive any settings, use the default ones
        serverContext.updateSettings(receivedSettings || defaultSettings);
    } else {
        serverContext.updateSettings(defaultSettings);
    }
}

/**
 * Handle cache management when cache setting changes.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 * @param previousEnableCache Previous cache enable state.
 */
function handleCacheChanges(
    serverContext: ServerContext,
    connection: Connection,
    previousEnableCache: boolean,
): void {
    // Clear cache if caching was disabled
    if (previousEnableCache && !serverContext.settings.enableInMemoryAglintCache) {
        serverContext.lintingCache.clear();
        connection.console.info('[lsp] AGLint cache cleared (caching disabled)');
    }

    // Log cache setting changes at the end
    if (previousEnableCache !== serverContext.settings.enableInMemoryAglintCache) {
        if (serverContext.settings.enableInMemoryAglintCache) {
            connection.console.info('[lsp] In-memory linting cache enabled');
        } else {
            connection.console.info('[lsp] In-memory linting cache disabled');
            serverContext.lintingCache.clear();
            connection.console.debug('[lsp] Cache cleared');
        }
    }
}

/**
 * Check if settings have changed and warrant a full refresh.
 *
 * @param serverContext Server context.
 * @param previousEnableAglint Previous AGLint enable state.
 * @param previousEnableCache Previous cache enable state.
 *
 * @returns True if settings changed and need processing.
 */
function shouldProcessSettings(
    serverContext: ServerContext,
    previousEnableAglint: boolean,
    previousEnableCache: boolean,
): boolean {
    // If nothing changed and AGLint is already initialized OR loading failed, skip heavy work
    if (
        (serverContext.aglintContext || serverContext.aglintLoadingFailed)
        && previousEnableAglint === serverContext.settings.enableAglint
        && previousEnableCache === serverContext.settings.enableInMemoryAglintCache
    ) {
        return false;
    }
    return true;
}

/**
 * Initialize AGLint context if needed.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 *
 * @returns True if initialization succeeded or was not needed, false if failed.
 */
async function ensureAglintContext(
    serverContext: ServerContext,
    connection: Connection,
): Promise<boolean> {
    // Check if initialization is needed
    if (
        serverContext.aglintContext
        || serverContext.aglintLoadingFailed
        || serverContext.aglintLoading
    ) {
        return true;
    }

    if (!serverContext.workspaceRoot) {
        connection.console.error('[lsp] Workspace root is not defined');
        removeAllDiagnostics(serverContext.documents, connection);
        return false;
    }

    // Set loading flag to prevent concurrent initialization
    serverContext.setAglintLoading(true);

    try {
        const context = await AglintContext.create(
            connection,
            serverContext.documents,
            serverContext.workspaceRoot,
            serverContext.initialDebugMode,
        );

        serverContext.updateAglintContext(context);

        if (!serverContext.aglintContext) {
            serverContext.setAglintLoadingFailed(true);
            connection.console.info(
                '[lsp] AGLint loading failed. Will retry when package.json or node_modules changes.',
            );
            removeAllDiagnostics(serverContext.documents, connection);
            return false;
        }

        return true;
    } finally {
        // Always clear loading flag
        serverContext.setAglintLoading(false);
    }
}

/**
 * Pull the settings from VSCode and update the settings variable. It also
 * re-builts the cached paths and revalidates any open text documents.
 *
 * "In this model the clients simply sends an empty change event to signal that the settings have
 * changed and must be reread".
 *
 * @see https://github.com/microsoft/vscode-languageserver-node/issues/380#issuecomment-414691493
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 */
export async function pullSettings(serverContext: ServerContext, connection: Connection): Promise<void> {
    const previousEnableAglint = serverContext.settings.enableAglint;
    const previousEnableCache = serverContext.settings.enableInMemoryAglintCache;

    // Fetch updated settings
    await fetchSettings(serverContext, connection);

    // Check if we need to process settings changes
    if (!shouldProcessSettings(serverContext, previousEnableAglint, previousEnableCache)) {
        return;
    }

    // Handle cache changes
    handleCacheChanges(serverContext, connection, previousEnableCache);

    // Send status notification about AGLint being enabled/disabled
    connection.sendNotification('aglint/status', { aglintEnabled: serverContext.settings.enableAglint });

    // If AGLint is disabled, clean up and return early
    if (!serverContext.settings.enableAglint) {
        removeAllDiagnostics(serverContext.documents, connection);
        connection.console.debug('[lsp] AGLint is disabled');
        return;
    }

    connection.console.debug('[lsp] AGLint integration is enabled');

    // Initialize AGLint context if needed
    const contextReady = await ensureAglintContext(serverContext, connection);
    if (!contextReady) {
        return;
    }

    await refreshLinter(serverContext, connection);
}

/**
 * Create a debounced function to retry AGLint loading after package.json or node_modules changes.
 * Waits 2 seconds for file system operations to settle before attempting reload.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 *
 * @returns Debounced retry function.
 */
export function createRetryAglintLoading(
    serverContext: ServerContext,
    connection: Connection,
): ReturnType<typeof debounce<() => Promise<void>>> {
    return debounce(async () => {
        if (serverContext.aglintLoadingFailed && !serverContext.aglintLoading) {
            connection.console.info('[lsp] Retrying AGLint loading after package changes settled');
            serverContext.setAglintLoadingFailed(false);
            await pullSettings(serverContext, connection);
        }
    }, 2000);
}
