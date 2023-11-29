/**
 * @file Tests for preprocessing directive comments
 */

import { BASE_SCOPE } from '../common/constants';
import { type AdblockTokenizer, getAdblockTokenizer } from '../common/get-adblock-tokenizer';
import { expectTokens } from '../common/token-expectation';

let tokenize: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenize = await getAdblockTokenizer();
});

describe('Preprocessor directive comments', () => {
    describe('!#if', () => {
        test.each([
            // simple cases
            {
                actual: '!#if adguard',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: 'adguard', scopes: [BASE_SCOPE, 'constant.language.platform.name'] },
                ],
            },
            {
                actual: '!#if !adguard',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '!', scopes: [BASE_SCOPE, 'keyword.operator.logical.not'] },
                    { fragment: 'adguard', scopes: [BASE_SCOPE, 'constant.language.platform.name'] },
                ],
            },
            // complicated case
            {
                actual: '!#if (adguard && !adguard_ext_safari)',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '(', scopes: [BASE_SCOPE, 'keyword.control.characters.parenthesis.open'] },
                    { fragment: 'adguard', scopes: [BASE_SCOPE, 'constant.language.platform.name'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '&&', scopes: [BASE_SCOPE, 'keyword.operator.logical.and'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '!', scopes: [BASE_SCOPE, 'keyword.operator.logical.not'] },
                    { fragment: 'adguard_ext_safari', scopes: [BASE_SCOPE, 'constant.language.platform.name'] },
                    { fragment: ')', scopes: [BASE_SCOPE, 'keyword.control.characters.parenthesis.close'] },
                ],
            },
        ])('should work for valid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });

        test.each([
            // variable name cannot start with a hyphen
            {
                actual: '!#if -bad-name',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '-bad-name', scopes: [BASE_SCOPE, 'invalid.illegal'] },
                ],
            },
            // variable name only can start with a letter
            {
                actual: '!#if 0a',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: '0a', scopes: [BASE_SCOPE, 'invalid.illegal'] },
                ],
            },
            // variable name only can contain letters, numbers and underscores and hyphens
            {
                actual: '!#if a@b',
                expected: [
                    { fragment: '!#if', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                    { fragment: ' ', scopes: [BASE_SCOPE, 'keyword.other.delimiter.whitespace'] },
                    { fragment: 'a', scopes: [BASE_SCOPE, 'constant.language.platform.name'] },
                    { fragment: '@b', scopes: [BASE_SCOPE, 'invalid.illegal'] },
                ],
            },
        ])('should work for invalid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });
    });

    describe('!#else', () => {
        test.each([
            // simple cases
            {
                actual: '!#else',
                expected: [
                    { fragment: '!#else', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                ],
            },
        ])('should work for valid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });

        test.each([
            // simple cases
            {
                actual: '!#else something',
                expected: [
                    { fragment: '!#else something', scopes: [BASE_SCOPE, 'invalid.illegal.preprocessor'] },
                ],
            },
        ])('should work for invalid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });
    });

    describe('!#endif', () => {
        test.each([
            // simple cases
            {
                actual: '!#endif',
                expected: [
                    { fragment: '!#endif', scopes: [BASE_SCOPE, 'keyword.preprocessor.directive'] },
                ],
            },
        ])('should work for valid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });

        test.each([
            // simple cases
            {
                actual: '!#endif something',
                expected: [
                    { fragment: '!#endif something', scopes: [BASE_SCOPE, 'invalid.illegal.preprocessor'] },
                ],
            },
        ])('should work for invalid case \'$actual\'', ({ actual, expected }) => {
            expectTokens(tokenize, actual, expected);
        });
    });

    // TODO: add tests for !#include, !#safari_cb_affinity and for unknown preprocessor directives
});
