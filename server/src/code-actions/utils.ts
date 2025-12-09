/**
 * @file Shared utilities for code actions.
 */

import type { LinterFixCommand, LinterOffsetRange } from '@adguard/aglint/linter';
import type { ConfigCommentRule } from '@adguard/agtree';
import { ConfigCommentRuleParser } from '@adguard/agtree';
import {
    Position,
    Range,
    TextEdit,
    uinteger,
} from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { getErrorMessage } from '../utils/error';

/**
 * Parse AGLint config comment rule in a tolerant way (does not throw on parsing error).
 *
 * @param rule Rule to parse.
 * @param logError Optional error logging function.
 *
 * @returns AGLint config comment rule node or null if parsing failed.
 */
export function parseConfigCommentTolerant(
    rule: string,
    logError?: (message: string) => void,
): ConfigCommentRule | null {
    try {
        return ConfigCommentRuleParser.parse(rule);
    } catch (error: unknown) {
        if (logError) {
            logError(`'${rule}' is not a valid AGLint config comment rule: ${getErrorMessage(error)}`);
        }
        return null;
    }
}

/**
 * Convert AGLint offset range to VSCode range.
 *
 * @param textDocument Text document.
 * @param range AGLint offset range.
 *
 * @returns VSCode range.
 */
export function convertAglintOffsetRangeToVscodeRange(
    textDocument: TextDocument,
    range: LinterOffsetRange,
): Range {
    const [startOffset, endOffset] = range;
    const start = textDocument.positionAt(startOffset);
    const end = textDocument.positionAt(endOffset);
    return Range.create(start, end);
}

/**
 * Convert AGLint fix to VSCode text edit.
 *
 * @param textDocument Text document.
 * @param fix AGLint fix.
 *
 * @returns VSCode text edit.
 */
export function convertAglintFixToVscodeTextEdit(textDocument: TextDocument, fix: LinterFixCommand): TextEdit {
    return TextEdit.replace(
        convertAglintOffsetRangeToVscodeRange(textDocument, fix.range),
        fix.text,
    );
}

/**
 * Get previous line text from document.
 *
 * @param textDocument Text document.
 * @param line Line number (0-based).
 *
 * @returns Previous line text or undefined if line is 0.
 */
export function getPreviousLineText(textDocument: TextDocument, line: number): string | undefined {
    if (line === 0) {
        return undefined;
    }

    const previousLine = line - 1;
    return textDocument.getText(
        Range.create(
            Position.create(previousLine, 0),
            // Note: we do not know the length of the previous line, so we use the max value
            Position.create(previousLine, uinteger.MAX_VALUE),
        ),
    );
}
