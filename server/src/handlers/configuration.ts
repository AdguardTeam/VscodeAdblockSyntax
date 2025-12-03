/**
 * @file Configuration and settings handlers.
 */

import { pathToFileURL } from 'node:url';

import debounce from 'debounce';

import { AglintContext } from '../context/aglint-context';
import type { ServerContext } from '../context/server-context';
import { clearLintCache, lintFile, removeAllDiagnostics } from '../linting/linter';

/**
 * Rebuild the cached paths and revalidate any open text documents.
 *
 * @param context Server context.
 */
export async function refreshLinter(context: ServerContext): Promise<void> {
    if (!context.settings.enableAglint || !context.workspaceRoot) {
        removeAllDiagnostics(context);
        return;
    }

    // Revalidate any open text documents
    // Note: No need to clear cache here - cache keys include AGLint version,
    // so version changes are handled automatically
    context.documents.all().forEach((doc) => lintFile(doc, context));
}

/**
 * Pull the settings from VSCode and update the settings variable.
 * Also rebuilds the cached paths and revalidates any open text documents.
 *
 * @param context Server context.
 */
export async function pullSettings(context: ServerContext): Promise<void> {
    const previousEnableAglint = context.settings.enableAglint;
    const previousEnableCache = context.settings.enableInMemoryAglintCache;

    if (context.hasConfigurationCapability) {
        const scopeUri = context.workspaceRoot ? pathToFileURL(context.workspaceRoot).toString() : undefined;
        const receivedSettings = await context.connection.workspace.getConfiguration({
            scopeUri,
            section: 'adblock',
        });

        // Update the settings. No need to validate them, VSCode does this for us
        context.settings = receivedSettings || context.settings;
    }

    // If nothing changed and AGLint is already initialized OR loading failed, skip heavy work
    if (
        (context.aglintContext || context.aglintLoadingFailed)
        && previousEnableAglint === context.settings.enableAglint
        && previousEnableCache === context.settings.enableInMemoryAglintCache
    ) {
        return;
    }

    // Clear cache if caching was disabled
    if (previousEnableCache && !context.settings.enableInMemoryAglintCache) {
        clearLintCache();
        context.connection.console.info('[lsp] AGLint cache cleared (caching disabled)');
    }

    // Send status notification about AGLint being enabled/disabled
    context.connection.sendNotification('aglint/status', { aglintEnabled: context.settings.enableAglint });

    // If AGLint is disabled, clean up and return early
    if (!context.settings.enableAglint) {
        removeAllDiagnostics(context);
        context.connection.console.debug('[lsp] AGLint is disabled');
        return;
    }

    context.connection.console.debug('[lsp] AGLint integration is enabled');

    // Initialize AGLint context if not already initialized
    if (!context.aglintContext && !context.aglintLoadingFailed && !context.aglintLoading) {
        if (!context.workspaceRoot) {
            context.connection.console.error('[lsp] Workspace root is not defined');
            removeAllDiagnostics(context);
            return;
        }

        // Set loading flag to prevent concurrent initialization
        context.aglintLoading = true;

        try {
            context.aglintContext = await AglintContext.create(
                context.connection,
                context.documents,
                context.workspaceRoot,
                context.initialDebugMode,
            );

            if (!context.aglintContext) {
                context.aglintLoadingFailed = true;
                context.connection.console.info(
                    '[lsp] AGLint loading failed. Will retry when package.json or node_modules changes.',
                );
                removeAllDiagnostics(context);
                return;
            }
        } finally {
            // Always clear loading flag
            context.aglintLoading = false;
        }
    }

    // Log cache setting changes
    if (previousEnableCache !== context.settings.enableInMemoryAglintCache) {
        if (context.settings.enableInMemoryAglintCache) {
            context.connection.console.info('[lsp] In-memory linting cache enabled');
        } else {
            context.connection.console.info('[lsp] In-memory linting cache disabled');
            clearLintCache();
            context.connection.console.debug('[lsp] Cache cleared');
        }
    }

    await refreshLinter(context);
}

/**
 * Debounced function to retry AGLint loading after package.json or node_modules changes.
 * Waits 2 seconds for file system operations to settle before attempting reload.
 *
 * @param context Server context.
 *
 * @returns Debounced retry function.
 */
export function createRetryAglintLoading(context: ServerContext) {
    return debounce(async () => {
        if (context.aglintLoadingFailed && !context.aglintLoading) {
            context.connection.console.info('[lsp] Retrying AGLint loading after package changes settled');
            context.aglintLoadingFailed = false;
            await pullSettings(context);
        }
    }, 2000);
}
