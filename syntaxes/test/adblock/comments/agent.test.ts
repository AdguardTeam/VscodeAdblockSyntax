/**
 * @file Tests for the adblock agents.
 */

import { beforeAll, expect, test } from 'vitest';

import { BASE_SCOPE } from '../../../utils/constants';
import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

test('agents tokenization', () => {
    expect('[Adblock Plus 2.0]').toBeTokenizedProperly(
        tokenizer,
        [
            { fragment: '[', scopes: [BASE_SCOPE, 'meta.comment.adblock', 'punctuation.definition.array.start.adblock.agent'] },
            { fragment: 'Adblock Plus', scopes: [BASE_SCOPE, 'meta.comment.adblock', 'constant.language.agent.adblocker.name'] },
            { fragment: ' ', scopes: [BASE_SCOPE, 'meta.comment.adblock'] },
            { fragment: '2.0', scopes: [BASE_SCOPE, 'meta.comment.adblock', 'constant.numeric.decimal'] },
            { fragment: ']', scopes: [BASE_SCOPE, 'meta.comment.adblock', 'punctuation.definition.array.end.adblock.agent'] },
        ],
    );
});
