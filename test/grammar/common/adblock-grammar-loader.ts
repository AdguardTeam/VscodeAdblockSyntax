/**
 * @file Grammar loader for tests
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { IGrammar, Registry, parseRawGrammar } from 'vscode-textmate';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { convertYamlToPlist } from '../../../tools/grammar-converter';

/** Source file path for the grammar */
const GRAMMAR_PATH = join(__dirname, '../../../', 'syntaxes/adblock.yaml-tmlanguage');

/** Scope name for the grammar */
const GRAMMAR_SCOPE = 'text.adblock';

/**
 * Loads a grammar from YAML source, converts it to PList, and loads it into a registry.
 * Highly inspired by https://github.com/microsoft/vscode-textmate#using
 *
 * @returns The grammar or null if it could not be loaded
 * @throws If the grammar could not be loaded
 */
export async function loadAdblockGrammar(): Promise<IGrammar | null> {
    // Read the raw contents of the grammar file
    const rawYaml = await readFile(GRAMMAR_PATH, 'utf8');

    // Convert the raw yaml into a plist
    const plist = convertYamlToPlist(rawYaml);

    // Load the wasm library for the oniguruma regex engine
    // eslint-disable-next-line max-len
    const wasmBin = (await readFile(join(__dirname, '../../../', 'node_modules/vscode-oniguruma/release/onig.wasm'))).buffer;
    const vscodeOnigurumaLib = loadWASM(wasmBin).then(() => {
        return {
            createOnigScanner(patterns: string[]) { return new OnigScanner(patterns); },
            createOnigString(s: string) { return new OnigString(s); },
        };
    });

    // Create a registry that can create a grammar from a scope name
    const registry = new Registry({
        onigLib: vscodeOnigurumaLib,

        // Load the grammar from the plist
        loadGrammar: async (scopeName) => {
            if (scopeName === GRAMMAR_SCOPE) {
                return parseRawGrammar(plist);
            }

            // eslint-disable-next-line no-console
            console.log(`Unknown scope name: ${scopeName}`);

            return null;
        },
    });

    // Load the adblock grammar from the registry by its scope name
    return registry.loadGrammar(GRAMMAR_SCOPE);
}
