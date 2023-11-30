/**
 * @file Changelog extractor
 * @see {@link https://keepachangelog.com/en/1.1.0/ | Keep a Changelog}
 * @note Run with: node -r esbuild-register tools/changelog-extractor.ts
 */

import escapeStringRegexp from 'escape-string-regexp';
import path from 'path';
import remarkInlineLinks from 'remark-inline-links';
import remarkParse from 'remark-parse';
import remarkStringify, { type Options as StringifyOptions } from 'remark-stringify';
import { readFile, writeFile } from 'fs/promises';
import { type Root } from 'remark-parse/lib';
import { unified } from 'unified';
import { Command } from 'commander';
import { ensureDir } from 'fs-extra';

const EMPTY = '';
const HYPHEN = '-';

const UPPER_LEVEL = '../';
const OUT_FOLDER = 'out';

const INPUT_FILE = 'CHANGELOG.md';
const OUTPUT_FILE = 'TEMP_CHANGES.md';

// TODO: Read project data from package.json, e.g. project name and make them available via variables, like {name}
const inputFilePath = path.join(__dirname, UPPER_LEVEL, INPUT_FILE);
const outputFolderPath = path.join(__dirname, UPPER_LEVEL, OUT_FOLDER);
const outputFilePath = path.join(outputFolderPath, OUTPUT_FILE);

/**
 * Options for the remark-stringify plugin
 */
const serializationOptions: StringifyOptions = {
    bullet: HYPHEN,
};

/**
 * Options for the extractRelease transformer
 */
interface ExtractOptions {
    /**
     * Fallback text if the version number is not found in the changelog
     */
    fallback?: string;
}

/**
 * A simple helper function that parses the markdown document into an AST.
 *
 * @param md Markdown document as string.
 * @returns Root node of the parsed markdown document (AST).
 */
const parseMd = (md: string): Root => {
    return unified() // create a new processor
        .use(remarkParse) // parse the markdown document
        .use(remarkInlineLinks) // convert [text][link-definition] cases to [text](link) where possible
        .parse(md); // parse the fallback text to a node
};

/**
 * Extracts the release from the markdown document
 *
 * @param version Version number what we are looking for, e.g. 1.0.0
 * @param options Extract options
 * @returns Transformer function
 */
const extractRelease = (version: string, options: ExtractOptions = {}) => {
    return (tree: Root) => {
        // Transformer function should return a Root node that passes to the next transformer in the chain (if any)
        const root: Root = {
            type: 'root',
            children: [],
        };

        // Prepare nodes
        const fallback = parseMd(options.fallback || EMPTY); // always present, at least as an empty string

        // String should start with the version number, and should be followed by a space or the end of the string.
        // For example:
        //  - ## 1.0.0
        //  - ## 1.0.0 (2020-01-01)
        //  - ## 1.0.0 - 2020-01-01
        //  - ## [1.0.0](link)
        //  - etc.
        // TODO: Improve this regexp, if needed
        const VERSION_RE = new RegExp(`^${escapeStringRegexp(version)}(\\s|$)`);

        // It is enough to traverse the first level of the tree
        for (let i = 0; i < tree.children.length; i += 1) {
            const node = tree.children[i];

            // Find the first 2. level heading which includes the version number what we are looking for
            // like: ## 1.0.0
            if (node.type === 'heading' && node.depth === 2) {
                if (
                    // ## 1.0.0
                    (node.children[0]?.type === 'text' && node.children[0]?.value?.match(VERSION_RE))
                    // ## [1.0.0](link)
                    || (
                        node.children[0]?.type === 'link'
                        && node.children[0]?.children[0]?.type === 'text'
                        && node.children[0]?.children[0]?.value?.match(VERSION_RE)
                    )
                ) {
                    // Find the next 2. level heading or the end of the document, and add all nodes between them to the
                    // root node
                    for (let j = i + 1; j < tree.children.length; j += 1) {
                        const nextNode = tree.children[j];

                        if (nextNode.type === 'heading' && nextNode.depth === 2) {
                            break;
                        }

                        root.children.push(nextNode);
                    }
                }
            }
        }

        // If the root node has no children, return the fallback node
        return root.children.length > 0 ? root : fallback;
    };
};

const options = new Command()
    .requiredOption('-e, --extract <string>', 'Version number what we want to extract')
    .option(
        '-f, --fallback <string>',
        'Fallback text if the version number is not found',
        'See [CHANGELOG.md](./CHANGELOG.md) for the list of changes.',
    )
    .parse(process.argv)
    .opts();

const main = async () => {
    const output = await unified() // create a new processor
        .use(remarkParse) // parse the markdown document
        .use(remarkInlineLinks) // convert [text][link-definition] cases to [text](link) where possible
        .use(extractRelease, options.extract, options) // extract & transform the release text, if any
        .use(remarkStringify, serializationOptions) // serialize the node to markdown
        .process(await readFile(inputFilePath)); // process the input file

    // Create the output folder, if not exists
    await ensureDir(outputFolderPath);

    await writeFile(outputFilePath, output.toString());
};

main();
