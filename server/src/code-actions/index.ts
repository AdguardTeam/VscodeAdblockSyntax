/**
 * @file Code action handler - provides quick fixes for AGLint diagnostics.
 */

import type { CodeAction, CodeActionParams } from 'vscode-languageserver/node';

import type { ServerContext } from '../context/server-context';

import { createDisableAglintAction, createDisableRuleAction, createRemoveRuleAction } from './disable-rule';
import { createFixAction, createSuggestionActions } from './fix-actions';

/**
 * Handle code action request from the client.
 *
 * @param params Code action parameters.
 * @param context Server context.
 *
 * @returns Array of code actions.
 */
export function handleCodeAction(params: CodeActionParams, context: ServerContext): CodeAction[] | undefined {
    const textDocument = context.documents.get(params.textDocument.uri);
    if (textDocument === undefined) {
        return undefined;
    }

    const { diagnostics } = params.context;
    const actions: CodeAction[] = [];

    for (const diagnostic of diagnostics) {
        const { code, range } = diagnostic;
        const { line } = range.start;

        // If no code, it's likely a parsing error - offer to disable AGLint or remove the rule
        if (!code) {
            actions.push(createDisableAglintAction(textDocument, line, context));
            actions.push(createRemoveRuleAction(textDocument, line));
            continue;
        }

        // If there's a fix available, offer to apply it
        if (diagnostic.data?.fix) {
            const fixAction = createFixAction(textDocument, code, diagnostic.data.fix, context);
            if (fixAction) {
                actions.push(fixAction);
            }
        }

        // If there are suggestions, offer to apply them
        if (diagnostic.data?.suggestions) {
            const suggestionActions = createSuggestionActions(
                textDocument,
                code,
                diagnostic.data.suggestions,
                context,
            );
            actions.push(...suggestionActions);
        }

        // Always offer to disable the specific rule
        actions.push(createDisableRuleAction(textDocument, line, code, context));
    }

    return actions;
}
