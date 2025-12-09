/**
 * @file Conversion utilities between AGLint and VSCode types.
 */

import type { LinterFixCommand, LinterOffsetRange } from '@adguard/aglint/linter';
import { Range, type TextEdit } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Convert AGLint offset range to VSCode range.
 *
 * @param textDocument Text document.
 * @param range AGLint offset range.
 *
 * @returns VSCode range.
 */
export function convertAglintOffsetToVscodeRange(textDocument: TextDocument, range: LinterOffsetRange): Range {
    const [startOffset, endOffset] = range;
    const start = textDocument.positionAt(startOffset);
    const end = textDocument.positionAt(endOffset);
    return Range.create(start, end);
}

/**
 * Convert AGLint fix to VSCode text edit.
 *
 * @param textDocument Text document.
 * @param fix AGLint fix command.
 *
 * @returns VSCode text edit.
 */
export function convertAglintFixToVscodeEdit(textDocument: TextDocument, fix: LinterFixCommand): TextEdit {
    return {
        range: convertAglintOffsetToVscodeRange(textDocument, fix.range),
        newText: fix.text,
    };
}
