/**
 * @file Tests for scriptlets rules.
 */

import { type AdblockTokenizer, getAdblockTokenizer } from '../common/get-adblock-tokenizer';
import { expectTokens } from '../common/token-expectation';

let tokenize: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenize = await getAdblockTokenizer();
});

describe('scriptlet rules', () => {
    describe('valid', () => {
        test('blocking', () => {
            // single quoted arguments
            expectTokens(
                tokenize,
                "#%#//scriptlet('foo', 'bar')",
                [
                    { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: "'foo'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ', ', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: "'bar'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );

            // double quoted arguments
            expectTokens(
                tokenize,
                '#%#//scriptlet("foo", "bar")',
                [
                    { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: '"foo"', scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ', ', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '"bar"', scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );

            // should handle if the argument contain a different quote type
            expectTokens(
                tokenize,
                '#%#//scriptlet("foo\'bar")',
                [
                    { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: '"foo\'bar"', scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );
        });

        test('exception for specific scriptlet', () => {
            expectTokens(
                tokenize,
                "#@%#//scriptlet('foo')",
                [
                    { fragment: '#@%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: "'foo'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );
        });

        test('exception for all scriptlets', () => {
            expectTokens(
                tokenize,
                '#@%#//scriptlet()',
                [
                    { fragment: '#@%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );

            expectTokens(
                tokenize,
                '#@%#//scriptlet( )',
                [
                    { fragment: '#@%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: ' ', scopes: ['text.adblock', 'entity.name.section.adblock.empty-scriptlet'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );
        });
    });

    describe('invalid', () => {
        test('blocking', () => {
            expectTokens(
                tokenize,
                // blocking scriptlet rule cannot be used without any arguments
                '#%#//scriptlet()',
                [
                    { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet()', scopes: ['text.adblock', 'invalid.illegal'] },
                ],
            );
        });
    });
});
