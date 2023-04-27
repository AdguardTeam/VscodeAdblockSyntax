/**
 * @file Gets the adblock tokenizer function from the loaded grammar
 */

import { IToken, INITIAL } from 'vscode-textmate';
import { loadAdblockGrammar } from './adblock-grammar-loader';

/**
 * A function that tokenizes source code.
 *
 * @param source The source code to tokenize.
 * @returns Array of tokens / scopes.
 */
export type AdblockTokenizer = (source: string) => IToken[];

/**
 * Loads the adblock grammar and returns a tokenizer function
 * that can be used to tokenize source code.
 *
 * @returns The tokenizer function.
 */
export async function getAdblockTokenizer(): Promise<AdblockTokenizer> {
    // Load the grammar
    const result = await loadAdblockGrammar();

    // Throw an error if the grammar could not be loaded
    if (result === null) {
        throw new Error('Couldn\'t load the adblock grammar');
    }

    return (source: string) => result.tokenizeLine(source, INITIAL).tokens;
}
