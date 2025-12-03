/**
 * @file Core linting logic for AGLint integration.
 */

import { fileURLToPath } from 'node:url';

import type { LinterConfigFile } from '@adguard/aglint/cli';
import type { LinterConfig, LinterRunOptions } from '@adguard/aglint/linter';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { ServerContext } from '../context/server-context';
import { getErrorMessage, getErrorStack } from '../utils/error';
import { isFileUri } from '../utils/uri';

import { createLintCacheKey, LintingCache } from './cache';
import { convertLinterResultToDiagnostics } from './diagnostics';

/**
 * Debounce delay for linting files in milliseconds.
 */
const LINT_FILE_DEBOUNCE_DELAY = 100;

/**
 * Linting cache instance.
 */
const lintCache = new LintingCache();

/**
 * Get the linter config for the given document.
 *
 * @param textDocument Document to get the linter config for.
 * @param context Server context.
 *
 * @returns Linter config for the document or undefined if the document is not lintable.
 */
async function getLinterConfig(
    textDocument: TextDocument,
    context: ServerContext,
): Promise<LinterConfigFile | undefined> {
    // e.g. new unsaved documents
    if (!isFileUri(textDocument.uri) || !context.workspaceRoot || !context.aglintContext) {
        return undefined;
    }

    const config = await context.aglintContext.linterTree.getResolvedConfig(fileURLToPath(textDocument.uri));

    return config;
}

/**
 * Lint the document and send the diagnostics to VSCode.
 *
 * @param textDocument Document to lint.
 * @param context Server context.
 */
export async function lintFile(textDocument: TextDocument, context: ServerContext): Promise<void> {
    if (
        !isFileUri(textDocument.uri)
        || !context.workspaceRoot
        || !context.settings.enableAglint
        || !context.aglintContext
        || await context.aglintContext.linterTree.isIgnored(fileURLToPath(textDocument.uri))
    ) {
        context.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }

    const documentPath = fileURLToPath(textDocument.uri);
    const startTime = Date.now();

    try {
        const config = await getLinterConfig(textDocument, context);

        if (!config) {
            context.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
            return;
        }

        const text = textDocument.getText();

        // Normalize config for linting (this is what will actually be used)
        const normalizedConfig: LinterConfig = {
            platforms: config.platforms,
            rules: config.rules ?? {},
            allowInlineConfig: true,
        };

        // Create cache key using document version and config hash
        const configHash = context.aglintContext.aglint.cli.getLinterConfigHash(normalizedConfig);
        const cacheKey = createLintCacheKey(
            textDocument.uri,
            context.aglintContext.aglint.version,
            textDocument.version,
            configHash,
        );

        // Check cache first if caching is enabled
        if (context.settings.enableInMemoryAglintCache) {
            const cachedDiagnostics = lintCache.get(cacheKey);
            if (cachedDiagnostics) {
                const duration = Date.now() - startTime;
                context.connection.console.debug(
                    `[lsp] Linting completed for: ${documentPath} (from cache, ${duration}ms)`,
                );
                context.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: cachedDiagnostics });
                return;
            }
        }

        context.connection.console.debug(`[lsp] Linting file: ${documentPath}`);

        const linterRunOptions: LinterRunOptions = {
            fileProps: {
                filePath: documentPath,
                content: text,
                cwd: context.workspaceRoot,
            },
            config: normalizedConfig,
            subParsers: context.aglintContext.aglint.linter.defaultSubParsers,
            loadRule: context.aglintContext.aglint.loadRule,
            // Need to include metadata to get the rule documentation
            includeMetadata: true,
            debug: context.aglintContext.debuggerInstance.module('linter-core'),
        };

        const linterResult = await context.aglintContext.aglint.linter.lint(linterRunOptions);
        const diagnostics = convertLinterResultToDiagnostics(linterResult, context.aglintContext);

        // Store result in cache if caching is enabled
        if (context.settings.enableInMemoryAglintCache) {
            lintCache.set(cacheKey, diagnostics);
        }

        const duration = Date.now() - startTime;
        context.connection.console.debug(`[lsp] Linting completed for: ${documentPath} (${duration}ms)`);

        context.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    } catch (error: unknown) {
        let message = `AGLint failed to lint the document: ${textDocument.uri}, got error: ${getErrorMessage(error)}`;
        const stack = getErrorStack(error);
        if (stack) {
            message += `, ${stack}`;
        }
        context.connection.console.error(`[lsp] ${message}`);

        // Reset the diagnostics for the document
        context.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });

        // Notify the client that the linting failed
        await context.connection.sendNotification('aglint/status', { error });
    }
}

/**
 * Remove all diagnostics from all open text documents.
 *
 * @param context Server context.
 */
export function removeAllDiagnostics(context: ServerContext): void {
    context.documents.all().forEach((document) => {
        context.connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    });
}

/**
 * Clear the linting cache.
 */
export function clearLintCache(): void {
    lintCache.clear();
}

/**
 * Get the debounce delay for linting files.
 *
 * @returns Debounce delay in milliseconds.
 */
export function getLintDebounceDelay(): number {
    return LINT_FILE_DEBOUNCE_DELAY;
}
