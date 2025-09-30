/**
 * @file Tests for the adblock agents.
 */

import { BASE_SCOPE } from '../common/constants';
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
            { fragment: '[', scopes: [BASE_SCOPE, 'punctuation.definition.array.start.adblock.agent'] },
            { fragment: 'Adblock Plus', scopes: [BASE_SCOPE, 'constant.language.agent.adblocker.name'] },
            { fragment: ' ', scopes: [BASE_SCOPE] },
            { fragment: '2.0', scopes: [BASE_SCOPE, 'constant.numeric.decimal'] },
            { fragment: ']', scopes: [BASE_SCOPE, 'punctuation.definition.array.end.adblock.agent'] },
        ],
    );
});
