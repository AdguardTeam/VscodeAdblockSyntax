/**
 * @file This is a very simple script that builds the grammar file to PList.
 */

import { join } from 'node:path';

import {
    exists,
    mkdir,
    readFile,
    writeFile,
} from 'fs-extra';
import { YAMLParseError } from 'yaml';

import { convertYamlToPlist } from './grammar-converter';
import { getErrorMessage } from './utils/error';

const SOURCE_GRAMMAR_FILE = 'adblock.yaml-tmlanguage';
const DEST_GRAMMAR_FILE = 'adblock.plist';

const SYNTAXES_FOLDER = join(__dirname, '..', 'syntaxes');
const OUT_FOLDER = join(SYNTAXES_FOLDER, 'out');

/**
 * Creates the out folder if it doesn't exist.
 */
async function createOutFolder() {
    // If the dist folder doesn't exist, create it
    if (!(await exists(OUT_FOLDER))) {
        await mkdir(OUT_FOLDER);
    }
}

/**
 * Builds the source grammar file into a PList representation.
 *
 * @throws If the source grammar file doesn't exist.
 * @throws If the source grammar file is not a valid YAML file.
 * @throws If cannot write the PList representation to the dist folder.
 */
async function buildGrammar() {
    // Read the raw YAML content from the grammar file
    const rawYaml = await readFile(join(SYNTAXES_FOLDER, SOURCE_GRAMMAR_FILE), 'utf8');

    // Convert the YAML content into a PList representation
    const plistGrammar = convertYamlToPlist(rawYaml);

    // Write the PList representation to the dist folder
    await writeFile(join(OUT_FOLDER, DEST_GRAMMAR_FILE), plistGrammar);
}

/**
 * Main function that runs the script.
 */
async function main() {
    // eslint-disable-next-line no-console
    console.log('[grammar] build started');

    try {
        await createOutFolder();
        await buildGrammar();

        // eslint-disable-next-line no-console
        console.log(`Grammar file written to ${join(OUT_FOLDER, DEST_GRAMMAR_FILE)}`);
    } catch (error: unknown) {
        // https://eemeli.org/yaml/#errors
        if (error instanceof YAMLParseError) {
            const severity = error.name === 'YAMLParseError' ? 'error' : 'warn';
            const { line, col } = error.linePos![0];

            // eslint-disable-next-line no-console
            console.error(`[${severity}] ${SOURCE_GRAMMAR_FILE}:${line}:${col}: ${error.message}`);
        } else {
            // eslint-disable-next-line no-console
            console.error(`[error] ${getErrorMessage(error)}`);
        }
    }

    // eslint-disable-next-line no-console
    console.log('[grammar] build finished');
}

main();
