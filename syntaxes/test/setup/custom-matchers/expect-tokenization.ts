import { type SyncExpectationResult } from '@vitest/expect';
import * as v from 'valibot';
import { expect } from 'vitest';

import { getErrorMessage } from '../../../utils/error';
import { type AdblockTokenizer } from '../../../utils/get-adblock-tokenizer';
import { isArraysEqual } from '../../../utils/utils';

const expectedTokenSchema = v.object({
    fragment: v.string(),
    scopes: v.array(v.string()),
});

const expectedTokensSchema = v.array(expectedTokenSchema);

type ExpectedTokenSchema = v.InferInput<typeof expectedTokensSchema>;

const receivedSchema = v.string();

type ReceivedSchema = v.InferInput<typeof receivedSchema>;

/**
 * Helper function to check rule conversion.
 *
 * @param received Received parameter from expect().
 * @param tokenizer Tokenizer function.
 * @param expectedTokens Expected tokens.
 *
 * @returns Matcher result.
 */
const toBeTokenizedProperly = (
    received: unknown,
    tokenizer: AdblockTokenizer,
    expectedTokens: ExpectedTokenSchema,
): SyncExpectationResult => {
    // Validate the received parameter
    let receivedParsed: ReceivedSchema;

    try {
        receivedParsed = v.parse(receivedSchema, received);
    } catch (error: unknown) {
        return {
            pass: false,
            message: () => `Received parameter validation failed with error: ${getErrorMessage(error)}`,
        };
    }

    // Merging fragments should give us the original source
    const mergedFragments = expectedTokens.map((token) => token.fragment).join('');

    if (mergedFragments !== receivedParsed) {
        return {
            pass: false,
            message: () => 'The merged fragments do not match the source, so the expectation is invalid',
        };
    }

    // Tokenize the source
    const tokens = tokenizer(receivedParsed);

    // Check that the number of tokens matches the number of expected tokens
    if (tokens.length !== expectedTokens.length) {
        return {
            pass: false,
            message: () => `Expected ${expectedTokens.length} tokens, but got ${tokens.length}`,
        };
    }

    let offset = 0;

    // Check that each token matches the expected token
    for (let i = 0; i < tokens.length; i += 1) {
        const endOffset = offset + expectedTokens[i].fragment.length;

        // Check location
        if (tokens[i].startIndex !== offset) {
            return {
                pass: false,
                // eslint-disable-next-line max-len, @typescript-eslint/no-loop-func
                message: () => `Expected token ${i} to start at offset ${offset}, but it starts at offset ${tokens[i].startIndex}`,
            };
        }

        if (tokens[i].endIndex !== endOffset) {
            return {
                pass: false,
                // eslint-disable-next-line max-len, @typescript-eslint/no-loop-func
                message: () => `Expected token ${i} to end at offset ${endOffset}, but it ends at offset ${tokens[i].endIndex}`,
            };
        }

        if (!isArraysEqual(tokens[i].scopes, expectedTokens[i].scopes)) {
            return {
                pass: false,
                // eslint-disable-next-line max-len, @typescript-eslint/no-loop-func
                message: () => `Expected token ${i} to have scopes [${expectedTokens[i].scopes.join(', ')}], but got [${tokens[i].scopes.join(', ')}]`,
            };
        }

        // Update the offset
        offset = endOffset;
    }

    return {
        pass: true,
        message: () => 'Tokenization succeeded',
    };
};

// Extend Vitest's expect() with the custom matcher
expect.extend({
    toBeTokenizedProperly,
});

export type ToBeTokenizedProperly = typeof toBeTokenizedProperly;
