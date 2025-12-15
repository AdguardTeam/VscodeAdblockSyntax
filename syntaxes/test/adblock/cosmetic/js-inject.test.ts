/**
 * @file Tests for JS injection rules.
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

describe('JS injection rules', () => {
    test('should tokenize valid JS injections', () => {
        expect('#%#window.hello = 1').toBeTokenizedProperly(
            tokenizer,
            [
                { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                { fragment: 'window.hello = 1', scopes: ['text.adblock', 'source.js'] },
            ],
        );
    });

    test('should detect invalid cases', () => {
        // Unclosed scriptlet call. Since it's not closed, it's not matches as a scriptlet call,
        // but #%# is "stronger" than scriptlet injection, and we shouldn't tokenize it as a JS comment
        expect('#%#//scriptlet(\'a\',').toBeTokenizedProperly(
            tokenizer,
            [
                { fragment: '#%#', scopes: ['text.adblock', 'keyword.control.adblock'] },
                { fragment: '//scriptlet(\'a\',', scopes: ['text.adblock', 'invalid.illegal'] },
            ],
        );
    });
});
