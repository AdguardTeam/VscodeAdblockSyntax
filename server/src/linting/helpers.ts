/**
 * @file Internal helpers for linting operations.
 */

import { fileURLToPath } from 'node:url';

import type { LinterConfig, LinterRunOptions } from '@adguard/aglint/linter';
import type { Connection } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { ServerContext } from '../context/server-context';
import { isFileUri } from '../utils/uri';

import { createLintCacheKey } from './cache';
import { convertLinterResultToDiagnostics } from './diagnostics';

/**
 * Debounce delay for linting files.
 * It is used to avoid too frequent linting when the user modifies the file.
 */
export const LINT_FILE_DEBOUNCE_DELAY = 100;

/**
 * Check if a document should be linted.
 *
 * @param textDocument Document to check.
 * @param serverContext Server context.
 *
 * @returns True if document should be linted.
 */
export async function shouldLintDocument(
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
export function tryGetCachedDiagnostics(
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
export async function performLinting(
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
