import { describe, expect, it } from 'vitest';

import { isFileUri } from '../../src/utils/uri';

describe('isFileUri', () => {
    it('returns true for a valid file URI', () => {
        expect(isFileUri('file:///Users/test/project/file.txt')).toBe(true);
        expect(isFileUri('file:///C:/Users/test/file.txt')).toBe(true); // Windows-style path
    });

    it('returns false for non-file URIs', () => {
        expect(isFileUri('http://example.com')).toBe(false);
        expect(isFileUri('https://example.com')).toBe(false);
        expect(isFileUri('ftp://example.com')).toBe(false);
        expect(isFileUri('vscode://file/path')).toBe(false);
    });

    it('is case-insensitive for scheme', () => {
        expect(isFileUri('FILE:///Users/test/file.txt')).toBe(true);
        expect(isFileUri('File:///Users/test/file.txt')).toBe(true);
    });
});
