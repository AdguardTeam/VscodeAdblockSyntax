/**
 * @file Tests for regular comments.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { BASE_SCOPE } from '../../../utils/constants';
import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

describe('test comments', () => {
    test('basic comments', () => {
        expect('! this is a comment').toBeTokenizedProperly(
            tokenizer,
            [
                { fragment: '! this is a comment', scopes: [BASE_SCOPE, 'comment.line.exclamation-sign'] },
            ],
        );

        expect('# this is a hashtag comment').toBeTokenizedProperly(
            tokenizer,
            [
                { fragment: '# this is a hashtag comment', scopes: [BASE_SCOPE, 'comment.line.hashtag-sign'] },
            ],
        );
    });

    // We want to check that leading hashtag can be used in generic cosmetic rules and
    // in these cases 'tokenize' should parse them as cosmetic, not as comments.
    describe('not comments', () => {
        const cosmeticRules = [
            '##rule',
            '#@%#',
            '##.selector',
            '#@#.selector',
            '#?#.selector:has(> .selector)',
            '#@?#.selector:has(> .selector)',
            '#$#@media screen and (max-width: 480px) { .selector { display: none; }}',
            '#@$#@media screen and (max-width: 480px) { .selector { display: none; }}',
            '#$#abp-snippet0 arg0 arg1 arg2; abp-snippet1',
            '#@$#abp-snippet0 arg0 arg1 arg2; abp-snippet1',
            '#$?#.selector:has(> .selector) { display: none; }',
            '#@$?#.selector:has(> .selector) { display: none; }',
            '#%#//scriptlet(\'adg-scriptlet0\', \'arg0\', \'arg1\', \'arg2\')',
            "#@%#//scriptlet('adg-scriptlet0')",
            '#@%#//scriptlet()',
            '#@%#//scriptlet(\'adg-scriptlet0\', \'arg0\', \'arg1\', \'arg2\')',
            '$$div',
            '$@$div',
            '##+js(ubo-scriptlet0, arg0, arg1, arg2)',
            '#@#+js(ubo-scriptlet0, arg0, arg1, arg2)',
            '##^div:has-text(ad)',
            '#@#^div:has-text(ad)',
        ];

        test.each(cosmeticRules)(
            "test that string is not a comment, but a cosmetic rule for case '%s'",
            (cosmeticRule) => {
                const tokens = tokenizer(cosmeticRule);

                expect(tokens.every(({ scopes }) => {
                    return scopes.every((scope) => {
                        return !scope.startsWith('comment');
                    });
                }));
            },
        );
    });
});
