/**
 * @file Tests for scriptlets rules.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

describe('scriptlet rules', () => {
    describe('valid', () => {
        test('blocking', () => {
            // single quoted arguments
            expect("#%#//scriptlet('foo', 'bar')").toBeTokenizedProperly(
                tokenizer,
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
            expect('#%#//scriptlet("foo", "bar")').toBeTokenizedProperly(
                tokenizer,
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
            expect('#%#//scriptlet("foo\'bar")').toBeTokenizedProperly(
                tokenizer,
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
            expect("#@%#//scriptlet('foo')").toBeTokenizedProperly(
                tokenizer,
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
            expect('#@%#//scriptlet()').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '#@%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet', scopes: ['text.adblock', 'entity.name.function.adblock'] },
                    { fragment: '(', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                    { fragment: ')', scopes: ['text.adblock', 'punctuation.section.adblock'] },
                ],
            );

            expect('#@%#//scriptlet( )').toBeTokenizedProperly(
                tokenizer,
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
            // blocking scriptlet rule cannot be used without any arguments
            expect('#%#//scriptlet()').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '//scriptlet()', scopes: ['text.adblock', 'invalid.illegal'] },
                ],
            );
        });
    });
});
