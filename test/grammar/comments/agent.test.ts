/**
 * @file Tests for the adblock agents
 */

import { type AdblockTokenizer, getAdblockTokenizer } from '../common/get-adblock-tokenizer';
import { expectTokens } from '../common/token-expectation';

let tokenize: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenize = await getAdblockTokenizer();
});

test('agents tokenization', () => {
    expectTokens(
        tokenize,
        '[Adblock Plus 2.0]',
        [
            { fragment: '[', scopes: ['text.adblock', 'punctuation.definition.array.start.adblock.agent'] },
            { fragment: 'Adblock Plus', scopes: ['text.adblock', 'constant.language.agent.adblocker.name'] },
            { fragment: ' ', scopes: ['text.adblock'] },
            { fragment: '2.0', scopes: ['text.adblock', 'constant.numeric.decimal'] },
            { fragment: ']', scopes: ['text.adblock', 'punctuation.definition.array.end.adblock.agent'] },
        ],
    );
});
