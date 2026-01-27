/* eslint-disable no-console, n/no-unsupported-features/node-builtins, no-await-in-loop */
import { createWriteStream } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import chalk from 'chalk';
import fg from 'fast-glob';
import * as fs from 'fs-extra';
import * as tar from 'tar';

import { getAdblockTokenizer } from '../utils/get-adblock-tokenizer';

const TEMP_DIR = path.join(__dirname, '.temp');

const sources = [
    { name: 'AdGuard Filters', url: 'https://github.com/AdguardTeam/AdguardFilters/archive/refs/heads/master.tar.gz' },
    { name: 'uBlock Origin', url: 'https://github.com/uBlockOrigin/uAssets/archive/refs/heads/master.tar.gz' },
];

/**
 * Represents an invalid token found during filter file analysis.
 */
interface InvalidToken {
    /**
     * Path to the file containing the invalid token.
     */
    file: string;
    /**
     * Line number where the invalid token was found (1-indexed).
     */
    line: number;
    /**
     * Full content of the line containing the invalid token.
     */
    lineContent: string;
    /**
     * Scopes assigned to the invalid token by the tokenizer.
     */
    tokenScopes: string[];
    /**
     * Starting index of the invalid token in the line content.
     */
    startIndex: number;
    /**
     * Ending index of the invalid token in the line content.
     */
    endIndex: number;
}

/**
 * Downloads a file from a URL to a destination path.
 *
 * @param url URL to download from.
 * @param destPath Destination file path.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }

    await pipeline(
        Readable.fromWeb(response.body as any),
        createWriteStream(destPath),
    );
}

/**
 * Extracts a tar.gz file to an output directory using the tar package.
 *
 * @param tarPath Path to tar.gz file.
 * @param outputDir Output directory.
 *
 * @returns Promise that resolves when extraction is complete.
 */
async function extractTarGz(tarPath: string, outputDir: string): Promise<void> {
    await fs.ensureDir(outputDir);
    await tar.extract({
        file: tarPath,
        cwd: outputDir,
    });
}

/**
 * Main function to analyze filter files for invalid tokens.
 */
async function analyzeFilterFiles(): Promise<void> {
    console.log(`\n${chalk.bold.cyan('🚀 Starting integration test...')}\n`);

    // Create temp directory
    await fs.ensureDir(TEMP_DIR);

    const tokenizer = await getAdblockTokenizer();
    console.log(`${chalk.green('✓ Tokenizer loaded successfully')}\n`);

    const allInvalidTokens: InvalidToken[] = [];

    for (const source of sources) {
        console.log(chalk.bold.blue(`📦 Processing ${source.name}...`));

        const tarPath = path.join(TEMP_DIR, `${source.name.replace(/\s/g, '_')}.tar.gz`);
        const extractPath = path.join(TEMP_DIR, source.name.replace(/\s/g, '_'));

        // Download
        console.log(`  ${chalk.cyan('⬇️  Downloading from')} ${source.url}...`);
        await downloadFile(source.url, tarPath);

        // Extract
        console.log(`  ${chalk.yellow('📂 Extracting...')}`);
        await extractTarGz(tarPath, extractPath);

        // Find all .txt files
        const txtFiles = await fg('**/*.txt', {
            cwd: extractPath,
            absolute: true,
        });

        console.log(`  ${chalk.magenta(`📄 Found ${txtFiles.length} .txt files`)}`);

        // Analyze each file
        for (const filePath of txtFiles) {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split(/\r?\n/);

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
                const line = lines[lineIndex];
                if (!line.trim()) {
                    continue;
                }

                const tokens = tokenizer(line);

                for (const token of tokens) {
                    const hasInvalidScope = token.scopes.some(
                        (scope) => scope.startsWith('invalid.illegal'),
                    );

                    if (hasInvalidScope) {
                        allInvalidTokens.push({
                            // file: path.relative(TEMP_DIR, filePath),
                            file: filePath,
                            line: lineIndex + 1,
                            lineContent: line,
                            tokenScopes: token.scopes,
                            startIndex: token.startIndex,
                            endIndex: token.endIndex,
                        });
                    }
                }
            }
        }

        console.log(`  ${chalk.green(`✓ Completed ${source.name}`)}\n`);
    }

    // Report results
    console.log(`\n${chalk.bold('═'.repeat(80))}`);
    console.log(chalk.bold.cyan('📊 INTEGRATION TEST RESULTS'));
    console.log(`${chalk.bold('═'.repeat(80))}\n`);

    if (allInvalidTokens.length === 0) {
        console.log(
            `${chalk.bold.green('✅ No invalid tokens found! All filters tokenized successfully.')}\n`,
        );
    } else {
        console.log(
            `${chalk.bold.yellow(`⚠️  Found ${allInvalidTokens.length} invalid token(s):`)}\n`,
        );

        for (const invalidToken of allInvalidTokens) {
            const fragment = invalidToken.lineContent.substring(
                invalidToken.startIndex,
                invalidToken.endIndex,
            );

            // Split content to highlight the invalid token portion
            const before = invalidToken.lineContent.substring(0, invalidToken.startIndex);
            const after = invalidToken.lineContent.substring(invalidToken.endIndex);
            const highlightedContent = `${chalk.white(before)}${chalk.bgRed.white(fragment)}${chalk.white(after)}`;

            console.log(`${chalk.bold.blue('File:')} ${chalk.dim(invalidToken.file)}`);
            console.log(`${chalk.bold.blue('Line:')} ${chalk.yellow(invalidToken.line)}`);
            console.log(`${chalk.bold.blue('Content:')} ${highlightedContent}`);
            console.log(`${chalk.bold.red('Token:')} ${chalk.red(JSON.stringify(fragment))}`);
            console.log(
                `${chalk.bold.blue('Scopes:')} ${chalk.magenta(invalidToken.tokenScopes.join(', '))}`,
            );
            const position = `${invalidToken.startIndex}-${invalidToken.endIndex}`;
            console.log(`${chalk.bold.blue('Position:')} ${chalk.cyan(position)}`);
            console.log(chalk.dim('─'.repeat(80)));
        }
    }

    console.log(`\n${chalk.bold.green('✨ Integration test completed.')}`);
}

analyzeFilterFiles().catch((error) => {
    console.error('Integration test failed:', error);
    throw error;
});
