/**
 * @file Tests for code action utilities.
 */

import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
    convertAglintFixToVscodeTextEdit,
    convertAglintOffsetRangeToVscodeRange,
    getPreviousLineText,
    parseConfigCommentTolerant,
} from '../../src/code-actions/utils';

describe('parseConfigCommentTolerant', () => {
    it('should parse valid config comment rules', () => {
        const result = parseConfigCommentTolerant('! aglint-disable-next-line');
        expect(result).not.toBeNull();
    });

    it('should parse config comment with specific rules', () => {
        const result = parseConfigCommentTolerant('! aglint-disable-next-line rule-name');
        expect(result).not.toBeNull();
    });

    it('should return null for invalid config comments', () => {
        const result = parseConfigCommentTolerant('invalid-rule-format!!!');
        expect(result).toBeNull();
    });

    it('should handle parsing without throwing errors', () => {
        // The parser is tolerant and returns null instead of throwing
        // Test that various invalid inputs don't throw
        expect(() => {
            parseConfigCommentTolerant('invalid!!!');
        }).not.toThrow();

        expect(() => {
            parseConfigCommentTolerant('! aglint-enable-[invalid');
        }).not.toThrow();

        expect(() => {
            parseConfigCommentTolerant('');
        }).not.toThrow();
    });
});

describe('convertAglintOffsetRangeToVscodeRange', () => {
    it('should convert offset range to VSCode range', () => {
        const content = 'hello world\nfoo bar';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        // Range from index 6 to 11 ("world")
        const offsetRange: [number, number] = [6, 11];
        const range = convertAglintOffsetRangeToVscodeRange(document, offsetRange);

        expect(range.start.line).toBe(0);
        expect(range.start.character).toBe(6);
        expect(range.end.line).toBe(0);
        expect(range.end.character).toBe(11);
    });

    it('should handle multi-line ranges', () => {
        const content = 'line1\nline2\nline3';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        // Range from start of line2 to end of line2 (index 6 to 11)
        const offsetRange: [number, number] = [6, 11];
        const range = convertAglintOffsetRangeToVscodeRange(document, offsetRange);

        expect(range.start.line).toBe(1);
        expect(range.start.character).toBe(0);
        expect(range.end.line).toBe(1);
        expect(range.end.character).toBe(5);
    });

    it('should handle zero-length ranges (insertion points)', () => {
        const content = 'hello';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const offsetRange: [number, number] = [2, 2];
        const range = convertAglintOffsetRangeToVscodeRange(document, offsetRange);

        expect(range.start.line).toBe(0);
        expect(range.start.character).toBe(2);
        expect(range.end.line).toBe(0);
        expect(range.end.character).toBe(2);
    });

    it('should handle ranges at the start of document', () => {
        const content = 'hello world';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const offsetRange: [number, number] = [0, 5];
        const range = convertAglintOffsetRangeToVscodeRange(document, offsetRange);

        expect(range.start.line).toBe(0);
        expect(range.start.character).toBe(0);
        expect(range.end.line).toBe(0);
        expect(range.end.character).toBe(5);
    });

    it('should handle ranges at the end of document', () => {
        const content = 'hello';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const offsetRange: [number, number] = [0, 5];
        const range = convertAglintOffsetRangeToVscodeRange(document, offsetRange);

        expect(range.start.line).toBe(0);
        expect(range.start.character).toBe(0);
        expect(range.end.line).toBe(0);
        expect(range.end.character).toBe(5);
    });
});

describe('convertAglintFixToVscodeTextEdit', () => {
    it('should convert AGLint fix to VSCode text edit', () => {
        const content = 'hello world';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const fix = {
            range: [6, 11] as [number, number],
            text: 'universe',
        };

        const textEdit = convertAglintFixToVscodeTextEdit(document, fix);

        expect(textEdit.range.start.line).toBe(0);
        expect(textEdit.range.start.character).toBe(6);
        expect(textEdit.range.end.line).toBe(0);
        expect(textEdit.range.end.character).toBe(11);
        expect(textEdit.newText).toBe('universe');
    });

    it('should handle deletion (empty replacement text)', () => {
        const content = 'hello world';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const fix = {
            range: [5, 11] as [number, number],
            text: '',
        };

        const textEdit = convertAglintFixToVscodeTextEdit(document, fix);

        expect(textEdit.newText).toBe('');
    });

    it('should handle insertion (zero-length range)', () => {
        const content = 'hello';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const fix = {
            range: [5, 5] as [number, number],
            text: ' world',
        };

        const textEdit = convertAglintFixToVscodeTextEdit(document, fix);

        expect(textEdit.range.start.character).toBe(5);
        expect(textEdit.range.end.character).toBe(5);
        expect(textEdit.newText).toBe(' world');
    });

    it('should handle multi-line replacements', () => {
        const content = 'line1\nline2';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const fix = {
            range: [0, 5] as [number, number],
            text: 'first line',
        };

        const textEdit = convertAglintFixToVscodeTextEdit(document, fix);

        expect(textEdit.newText).toBe('first line');
    });
});

describe('getPreviousLineText', () => {
    it('should return previous line text', () => {
        const content = 'line 0\nline 1\nline 2';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 1);

        expect(previousLine).toBe('line 0');
    });

    it('should return undefined for line 0', () => {
        const content = 'line 0\nline 1';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 0);

        expect(previousLine).toBeUndefined();
    });

    it('should handle empty previous lines', () => {
        const content = '\nline 1';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 1);

        expect(previousLine).toBe('');
    });

    it('should get previous line for line 2', () => {
        const content = 'line 0\nline 1\nline 2';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 2);

        expect(previousLine).toBe('line 1');
    });

    it('should handle long lines correctly', () => {
        const longLine = 'a'.repeat(1000);
        const content = `${longLine}\nline 1`;
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 1);

        expect(previousLine).toBe(longLine);
    });

    it('should handle lines with special characters', () => {
        const content = 'line with $pecial ch@racters!\nnext line';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 1);

        expect(previousLine).toBe('line with $pecial ch@racters!');
    });

    it('should handle lines with tabs and spaces', () => {
        const content = '\t\tindented line\nnext line';
        const document = TextDocument.create('file:///test.txt', 'text', 1, content);

        const previousLine = getPreviousLineText(document, 1);

        expect(previousLine).toBe('\t\tindented line');
    });
});
