/* eslint-disable class-methods-use-this */
import fs from 'node:fs/promises';

import { type FileStats, type FileSystemAdapter, type GlobOptions } from '@adguard/aglint';
import fastGlob from 'fast-glob';
import type { TextDocuments } from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { fileExists } from '../utils/file-exists';

/**
 * LSP server file system adapter.
 * Reads open documents from LSP TextDocuments cache,
 * falls back to file system for everything else.
 */
export class LSPFileSystemAdapter implements FileSystemAdapter {
    /** @inheritdoc */
    constructor(
        private documents?: TextDocuments<TextDocument>,
    ) {}

    /** @inheritdoc */
    public async readFile(path: string): Promise<string> {
        // Try to get from open documents first
        if (this.documents) {
            const doc = this.documents.get(`file://${path}`);
            if (doc) {
                return doc.getText();
            }
        }

        // Fall back to file system
        return fs.readFile(path, 'utf8');
    }

    /** @inheritdoc */
    public async stat(path: string): Promise<FileStats> {
        const stats = await fs.stat(path);
        return {
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            mtime: stats.mtimeMs,
        };
    }

    /** @inheritdoc */
    public async exists(path: string): Promise<boolean> {
        return fileExists(path);
    }

    /** @inheritdoc */
    public async glob(patterns: string[], options: GlobOptions): Promise<string[]> {
        return fastGlob(patterns, {
            cwd: options.cwd,
            dot: options.dot ?? false,
            onlyFiles: options.onlyFiles ?? true,
            followSymbolicLinks: options.followSymlinks ?? false,
            absolute: options.absolute ?? true,
            ignore: options.ignore,
            unique: true,
        });
    }
}
