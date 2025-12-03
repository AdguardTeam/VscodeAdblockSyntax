/**
 * @file Code actions for disabling AGLint rules.
 */

import { ConfigCommentRuleParser } from '@adguard/agtree';
import {
    CodeAction,
    CodeActionKind,
    Position,
    Range,
    TextDocumentEdit,
    TextEdit,
} from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { LF, SPACE } from '../common/constants';
import type { ServerContext } from '../context/server-context';

import { getPreviousLineText, parseConfigCommentTolerant } from './utils';

/**
 * Create code action to disable AGLint for a line (no specific rule).
 *
 * @param textDocument Text document.
 * @param line Line number (0-based).
 * @param context Server context.
 *
 * @returns Code action to disable AGLint for the line.
 */
export function createDisableAglintAction(
    textDocument: TextDocument,
    line: number,
    context: ServerContext,
): CodeAction {
    const action = CodeAction.create('Disable AGLint for this line', CodeActionKind.QuickFix);

    // Make '! aglint-disable-next-line' prefix
    const configCommentType = context.aglintContext?.aglint.linter.LinterConfigCommentType;
    const disableNextLineType = configCommentType?.DisableNextLine ?? 'aglint-disable-next-line';
    const aglintDisableNextLinePrefix = `!${SPACE}${disableNextLineType}`;

    if (line === 0) {
        // If there are no previous lines, just insert the comment before the problematic line
        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.insert(
                        Position.create(line, 0),
                        `${aglintDisableNextLinePrefix}${LF}`,
                    )],
                ),
            ],
        };
        return action;
    }

    // If we have previous lines, check if there's already a disable comment
    const prevLine = getPreviousLineText(textDocument, line);
    if (!prevLine) {
        // Shouldn't happen, but handle gracefully
        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.insert(
                        Position.create(line, 0),
                        `${aglintDisableNextLinePrefix}${LF}`,
                    )],
                ),
            ],
        };
        return action;
    }

    const commentNode = parseConfigCommentTolerant(
        prevLine.trim(),
        (msg) => context.connection.console.debug(`[lsp] ${msg}`),
    );
    const previousLine = line - 1;

    // If the previous line is '! aglint-disable-next-line some-rule-name', replace it
    // to '! aglint-disable-next-line' - disable AGLint completely for the line
    if (
        commentNode
        && disableNextLineType
        && commentNode.command.value === disableNextLineType
        && commentNode.params
    ) {
        delete commentNode.params;

        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.replace(
                        Range.create(
                            Position.create(previousLine, 0),
                            Position.create(previousLine, prevLine.length),
                        ),
                        ConfigCommentRuleParser.generate(commentNode),
                    )],
                ),
            ],
        };
        return action;
    }

    // Otherwise just insert the comment before the problematic line
    action.edit = {
        documentChanges: [
            TextDocumentEdit.create(
                { uri: textDocument.uri, version: textDocument.version },
                [TextEdit.insert(
                    Position.create(line, 0),
                    `${aglintDisableNextLinePrefix}${LF}`,
                )],
            ),
        ],
    };

    return action;
}

/**
 * Create code action to disable a specific AGLint rule for a line.
 *
 * @param textDocument Text document.
 * @param line Line number (0-based).
 * @param ruleCode Rule code to disable.
 * @param context Server context.
 *
 * @returns Code action to disable the specific rule.
 */
export function createDisableRuleAction(
    textDocument: TextDocument,
    line: number,
    ruleCode: string | number,
    context: ServerContext,
): CodeAction {
    const action = CodeAction.create(
        `Disable AGLint rule '${ruleCode}' for this line`,
        CodeActionKind.QuickFix,
    );

    // Make '! aglint-disable-next-line' prefix
    const disableNextLineType = context.aglintContext?.aglint.linter
        .LinterConfigCommentType.DisableNextLine ?? 'aglint-disable-next-line';
    const aglintDisableNextLinePrefix = `!${SPACE}${disableNextLineType}`;

    if (line === 0) {
        // If there are no previous lines, just insert the comment before the problematic line
        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.insert(
                        Position.create(line, 0),
                        `${aglintDisableNextLinePrefix}${SPACE}${ruleCode}${LF}`,
                    )],
                ),
            ],
        };
        return action;
    }

    // If we have previous lines, check if there's already a disable comment
    const prevLine = getPreviousLineText(textDocument, line);
    if (!prevLine) {
        // Shouldn't happen, but handle gracefully
        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.insert(
                        Position.create(line, 0),
                        `${aglintDisableNextLinePrefix}${SPACE}${ruleCode}${LF}`,
                    )],
                ),
            ],
        };
        return action;
    }

    const commentNode = parseConfigCommentTolerant(
        prevLine.trim(),
        (msg) => context.connection.console.debug(`[lsp] ${msg}`),
    );
    const previousLine = line - 1;

    // If the previous line is '! aglint-disable-next-line some-rule-name', add the new rule
    if (
        commentNode
        && disableNextLineType
        && commentNode.command.value === disableNextLineType
        && commentNode.params
        && commentNode.params.type === 'ParameterList'
    ) {
        commentNode.params.children.push({
            type: 'Value',
            value: String(ruleCode),
        });

        action.edit = {
            documentChanges: [
                TextDocumentEdit.create(
                    { uri: textDocument.uri, version: textDocument.version },
                    [TextEdit.replace(
                        Range.create(
                            Position.create(previousLine, 0),
                            Position.create(previousLine, prevLine.length),
                        ),
                        ConfigCommentRuleParser.generate(commentNode),
                    )],
                ),
            ],
        };
        return action;
    }

    // Otherwise just insert the comment before the problematic line
    action.edit = {
        documentChanges: [
            TextDocumentEdit.create(
                { uri: textDocument.uri, version: textDocument.version },
                [TextEdit.insert(
                    Position.create(line, 0),
                    `${aglintDisableNextLinePrefix}${SPACE}${ruleCode}${LF}`,
                )],
            ),
        ],
    };

    return action;
}

/**
 * Create code action to remove a problematic rule entirely.
 *
 * @param textDocument Text document.
 * @param line Line number (0-based).
 *
 * @returns Code action to remove the rule.
 */
export function createRemoveRuleAction(textDocument: TextDocument, line: number): CodeAction {
    const action = CodeAction.create('Remove this rule', CodeActionKind.QuickFix);

    action.edit = {
        documentChanges: [
            TextDocumentEdit.create(
                { uri: textDocument.uri, version: textDocument.version },
                [TextEdit.del(Range.create(
                    Position.create(line, 0),
                    Position.create(line + 1, 0),
                ))],
            ),
        ],
    };

    return action;
}
