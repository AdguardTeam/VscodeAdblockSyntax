/**
 * @file Tests for AdGuard cosmetic rules modifiers.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

describe('cosmetic rules modifiers', () => {
    describe('valid', () => {
        test('simple path modifier', () => {
            const tokens = tokenizer('[$path=/test]##banner');

            // Check only the modifier part tokens (first 6 tokens)
            expect(tokens.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);
        });

        test('domain modifier with regex', () => {
            const tokens1 = tokenizer('[$domain=/example[0-9]\\.(com|org)/]##.ad');

            // Check only the basic structure tokens (first 5 tokens)
            expect(tokens1.slice(0, 5)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 8, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 8, endIndex: 9, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                {
                    startIndex: 9,
                    endIndex: 10,
                    scopes: ['text.adblock', 'meta.cosmetic.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                },
            ]);

            // Verify the regex content contains the expected scopes
            expect(tokens1[5].scopes).toContain('string.regexp.adblock');

            const tokens2 = tokenizer('[$domain=/example\\d{1,}\\.(com|org)/]##.ad');

            // Check only the basic structure tokens (first 5 tokens)
            expect(tokens2.slice(0, 5)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 8, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 8, endIndex: 9, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                {
                    startIndex: 9,
                    endIndex: 10,
                    scopes: ['text.adblock', 'meta.cosmetic.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                },
            ]);

            // Verify the regex content contains the expected scopes
            expect(tokens2[5].scopes).toContain('string.regexp.adblock');
        });

        test('multiple modifiers', () => {
            const tokens1 = tokenizer('[$path=/test,app=com.google.search]##banner');

            // Check only the modifier part tokens (first 10 tokens)
            expect(tokens1.slice(0, 10)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 13, endIndex: 16, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 16, endIndex: 17, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 17, endIndex: 34, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 34, endIndex: 35, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);

            const tokens2 = tokenizer('[$path=/test,domain=example.org]##banner');

            // Check only the modifier part tokens (first 10 tokens)
            expect(tokens2.slice(0, 10)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 13, endIndex: 19, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 19, endIndex: 20, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 20, endIndex: 31, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 31, endIndex: 32, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);
        });

        test('different rule types with modifiers', () => {
            const tokens1 = tokenizer('[$path=/test]#@#banner');
            expect(tokens1.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'meta.exception.adblock', 'keyword.control.adblock'] },
            ]);

            const tokens2 = tokenizer('[$path=/test]#?#.banner');
            expect(tokens2.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);

            const tokens3 = tokenizer('[$path=/test]#$#banner { style: display: none!important; }');
            expect(tokens3.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);

            const tokens4 = tokenizer('[$path=/test]$$banner');
            expect(tokens4.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);
        });

        test('scriptlet rules with modifiers', () => {
            const tokens1 = tokenizer('[$path=/subpage1]testcases.agrd.dev,pages.dev#%#window.__case13=true;');
            expect(tokens1.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 16, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 16, endIndex: 17, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);

            const tokens2 = tokenizer('[$path=/test]example.org#%#//scriptlet(\'name\', \'\')');
            expect(tokens2.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 6, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 6, endIndex: 7, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 7, endIndex: 12, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 12, endIndex: 13, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);
        });
    });

    describe('invalid', () => {
        test('invalid modifier', () => {
            const tokens = tokenizer('[$randommodifier=test]##banner');

            // Check only the modifier part tokens (first 6 tokens)
            expect(tokens.slice(0, 6)).toEqual([
                { startIndex: 0, endIndex: 1, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 1, endIndex: 2, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
                { startIndex: 2, endIndex: 16, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.other.adblock'] },
                { startIndex: 16, endIndex: 17, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.operator.adblock'] },
                { startIndex: 17, endIndex: 21, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'string.unquoted.adblock'] },
                { startIndex: 21, endIndex: 22, scopes: ['text.adblock', 'meta.cosmetic.adblock', 'keyword.control.adblock'] },
            ]);
        });
    });
});
