/**
 * @file Grammar loader for tests
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { type IGrammar, Registry, parseRawGrammar } from 'vscode-textmate';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';

import { convertYamlToPlist } from '../../../tools/grammar-converter';

/**
 * Source file path for the grammar
 */
const ADBLOCK_GRAMMAR_PATH = join(__dirname, '../../../', 'syntaxes/adblock.yaml-tmlanguage');

/**
 * Scope name for the adblock grammar
 */
const ADBLOCK_GRAMMAR_SCOPE = 'text.adblock';

/**
 * Scope name for the JavaScript grammar
 */
const JS_GRAMMAR_SCOPE = 'source.js';

/**
 * Dummy grammar for JavaScript (raw)
 */
const DUMMY_JS_GRAMMAR = `{
    "name": "JavaScript",
    "scopeName": "source.js",
    "patterns": [],
    "repository": {}
}`;

/**
 * Fake file name for the dummy JavaScript grammar
 */
const DUMMY_JS_GRAMMAR_FILE_NAME = 'dummy-js-grammar.json';

/**
 * Loads a grammar from YAML source, converts it to PList, and loads it into a registry.
 * Highly inspired by https://github.com/microsoft/vscode-textmate#using
 *
 * @returns The grammar or null if it could not be loaded
 * @throws If the grammar could not be loaded
 */
export async function loadAdblockGrammar(): Promise<IGrammar | null> {
    // Read the raw contents of the grammar file
    const rawYaml = await readFile(ADBLOCK_GRAMMAR_PATH, 'utf8');

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
            switch (scopeName) {
                case ADBLOCK_GRAMMAR_SCOPE:
                    return parseRawGrammar(plist);

                case JS_GRAMMAR_SCOPE:
                    // "Fake json file name" should be specified for triggering the JSON
                    // parser in the textmate library
                    return parseRawGrammar(DUMMY_JS_GRAMMAR, DUMMY_JS_GRAMMAR_FILE_NAME);

                default:
                    throw new Error(`Unknown scope name: ${scopeName}`);
            }
        },
    });

    // Load the adblock grammar from the registry by its scope name
    return registry.loadGrammarWithEmbeddedLanguages(ADBLOCK_GRAMMAR_SCOPE, 1, {
        [JS_GRAMMAR_SCOPE]: 2,
    });
}
