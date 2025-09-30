import { type AdblockTokenizer } from './get-adblock-tokenizer';
import { isArraysEqual } from './utils';

/**
 * Represents a token that is expected to be found in the source code.
 */
export interface ExpectedToken {
    fragment: string;
    scopes: string[];
}

/**
 * Checks if the source code is tokenized as expected. This function
 * gives a very convenient way to check if the tokenizer is working as
 * expected and using it is enough in most cases.
 *
 * BEWARE: You should specify the whole source code as fragments, not
 * just the parts that you want to check. If you don't specify the whole
 * source code, then this function will throw an error because the
 * fragments don't match the source code.
 *
 * It will automatically calculates the location of each token
 * based on the fragments. If the location of a token doesn't match
 * the expected location, then this function will throw an error.
 *
 * @param tokenize Tokenizer function.
 * @param source Source code to tokenize.
 * @param expectedTokens Expected tokens.
 *
 * @throws If the merged fragments don't match the source code.
 * @throws If the number of tokens doesn't match the number of expected tokens.
 * @throws If the location of a token doesn't match the expected location.
 * @throws If the scopes of a token don't match the expected scopes.
 * @throws If the fragment of a token doesn't match the expected fragment.
 */
export function expectTokens(tokenize: AdblockTokenizer, source: string, expectedTokens: ExpectedToken[]): void {
    // Merging fragments should give us the original source
    const mergedFragments = expectedTokens.map((token) => token.fragment).join('');

    if (mergedFragments !== source) {
        throw new Error('The merged fragments do not match the source, so the expectation is invalid');
    }

    // Tokenize the source
    const tokens = tokenize(source);

    // Check that the number of tokens matches the number of expected tokens
    if (tokens.length !== expectedTokens.length) {
        throw new Error(`Expected ${expectedTokens.length} tokens, but got ${tokens.length}`);
    }

    let offset = 0;

    // Check that each token matches the expected token
    for (let i = 0; i < tokens.length; i += 1) {
        const endOffset = offset + expectedTokens[i].fragment.length;

        // Check location
        if (tokens[i].startIndex !== offset) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Expected token ${i} to start at offset ${offset}, but it starts at offset ${tokens[i].startIndex}`,
            );
        }

        if (tokens[i].endIndex !== endOffset) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Expected token ${i} to end at offset ${endOffset}, but it ends at offset ${tokens[i].endIndex}`,
            );
        }

        if (!isArraysEqual(tokens[i].scopes, expectedTokens[i].scopes)) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Expected token ${i} to have scopes [${expectedTokens[i].scopes.join(', ')}], but got [${tokens[i].scopes.join(', ')}]`,
            );
        }

        // Update the offset
        offset = endOffset;
    }
}
