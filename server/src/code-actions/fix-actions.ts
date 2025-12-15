/**
 * @file Code actions for AGLint fixes and suggestions.
 */

import { CodeAction, CodeActionKind, TextDocumentEdit } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { ServerContext } from '../context/server-context';

import { convertAglintFixToVscodeTextEdit } from './utils';

/**
 * Create code action to apply an AGLint fix.
 *
 * @param textDocument Text document.
 * @param ruleCode Rule code.
 * @param fix Fix command from AGLint.
 * @param context Server context.
 *
 * @returns Code action to apply the fix.
 */
export function createFixAction(
    textDocument: TextDocument,
    ruleCode: string | number,
    fix: unknown,
    context: ServerContext,
): CodeAction | null {
    if (!context.aglintContext?.aglint.linter.isLinterFixCommand(fix)) {
        return null;
    }

    const action = CodeAction.create(
        `Fix AGLint rule '${ruleCode}'`,
        CodeActionKind.QuickFix,
    );

    action.edit = {
        documentChanges: [
            TextDocumentEdit.create(
                { uri: textDocument.uri, version: textDocument.version },
                [convertAglintFixToVscodeTextEdit(textDocument, fix)],
            ),
        ],
    };

    return action;
}

/**
 * Create code actions for AGLint suggestions.
 *
 * @param textDocument Text document.
 * @param ruleCode Rule code.
 * @param suggestions Suggestions from AGLint.
 * @param context Server context.
 *
 * @returns Array of code actions for suggestions.
 */
export function createSuggestionActions(
    textDocument: TextDocument,
    ruleCode: string | number,
    suggestions: unknown,
    context: ServerContext,
): CodeAction[] {
    const actions: CodeAction[] = [];

    if (!context.aglintContext?.aglint.linter.isLinterSuggestions(suggestions)) {
        return actions;
    }

    for (const suggestion of suggestions) {
        const action = CodeAction.create(
            `Apply suggestion '${suggestion.message}' from AGLint rule '${ruleCode}'`,
            CodeActionKind.QuickFix,
        );

        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [convertAglintFixToVscodeTextEdit(textDocument, suggestion.fix)],
                ),
            ],
        };

        actions.push(action);
    }

    return actions;
}
