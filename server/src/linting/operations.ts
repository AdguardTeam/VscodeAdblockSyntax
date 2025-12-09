/**
 * @file Linting operations - core linting functionality for the language server.
 */

import { fileURLToPath } from 'node:url';

import type { LinterConfigFile } from '@adguard/aglint/cli';
import type { LinterConfig, LinterRunOptions } from '@adguard/aglint/linter';
import debounce from 'debounce';
import type { Connection, TextDocuments } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { ServerContext } from '../context/server-context';
import { getErrorMessage, getErrorStack } from '../utils/error';
import { isFileUri } from '../utils/uri';

import { createLintCacheKey } from './cache';
import { convertLinterResultToDiagnostics } from './diagnostics';

/**
 * Check if a document should be linted.
 *
 * @param textDocument Document to check.
 * @param serverContext Server context.
 *
 * @returns True if document should be linted.
 */
async function shouldLintDocument(
    textDocument: TextDocument,
    serverContext: ServerContext,
): Promise<boolean> {
    if (
        !isFileUri(textDocument.uri)
        || !serverContext.workspaceRoot
        || !serverContext.settings.enableAglint
        || !serverContext.aglintContext
    ) {
        return false;
    }

    const documentPath = fileURLToPath(textDocument.uri);
    const isIgnored = await serverContext.aglintContext.linterTree.isIgnored(documentPath);
    return !isIgnored;
}

/**
 * Try to get diagnostics from cache.
 *
 * @param textDocument Document to lint.
 * @param serverContext Server context.
 * @param connection Language server connection.
 * @param config Linter config.
 *
 * @returns Cached diagnostics if found, undefined otherwise.
 */
function tryGetCachedDiagnostics(
    textDocument: TextDocument,
    serverContext: ServerContext,
    connection: Connection,
    config: LinterConfig,
): ReturnType<typeof convertLinterResultToDiagnostics> | undefined {
    if (!serverContext.settings.enableInMemoryAglintCache) {
        return undefined;
    }

    const configHash = serverContext.aglintContext!.aglint.cli.getLinterConfigHash(config);
    const cacheKey = createLintCacheKey(
        textDocument.uri,
        serverContext.aglintContext!.aglint.version,
        textDocument.version,
        configHash,
    );

    const cachedDiagnostics = serverContext.lintingCache.get(cacheKey);
    if (cachedDiagnostics) {
        connection.console.debug(
            `[lsp] Linting completed for: ${fileURLToPath(textDocument.uri)} (from cache)`,
        );
    }

    return cachedDiagnostics;
}

/**
 * Perform actual linting of the document.
 *
 * @param textDocument Document to lint.
 * @param serverContext Server context.
 * @param connection Language server connection.
 * @param config Linter config.
 *
 * @returns Diagnostics from linting.
 */
async function performLinting(
    textDocument: TextDocument,
    serverContext: ServerContext,
    connection: Connection,
    config: LinterConfig,
): Promise<ReturnType<typeof convertLinterResultToDiagnostics>> {
    const documentPath = fileURLToPath(textDocument.uri);
    const text = textDocument.getText();

    connection.console.debug(`[lsp] Linting file: ${documentPath}`);

    const linterRunOptions: LinterRunOptions = {
        fileProps: {
            filePath: documentPath,
            content: text,
            cwd: serverContext.workspaceRoot!,
        },
        config,
        subParsers: serverContext.aglintContext!.aglint.linter.defaultSubParsers,
        loadRule: serverContext.aglintContext!.aglint.loadRule,
        // Need to include metadata to get the rule documentation
        includeMetadata: true,
        debug: serverContext.aglintContext!.debuggerInstance.module('linter-core'),
    };

    const linterResult = await serverContext.aglintContext!.aglint.linter.lint(linterRunOptions);
    const diagnostics = convertLinterResultToDiagnostics(linterResult, serverContext.aglintContext!);

    // Store result in cache if caching is enabled
    if (serverContext.settings.enableInMemoryAglintCache) {
        const configHash = serverContext.aglintContext!.aglint.cli.getLinterConfigHash(config);
        const cacheKey = createLintCacheKey(
            textDocument.uri,
            serverContext.aglintContext!.aglint.version,
            textDocument.version,
            configHash,
        );
        serverContext.lintingCache.set(cacheKey, diagnostics);
    }

    connection.console.debug(`[lsp] Linting completed for: ${documentPath}`);

    return diagnostics;
}

/**
 * Debounce delay for linting files.
 * It is used to avoid too frequent linting when the user modifies the file.
 */
const LINT_FILE_DEBOUNCE_DELAY = 100;

/**
 * Get the linter config for the given document.
 *
 * @param textDocument Document to get the linter config for.
 * @param serverContext Server context.
 *
 * @returns Linter config for the document or undefined if the document is not lintable.
 */
export async function getLinterConfig(
    textDocument: TextDocument,
    serverContext: ServerContext,
): Promise<LinterConfigFile | undefined> {
    // e.g. new unsaved documents
    if (!isFileUri(textDocument.uri) || !serverContext.workspaceRoot || !serverContext.aglintContext) {
        return undefined;
    }

    const config = await serverContext.aglintContext.linterTree.getResolvedConfig(fileURLToPath(textDocument.uri));

    return config;
}

/**
 * Lint the document and send the diagnostics to VSCode.
 *
 * @param textDocument Document to lint.
 * @param serverContext Server context.
 * @param connection Language server connection.
 */
export async function lintFile(
    textDocument: TextDocument,
    serverContext: ServerContext,
    connection: Connection,
): Promise<void> {
    // Check if document should be linted
    if (!(await shouldLintDocument(textDocument, serverContext))) {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }

    try {
        // Get linter config
        const config = await getLinterConfig(textDocument, serverContext);
        if (!config) {
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
            return;
        }

        // Normalize config for linting
        const normalizedConfig: LinterConfig = {
            platforms: config.platforms,
            rules: config.rules ?? {},
            allowInlineConfig: true,
        };

        // Try to get from cache first
        const cachedDiagnostics = tryGetCachedDiagnostics(
            textDocument,
            serverContext,
            connection,
            normalizedConfig,
        );

        if (cachedDiagnostics) {
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: cachedDiagnostics });
            return;
        }

        // Perform actual linting
        const diagnostics = await performLinting(
            textDocument,
            serverContext,
            connection,
            normalizedConfig,
        );

        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    } catch (error: unknown) {
        let message = `AGLint failed to lint the document: ${textDocument.uri}, got error: ${getErrorMessage(error)}`;
        const stack = getErrorStack(error);
        if (stack) {
            message += `, ${stack}`;
        }
        connection.console.error(`[lsp] ${message}`);

        // Reset the diagnostics for the document
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });

        // Notify the client that the linting failed
        await connection.sendNotification('aglint/status', { error });
    }
}

/**
 * Create a debounced version of lintFile.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 *
 * @returns Debounced lintFile function.
 */
export function createDebouncedLintFile(
    serverContext: ServerContext,
    connection: Connection,
): (textDocument: TextDocument) => void {
    return debounce((textDocument: TextDocument) => {
        lintFile(textDocument, serverContext, connection);
    }, LINT_FILE_DEBOUNCE_DELAY);
}

/**
 * Remove all diagnostics from all open text documents.
 *
 * @param documents Text document manager.
 * @param connection Language server connection.
 */
export function removeAllDiagnostics(documents: TextDocuments<TextDocument>, connection: Connection): void {
    documents.all().forEach((document) => {
        connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    });
}

/**
 * Rebuild the cached paths and revalidate any open text documents.
 *
 * @param serverContext Server context.
 * @param connection Language server connection.
 */
export async function refreshLinter(serverContext: ServerContext, connection: Connection): Promise<void> {
    if (!serverContext.settings.enableAglint || !serverContext.workspaceRoot) {
        removeAllDiagnostics(serverContext.documents, connection);
        return;
    }

    // Revalidate any open text documents
    // Note: No need to clear cache here - cache keys include AGLint version,
    // so version changes are handled automatically
    serverContext.documents.all().forEach((doc) => lintFile(doc, serverContext, connection));
}
