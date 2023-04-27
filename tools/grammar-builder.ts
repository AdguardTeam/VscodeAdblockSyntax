/**
 * @file This is a very simple script that builds the grammar file to PList
 */

import {
    exists, mkdir, readFile, writeFile,
} from 'fs-extra';
import { join } from 'path';
import { convertYamlToPlist } from './grammar-converter';

/** Path to the source grammar file */
const SOURCE_GRAMMAR_FILE = 'syntaxes/adblock.yaml-tmlanguage';

/** Path to the out folder */
const OUT_FOLDER = 'syntaxes/out';

/** Path to the builded grammar file */
const DEST_GRAMMAR_FILE = join(OUT_FOLDER, 'adblock.plist');

/**
 * Creates the out folder if it doesn't exist
 */
async function createOutFolder() {
    // If the dist folder doesn't exist, create it
    if (!(await exists(OUT_FOLDER))) {
        await mkdir(OUT_FOLDER);
    }
}

/**
 * Builds the source grammar file into a PList representation
 */
async function buildGrammar() {
    // Read the raw YAML content from the grammar file
    const rawYaml = await readFile(SOURCE_GRAMMAR_FILE, 'utf8');

    // Convert the YAML content into a PList representation
    const plistGrammar = convertYamlToPlist(rawYaml);

    // Write the PList representation to the dist folder
    await writeFile(DEST_GRAMMAR_FILE, plistGrammar);
}

/**
 * Main function that runs the script
 */
async function main() {
    await createOutFolder();
    await buildGrammar();

    // eslint-disable-next-line no-console
    console.log(`Grammar built to ${DEST_GRAMMAR_FILE}`);
}

main();
