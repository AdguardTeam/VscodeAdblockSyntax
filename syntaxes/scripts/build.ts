/* eslint-disable no-console */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import chokidar from 'chokidar';
import { ensureDir } from 'fs-extra';
import { YAMLParseError } from 'yaml';

import { getErrorMessage } from '../utils/error';
import { convertYamlToPlist } from '../utils/grammar-converter';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCE_GRAMMAR_FILENAME = 'adblock.yaml-tmlanguage';
const DEST_GRAMMAR_FILENAME = 'adblock.plist';

const SYNTAXES_FOLDER = join(__dirname, '..');
const OUT_FOLDER = join(SYNTAXES_FOLDER, 'out');

const SOURCE_GRAMMAR_PATH = join(SYNTAXES_FOLDER, SOURCE_GRAMMAR_FILENAME);
const DEST_GRAMMAR_PATH = join(OUT_FOLDER, DEST_GRAMMAR_FILENAME);

const args = process.argv.slice(2);

/**
 * Builds the source grammar file into a PList representation.
 *
 * @param minify Whether to minify the output PList. Default is false.
 *
 * @throws If the source grammar file doesn't exist.
 * @throws If the source grammar file is not a valid YAML file.
 * @throws If cannot write the PList representation to the dist folder.
 */
async function buildGrammar(minify = false) {
    // Read the raw YAML content from the grammar file
    const rawYaml = await readFile(SOURCE_GRAMMAR_PATH, 'utf8');

    // Convert the YAML content into a PList representation
    const plistGrammar = convertYamlToPlist(rawYaml, minify);

    // Write the PList representation to the dist folder
    await writeFile(DEST_GRAMMAR_PATH, plistGrammar);
}

/**
 * Builds the grammar, handling errors and logging progress.
 */
async function build() {
    console.log('[grammar] build started');

    try {
        await ensureDir(OUT_FOLDER);
        await buildGrammar(args.includes('--minify'));

        // eslint-disable-next-line no-console
        console.log(`Grammar file written to ${join(OUT_FOLDER, DEST_GRAMMAR_FILENAME)}`);
    } catch (error: unknown) {
        // https://eemeli.org/yaml/#errors
        if (error instanceof YAMLParseError) {
            const severity = error.name === 'YAMLParseError' ? 'error' : 'warn';
            const { line, col } = error.linePos![0];

            console.error(`[${severity}] ${SOURCE_GRAMMAR_FILENAME}:${line}:${col}: ${error.message}`);
        } else {
            console.error(`[error] ${getErrorMessage(error)}`);
        }
    }

    // eslint-disable-next-line no-console
    console.log('[grammar] build finished');
}

(async () => {
    if (args.includes('--watch') || args.includes('-w')) {
        await build();

        chokidar.watch(SOURCE_GRAMMAR_PATH).on('change', async () => {
            console.log(`[grammar] ${SOURCE_GRAMMAR_FILENAME} changed, rebuilding...`);
            await build();
        });
    } else {
        await build();
    }
})();
