/**
 * @file Cross-cutting tests for rule category scopes and the exception flag.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    META_COMMENT_SCOPE,
    META_COSMETIC_SCOPE,
    META_EXCEPTION_SCOPE,
    META_NETWORK_SCOPE,
} from '../../utils/constants';
import { type AdblockTokenizer, getAdblockTokenizer } from '../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

/**
 * Returns true if every non-empty token of the source carries the given scope.
 *
 * @param source Source line to tokenize.
 * @param scope Scope every token must contain.
 *
 * @returns Whether all tokens contain the scope.
 */
const everyTokenHasScope = (source: string, scope: string): boolean => {
    const tokens = tokenizer(source);
    return tokens.length > 0 && tokens.every(({ scopes }) => scopes.includes(scope));
};

/**
 * Returns true if no token of the source carries the given scope.
 *
 * @param source Source line to tokenize.
 * @param scope Scope that must be absent.
 *
 * @returns Whether the scope is absent from all tokens.
 */
const noTokenHasScope = (source: string, scope: string): boolean => {
    return tokenizer(source).every(({ scopes }) => !scopes.includes(scope));
};

/**
 * Returns true if at least one token of the source carries the given scope.
 *
 * @param source Source line to tokenize.
 * @param scope Scope that must be present on some token.
 *
 * @returns Whether the scope is present on any token.
 */
const anyTokenHasScope = (source: string, scope: string): boolean => {
    return tokenizer(source).some(({ scopes }) => scopes.includes(scope));
};

describe('rule category scopes', () => {
    describe('comment category', () => {
        test.each([
            '! a plain comment',
            '# a hashtag comment',
            '[Adblock Plus 2.0]',
            '!#if (adguard)',
            '!#include partial.txt',
            '!+ NOT_OPTIMIZED PLATFORM(windows)',
            '!#safari_cb_affinity(general)',
        ])('categorizes %j as comment', (rule) => {
            expect(everyTokenHasScope(rule, META_COMMENT_SCOPE)).toBe(true);
        });

        test.each([
            '! a plain comment',
            '[Adblock Plus 2.0]',
            '!#if (adguard)',
        ])('comment %j is never an exception', (rule) => {
            expect(noTokenHasScope(rule, META_EXCEPTION_SCOPE)).toBe(true);
            expect(noTokenHasScope(rule, META_NETWORK_SCOPE)).toBe(true);
            expect(noTokenHasScope(rule, META_COSMETIC_SCOPE)).toBe(true);
        });
    });

    describe('cosmetic category', () => {
        test.each([
            'example.com##.banner',
            'example.com#?#.banner:has(> .ad)',
            'example.com#$#.banner { display: none; }',
            'example.com#$?#.banner:has(> .ad) { display: none; }',
            'example.com#%#//scriptlet(\'abort-on-property-read\', \'x\')',
            'example.com#%#window.x = 1;',
            'example.com##+js(set, x, 1)',
            'example.com$$script[tag-content="ad"]',
            'example.com#$#abp-snippet arg0',
        ])('categorizes %j as cosmetic', (rule) => {
            expect(everyTokenHasScope(rule, META_COSMETIC_SCOPE)).toBe(true);
            expect(noTokenHasScope(rule, META_NETWORK_SCOPE)).toBe(true);
        });
    });

    describe('network category', () => {
        test.each([
            '||example.com^',
            '||example.com^$third-party',
            '/banner\\d+/',
            '$removeparam=utm_source',
            '-468x60-',
        ])('categorizes %j as network', (rule) => {
            expect(everyTokenHasScope(rule, META_NETWORK_SCOPE)).toBe(true);
            expect(noTokenHasScope(rule, META_COSMETIC_SCOPE)).toBe(true);
        });
    });
});

describe('exception flag', () => {
    describe('network exceptions', () => {
        test.each([
            ['||example.com^', '@@||example.com^'],
            ['||example.com^$third-party', '@@||example.com^$third-party'],
        ])('blocking %j has no flag, exception has flag', (blocking, exception) => {
            expect(noTokenHasScope(blocking, META_EXCEPTION_SCOPE)).toBe(true);
            expect(everyTokenHasScope(blocking, META_NETWORK_SCOPE)).toBe(true);

            expect(anyTokenHasScope(exception, META_EXCEPTION_SCOPE)).toBe(true);
            expect(everyTokenHasScope(exception, META_NETWORK_SCOPE)).toBe(true);
        });
    });

    describe('cosmetic exceptions', () => {
        test.each([
            ['example.com##.banner', 'example.com#@#.banner'],
            ['example.com#?#.banner:has(> .ad)', 'example.com#@?#.banner:has(> .ad)'],
            ['example.com#$#.banner { display: none; }', 'example.com#@$#.banner { display: none; }'],
            ['example.com##+js(set, x, 1)', 'example.com#@#+js(set, x, 1)'],
            ['example.com$$script', 'example.com$@$script'],
            ['example.com#%#//scriptlet(\'x\')', 'example.com#@%#//scriptlet(\'x\')'],
        ])('blocking %j has no flag, exception has flag', (blocking, exception) => {
            expect(noTokenHasScope(blocking, META_EXCEPTION_SCOPE)).toBe(true);
            expect(everyTokenHasScope(blocking, META_COSMETIC_SCOPE)).toBe(true);

            expect(anyTokenHasScope(exception, META_EXCEPTION_SCOPE)).toBe(true);
            expect(everyTokenHasScope(exception, META_COSMETIC_SCOPE)).toBe(true);
        });
    });

    describe('exception-looking substrings do not trigger the flag', () => {
        // A separator-looking substring inside a selector, value, or argument
        // must NOT be treated as the rule separator. Only the first real
        // separator on the line determines the exception flag.
        test.each([
            'example.com##a[href="#@#"]',
            'example.com#$#.x { content: "$@$"; }',
            'example.com#%#//scriptlet(\'x\', \'bar#@#baz\')',
            'example.com##+js(set, \'x#@#y\', 1)',
            'example.com$$script[tag-content="$@$"]',
        ])('blocking rule %j is not flagged as an exception', (rule) => {
            expect(noTokenHasScope(rule, META_EXCEPTION_SCOPE)).toBe(true);
            expect(everyTokenHasScope(rule, META_COSMETIC_SCOPE)).toBe(true);
        });
    });
});

describe('uncategorized lines', () => {
    test.each([
        '',
        '   ',
    ])('blank line %j has no category scope', (line) => {
        expect(noTokenHasScope(line, META_COMMENT_SCOPE)).toBe(true);
        expect(noTokenHasScope(line, META_COSMETIC_SCOPE)).toBe(true);
        expect(noTokenHasScope(line, META_NETWORK_SCOPE)).toBe(true);
    });
});
