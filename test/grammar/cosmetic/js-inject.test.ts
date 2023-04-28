/**
 * @file Tests for JS injection rules
 */

import { AdblockTokenizer, getAdblockTokenizer } from '../common/get-adblock-tokenizer';
import { expectTokens } from '../common/token-expectation';

let tokenize: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenize = await getAdblockTokenizer();
});

describe('JS injection rules', () => {
    test('should tokenize valid JS injections', () => {
        expectTokens(
            tokenize,
            '#%#window.hello = 1',
            [
                { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                { fragment: 'window.hello = 1', scopes: ['text.adblock', 'source.js'] },
            ],
        );
    });

    test('should detect invalid cases', () => {
        // Unclosed scriptlet call. Since it's not closed, it's not matches as a scriptlet call,
        // but #%# is "stronger" than scriptlet injection, and we shouldn't tokenize it as a JS comment
        expectTokens(
            tokenize,
            '#%#//scriptlet(\'a\',',
            [
                { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                { fragment: '//scriptlet(\'a\',', scopes: ['text.adblock', 'invalid.illegal'] },
            ],
        );
    });
});
