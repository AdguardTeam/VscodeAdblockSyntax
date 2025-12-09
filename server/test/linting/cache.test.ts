/**
 * @file Tests for linting cache management.
 */

import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createLintCacheKey, LintingCache } from '../../src/linting/cache';

describe('createLintCacheKey', () => {
    it('should create a unique key from uri, version, document version, and config hash', () => {
        const key = createLintCacheKey(
            'file:///path/to/file.txt',
            '1.0.0',
            5,
            'abc123',
        );

        expect(key).toBe('file:///path/to/file.txt:1.0.0:5:abc123');
    });

    it('should create different keys for different URIs', () => {
        const key1 = createLintCacheKey('file:///path/file1.txt', '1.0.0', 1, 'hash');
        const key2 = createLintCacheKey('file:///path/file2.txt', '1.0.0', 1, 'hash');

        expect(key1).not.toBe(key2);
    });

    it('should create different keys for different AGLint versions', () => {
        const key1 = createLintCacheKey('file:///file.txt', '1.0.0', 1, 'hash');
        const key2 = createLintCacheKey('file:///file.txt', '1.0.1', 1, 'hash');

        expect(key1).not.toBe(key2);
    });

    it('should create different keys for different document versions', () => {
        const key1 = createLintCacheKey('file:///file.txt', '1.0.0', 1, 'hash');
        const key2 = createLintCacheKey('file:///file.txt', '1.0.0', 2, 'hash');

        expect(key1).not.toBe(key2);
    });

    it('should create different keys for different config hashes', () => {
        const key1 = createLintCacheKey('file:///file.txt', '1.0.0', 1, 'hash1');
        const key2 = createLintCacheKey('file:///file.txt', '1.0.0', 1, 'hash2');

        expect(key1).not.toBe(key2);
    });

    it('should handle empty strings', () => {
        const key = createLintCacheKey('', '', 0, '');
        expect(key).toBe('::0:');
    });

    it('should handle special characters in URIs', () => {
        const key = createLintCacheKey(
            'file:///path/with spaces/file.txt',
            '1.0.0',
            1,
            'hash',
        );

        expect(key).toContain('file:///path/with spaces/file.txt');
    });
});

describe('LintingCache', () => {
    let cache: LintingCache;

    beforeEach(() => {
        cache = new LintingCache();
    });

    describe('get and set', () => {
        it('should store and retrieve diagnostics', () => {
            const key = 'test-key';
            const diagnostics: any[] = [
                {
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 5 },
                    },
                    message: 'Test error',
                    severity: 1,
                },
            ];

            cache.set(key, diagnostics);
            const retrieved = cache.get(key);

            expect(retrieved).toEqual(diagnostics);
        });

        it('should return undefined for non-existent keys', () => {
            const result = cache.get('non-existent-key');
            expect(result).toBeUndefined();
        });

        it('should overwrite existing entries', () => {
            const key = 'test-key';
            const diagnostics1 = [{ message: 'First', severity: 1 } as any];
            const diagnostics2 = [{ message: 'Second', severity: 2 } as any];

            cache.set(key, diagnostics1);
            cache.set(key, diagnostics2);

            const retrieved = cache.get(key);
            expect(retrieved).toEqual(diagnostics2);
        });

        it('should handle empty diagnostics array', () => {
            const key = 'test-key';
            const diagnostics: any[] = [];

            cache.set(key, diagnostics);
            const retrieved = cache.get(key);

            expect(retrieved).toEqual([]);
        });

        it('should store multiple different entries', () => {
            const key1 = 'key-1';
            const key2 = 'key-2';
            const diagnostics1 = [{ message: 'Error 1' } as any];
            const diagnostics2 = [{ message: 'Error 2' } as any];

            cache.set(key1, diagnostics1);
            cache.set(key2, diagnostics2);

            expect(cache.get(key1)).toEqual(diagnostics1);
            expect(cache.get(key2)).toEqual(diagnostics2);
        });
    });

    describe('clear', () => {
        it('should remove all entries from cache', () => {
            const key1 = 'key-1';
            const key2 = 'key-2';
            const diagnostics = [{ message: 'Error' } as any];

            cache.set(key1, diagnostics);
            cache.set(key2, diagnostics);

            cache.clear();

            expect(cache.get(key1)).toBeUndefined();
            expect(cache.get(key2)).toBeUndefined();
        });

        it('should allow new entries after clear', () => {
            const key = 'test-key';
            const diagnostics = [{ message: 'Error' } as any];

            cache.set(key, diagnostics);
            cache.clear();

            const newDiagnostics = [{ message: 'New error' } as any];
            cache.set(key, newDiagnostics);

            expect(cache.get(key)).toEqual(newDiagnostics);
        });
    });

    describe('LRU behavior', () => {
        it('should maintain entries up to max capacity', () => {
            // LRU cache has max 100 entries
            // Add 50 entries - all should be accessible
            for (let i = 0; i < 50; i += 1) {
                cache.set(`key-${i}`, [{ message: `Error ${i}` } as any]);
            }

            // All 50 should still be accessible
            for (let i = 0; i < 50; i += 1) {
                expect(cache.get(`key-${i}`)).toBeDefined();
            }
        });
    });
});
