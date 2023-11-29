/**
 * @file Tests for regular comments.
 */

import { BASE_SCOPE } from '../common/constants';
import { type AdblockTokenizer, getAdblockTokenizer } from '../common/get-adblock-tokenizer';
import { expectTokens } from '../common/token-expectation';

let tokenize: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenize = await getAdblockTokenizer();
});

describe('test comments', () => {
    test('basic comments', () => {
        let fragment = '! this is a comment';
        expectTokens(
            tokenize,
            fragment,
            [{ fragment, scopes: [BASE_SCOPE, 'comment.line.exclamation-sign'] }],
        );

        fragment = '# this is a hashtag comment';

        expectTokens(
            tokenize,
            fragment,
            [{ fragment, scopes: [BASE_SCOPE, 'comment.line.hashtag-sign'] }],
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
                const tokens = tokenize(cosmeticRule);

                expect(tokens.every(({ scopes }) => {
                    return scopes.every((scope) => {
                        return !scope.startsWith('comment');
                    });
                }));
            },
        );
    });
});
