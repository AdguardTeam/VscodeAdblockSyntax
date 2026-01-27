/**
 * @file Tests for network rules.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

describe('network rules', () => {
    describe('valid', () => {
        test('regular network rules without modifiers', () => {
            expect('-468x60-').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '-468x60-', scopes: ['text.adblock'] },
                ],
            );

            expect('/ads.js').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '/ads.js', scopes: ['text.adblock'] },
                ],
            );

            expect('||example.com^').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('||example.com/*_banner_').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com/', scopes: ['text.adblock'] },
                    { fragment: '*', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '_banner_', scopes: ['text.adblock'] },
                ],
            );

            expect('|http://example.org').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '|', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'http://example.org', scopes: ['text.adblock'] },
                ],
            );

            expect('swf|').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: 'swf', scopes: ['text.adblock'] },
                    { fragment: '|', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
        });

        test('regexp network rules without modifiers', () => {
            expect(String.raw`/banner\d+/`).toBeTokenizedProperly(
                tokenizer,
                [
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    { fragment: 'banner', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '\\d',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'constant.other.character-class.set.regexp'],
                    },
                    {
                        fragment: '+',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.quantifier.regexp'],
                    },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                ],
            );
        });

        test('network rules without pattern', () => {
            expect('$script').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('$~websocket,~xmlhttprequest').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '~websocket', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '~xmlhttprequest', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('$script,third-party,___,domain=example.com').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'third-party', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '___', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'domain', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );

            // quoted value allows unescaped comma
            expect(String.raw`$foo=',',bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: "','", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
            expect(String.raw`$foo='/b{3,}/',bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: "'/b{3,}/'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            // regexp value allows unescaped comma with detailed highlighting
            expect(String.raw`$foo=/b{3,}/,bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    { fragment: 'b', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '{3,}',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.quantifier.regexp'],
                    },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            // quoted value allows unescaped $
            expect(String.raw`$foo='$',bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: "'$'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
            expect(String.raw`$foo='/b{3,}$/',bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: "'/b{3,}$/'", scopes: ['text.adblock', 'string.quoted.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            // regexp value allows unescaped $ (anchor)
            expect(String.raw`$foo=/b{3,}$/,bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    { fragment: 'b', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '{3,}',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.quantifier.regexp'],
                    },
                    {
                        fragment: '$',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.control.anchor.regexp'],
                    },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
            expect(String.raw`$foo=/(b{3,}|foo$)/,bar`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    {
                        fragment: '(',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'punctuation.definition.group.regexp'],
                    },
                    { fragment: 'b', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '{3,}',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.quantifier.regexp'],
                    },
                    {
                        fragment: '|',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.or.regexp'],
                    },
                    { fragment: 'foo', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '$',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.control.anchor.regexp'],
                    },
                    {
                        fragment: ')',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'punctuation.definition.group.regexp'],
                    },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            // whitespace is allowed
            expect('$foo = bar ,  baz').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'foo', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ' ', scopes: ['text.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: ' ', scopes: ['text.adblock'] },
                    { fragment: 'bar', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: ' ', scopes: ['text.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '  ', scopes: ['text.adblock'] },
                    { fragment: 'baz', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
        });

        test('regular network rules with modifiers', () => {
            expect('||example.com^$script').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('||example.com^$~websocket,~xmlhttprequest').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: '~websocket', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '~xmlhttprequest', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('||example.com^$script,__,3p').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '__', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '3p', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
        });

        test('regexp network rules with modifiers', () => {
            expect(String.raw`/banner\d+/$image,third-party`).toBeTokenizedProperly(
                tokenizer,
                [
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    { fragment: 'banner', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '\\d',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'constant.other.character-class.set.regexp'],
                    },
                    {
                        fragment: '+',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.operator.quantifier.regexp'],
                    },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'image', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'third-party', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );
        });

        test('special modifiers with commas', () => {
            // header modifier with regex containing comma and escaped characters
            expect('*$script,header=via:/, 1\\.1 google$/').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '*', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'header', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'via', scopes: ['text.adblock', 'entity.name.tag.adblock'] },
                    { fragment: ':', scopes: ['text.adblock', 'punctuation.separator.key-value.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    { fragment: ', 1\\.1 google$', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                ],
            );

            // header modifier with literal value
            expect('*$script,header=via:1.1 google').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '*', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'header', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'via', scopes: ['text.adblock', 'entity.name.tag.adblock'] },
                    { fragment: ':', scopes: ['text.adblock', 'punctuation.separator.key-value.adblock'] },
                    { fragment: '1.1 google', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );

            // header modifier - just presence check
            expect('*$script,header=via').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '*', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'header', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'via', scopes: ['text.adblock', 'entity.name.tag.adblock'] },
                ],
            );

            // replace modifier with detailed tokenization test
            expect(String.raw`||example.org^$replace=/test/replacement/i`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.org', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'replace', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'test', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'replacement', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'i', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            // replace modifier with $number references in replacement
            expect(String.raw`||example.org^$replace=/(test)/\$1/`).toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.org', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'replace', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    {
                        fragment: '(',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'punctuation.definition.group.regexp'],
                    },
                    { fragment: 'test', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: ')',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'punctuation.definition.group.regexp'],
                    },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    {
                        fragment: '\\$',
                        scopes: ['text.adblock', 'string.unquoted.adblock', 'constant.character.escape.adblock'],
                    },
                    { fragment: '1', scopes: ['text.adblock', 'string.unquoted.adblock', 'keyword.other.adblock'] },
                    { fragment: '/', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                ],
            );

            // replace modifier with complex regexp and escaped slashes
            const replaceExample = String.raw`||example.org^$replace=/(<VAST[\s\S]*?>)[\s\S]*<\/VAST>/\$1<\/VAST>/i`;
            const replaceTokens = tokenizer(replaceExample);

            // Verify no invalid tokens
            const replaceHasInvalid = replaceTokens.some((token) => token.scopes.some(
                (scope) => scope.startsWith('invalid'),
            ));
            expect(replaceHasInvalid).toBe(false);

            // Verify key structural elements
            const replaceScopes = replaceTokens.flatMap((t) => t.scopes);
            expect(replaceScopes).toContain('keyword.other.adblock'); // replace keyword and modifiers
            expect(replaceScopes).toContain('keyword.operator.adblock'); // slashes
            expect(replaceScopes).toContain('string.regexp.adblock'); // regexp part
            expect(replaceScopes).toContain('string.unquoted.adblock'); // replacement part
            expect(replaceScopes).toContain('constant.character.escape.adblock'); // escaped characters

            // urlskip modifier with regex containing comma - verify it parses correctly
            const urlskipExample = String.raw`||click.redditmail.com/CL0/`
                + String.raw`$urlskip=/CL0\/.*?(www\.reddit\.com.+?)(?:\?|%3F)/ -uricomponent +https`;
            const urlskipTokens = tokenizer(urlskipExample);

            // Verify no invalid tokens
            const urlskipHasInvalid = urlskipTokens.some((token) => token.scopes.some(
                (scope) => scope.startsWith('invalid'),
            ));
            expect(urlskipHasInvalid).toBe(false);

            // Verify key structural elements
            const urlskipScopes = urlskipTokens.flatMap((t) => t.scopes);
            expect(urlskipScopes).toContain('keyword.other.adblock');
            expect(urlskipScopes).toContain('keyword.operator.adblock');

            // urlskip modifier with simple directives
            expect('||example.com/path/to/tracker$urlskip=?url -base64').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com/path/to/tracker', scopes: ['text.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'urlskip', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '?url -base64', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );
        });

        test('domain-like modifiers with special syntax', () => {
            // Simple domain value
            expect('||example.com^$script,domain=example.org').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'domain', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'example.org', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );

            // Negated domain with ~
            expect('||ads.js$domain=~example.com').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'ads.js', scopes: ['text.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'domain', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '~', scopes: ['text.adblock', 'keyword.operator.logical.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );

            // Multiple domains with pipe separator
            expect('||ads.js$domain=example.com|example.org|~test.com').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'ads.js', scopes: ['text.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'domain', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: '|', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'example.org', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: '|', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: '~', scopes: ['text.adblock', 'keyword.operator.logical.adblock'] },
                    { fragment: 'test.com', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );

            // Domain with regex value - verify structural elements
            const domainRegexExample = '||example.com^$domain=/example[0-9]\\.(com|org)/|another.com';
            const domainRegexTokens = tokenizer(domainRegexExample);

            // Verify no invalid tokens
            const domainRegexHasInvalid = domainRegexTokens.some((token) => token.scopes.some(
                (scope) => scope.startsWith('invalid'),
            ));
            expect(domainRegexHasInvalid).toBe(false);

            // Verify key structural elements
            const domainRegexScopes = domainRegexTokens.flatMap((t) => t.scopes);
            expect(domainRegexScopes).toContain('keyword.other.adblock');
            expect(domainRegexScopes).toContain('keyword.operator.adblock');
            expect(domainRegexScopes).toContain('punctuation.definition.string.begin.regexp.adblock');
            expect(domainRegexScopes).toContain('string.regexp.adblock');

            // Mixed: regex with pipe inside, followed by simple domain - check actual tokens
            const mixedExample = '||ads.js$domain=/example[0-9]\\.(com|org)/|another.com';
            const mixedTokens = tokenizer(mixedExample);

            // Check that the value is properly tokenized with regex and domain parts
            const mixedFragments = mixedTokens.map((t) => ({
                fragment: mixedExample.substring(t.startIndex, t.endIndex),
                scopes: t.scopes,
            }));

            // The entire value should not be just a string.unquoted.adblock
            const valueTokens = mixedFragments.filter(
                (t) => t.fragment.includes('example') || t.fragment.includes('another'),
            );

            // At least one token should have regex scopes
            const hasRegexScopes = valueTokens.some(
                (t) => t.scopes.some((s) => s.includes('regexp')),
            );
            expect(hasRegexScopes).toBe(true);

            // Test 'to' modifier with multiple TLDs
            expect('||example.com^$to=com|org|net').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'to', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'com', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: '|', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'org', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                    { fragment: '|', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'net', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );
        });

        test('combined replace and domain modifiers', () => {
            // Test replace and domain together in the same rule
            const combinedExample = String.raw`||example.org^$replace=/(<VAST[\s\S]*?>)[\s\S]*<\/VAST>/`
                + String.raw`\$1<\/VAST>/i,domain=/example[0-9]\.(com|org)/|another.com`;
            const combinedTokens = tokenizer(combinedExample);

            // Verify no invalid tokens
            const combinedHasInvalid = combinedTokens.some((token) => token.scopes.some(
                (scope) => scope.startsWith('invalid'),
            ));
            expect(combinedHasInvalid).toBe(false);

            // Verify both modifiers have their key elements
            const combinedScopes = combinedTokens.flatMap((t) => t.scopes);

            // Both modifiers should be present with their regex elements
            expect(combinedScopes).toContain('keyword.operator.adblock'); // slashes and operators
            expect(combinedScopes).toContain('string.regexp.adblock'); // regex content
        });

        test('complicated cases', () => {
            // Test a complex filter with multiple modifiers including regex patterns
            const complexFilter = String.raw`/^https:\/\/[a-z0-9]{2,}-[a-z0-9]{8}\.(?:com|nl)\/[a-z0-9-]+/`
                + String.raw`[a-z0-9]{12}\b/$frame,3p,match-case,to=com|nl,`
                + String.raw`ipaddress=/^(1(72\.67\.\d{3}|04\.21\.\d+)\.\d+|188\.114\.9[67]\.[08]|`
                + String.raw`64:ff9b::[a-f0-9]{4}:[a-f0-9]{1,4})$/,`
                + String.raw`replace='/^/<script>(()=>{window.open=new Proxy(window.open,{apply:(n,o,w)=>{}});`
                + String.raw`let e=document.querySelector("script");e.innerHTML.includes("window.open")&&`
                + String.raw`e.parentElement.removeChild(e)})();<\/script>/i'`;
            const tokens = tokenizer(complexFilter);

            // Verify no invalid tokens
            const hasInvalidTokens = tokens.some((token) => token.scopes.some(
                (scope) => scope.startsWith('invalid'),
            ));
            expect(hasInvalidTokens).toBe(false);

            // Verify key structural elements are present
            const allScopes = tokens.flatMap((t) => t.scopes);
            expect(allScopes).toContain('punctuation.definition.string.begin.regexp.adblock');
            expect(allScopes).toContain('punctuation.definition.string.end.regexp.adblock');
            expect(allScopes).toContain('keyword.control.adblock');
            expect(allScopes).toContain('keyword.other.adblock');
            expect(allScopes).toContain('keyword.operator.adblock');
            expect(allScopes).toContain('string.regexp.adblock');
            expect(allScopes).toContain('string.quoted.adblock');
        });

        test('allowlist rules without modifiers', () => {
            expect('@@-468x60-').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '-468x60-', scopes: ['text.adblock'] },
                ],
            );

            expect('@@/ads.js').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '/ads.js', scopes: ['text.adblock'] },
                ],
            );

            expect('@@||example.com^').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('@@||example.com/*_banner_').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com/', scopes: ['text.adblock'] },
                    { fragment: '*', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '_banner_', scopes: ['text.adblock'] },
                ],
            );
        });

        test('allowlist regexp rules without modifiers', () => {
            expect('@@/ads\\.js/').toBeTokenizedProperly(
                tokenizer,
                [
                    {
                        fragment: '@@',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'keyword.other.adblock'],
                    },
                    {
                        fragment: '/',
                        scopes: [
                            'text.adblock',
                            'string.regexp.adblock',
                            'punctuation.definition.string.begin.regexp.adblock',
                        ],
                    },
                    {
                        fragment: 'ads',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'string.regexp.adblock'],
                    },
                    {
                        fragment: '\\.',
                        scopes: [
                            'text.adblock',
                            'string.regexp.adblock',
                            'string.regexp.adblock',
                            'constant.character.escape.regexp',
                        ],
                    },
                    {
                        fragment: 'js',
                        scopes: ['text.adblock', 'string.regexp.adblock', 'string.regexp.adblock'],
                    },
                    {
                        fragment: '/',
                        scopes: [
                            'text.adblock',
                            'string.regexp.adblock',
                            'punctuation.definition.string.end.regexp.adblock',
                        ],
                    },
                ],
            );
        });

        test('allowlist rules with modifiers', () => {
            expect('@@||example.com^$script').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                ],
            );

            expect('@@||example.com^$script,domain=example.org').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: ',', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'domain', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'example.org', scopes: ['text.adblock', 'string.unquoted.adblock'] },
                ],
            );
        });

        test('allowlist rules with regex modifiers', () => {
            expect('@@||example.com^$header=via:/^referer/i').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '@@||', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: 'example.com', scopes: ['text.adblock'] },
                    { fragment: '^', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'header', scopes: ['text.adblock', 'keyword.other.adblock'] },
                    { fragment: '=', scopes: ['text.adblock', 'keyword.operator.adblock'] },
                    { fragment: 'via', scopes: ['text.adblock', 'entity.name.tag.adblock'] },
                    { fragment: ':', scopes: ['text.adblock', 'punctuation.separator.key-value.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.begin.regexp.adblock'],
                    },
                    {
                        fragment: '^',
                        scopes: ['text.adblock', 'keyword.control.anchor.regexp'],
                    },
                    { fragment: 'referer', scopes: ['text.adblock', 'string.regexp.adblock'] },
                    {
                        fragment: '/',
                        scopes: ['text.adblock', 'punctuation.definition.string.end.regexp.adblock'],
                    },
                    { fragment: 'i', scopes: ['text.adblock', 'keyword.other.regexp.adblock'] },
                ],
            );
        });
    });

    describe('invalid', () => {
        test('patterns', () => {
            // , should be followed by another modifier
            expect('$script,').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script,', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );

            // modifier name should contain only valid characters
            expect('$important!').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'important!', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );

            // missing comma
            expect('$script third-party').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script third-party', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );
        });

        test('modifiers', () => {
            // , should be followed by another modifier
            expect('$script,').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script,', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );

            // modifier name should contain only valid characters
            expect('$important!').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'important!', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );

            // missing comma
            expect('$script third-party').toBeTokenizedProperly(
                tokenizer,
                [
                    { fragment: '$', scopes: ['text.adblock', 'keyword.control.adblock'] },
                    { fragment: 'script third-party', scopes: ['text.adblock', 'invalid.illegal.adblock'] },
                ],
            );
        });
    });
});
