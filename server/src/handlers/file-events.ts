/**
 * @file File change event handlers.
 */

import { fileURLToPath } from 'node:url';

import type { DidChangeWatchedFilesParams } from 'vscode-languageserver/node';

import type { ServerContext } from '../context/server-context';
import { removeAllDiagnostics } from '../linting/linter';

import { refreshLinter } from './configuration';

/**
 * Handle file change events from the client.
 *
 * @param params File change parameters.
 * @param context Server context.
 * @param retryAglintLoading Debounced function to retry AGLint loading.
 */
export async function handleFileChanges(
    params: DidChangeWatchedFilesParams,
    context: ServerContext,
    retryAglintLoading: () => void,
): Promise<void> {
    const { changes } = params;
    let shouldRetryAglint = false;

    for (const change of changes) {
        const filePath = fileURLToPath(change.uri);
        context.connection.console.info(`[lsp] Configuration file changed: ${filePath}`);

        // Check if package.json or node_modules changed (for AGLint installation detection)
        if (filePath.endsWith('package.json') || filePath.endsWith('node_modules')) {
            shouldRetryAglint = true;
        }

        // eslint-disable-next-line no-await-in-loop
        await context.aglintContext?.linterTree.changed(filePath);
    }

    // If package.json or node_modules changed and loading previously failed, schedule a retry
    // Use debounce to wait for file system operations to settle (e.g., during npm install)
    if (shouldRetryAglint && context.aglintLoadingFailed && !context.aglintLoading) {
        context.connection.console.info(
            '[lsp] package.json or node_modules changed, will retry AGLint loading after settle',
        );
        retryAglintLoading();
    }

    // Reset current file diagnostics
    removeAllDiagnostics(context);

    // Note: No need to clear cache here - cache keys include config hash,
    // so config changes are handled automatically
    await refreshLinter(context);
}
