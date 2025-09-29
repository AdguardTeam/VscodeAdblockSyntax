/**
 * @file Utility functions for working with URIs.
 */
import { URI } from 'vscode-uri';

/**
 * Schemes for file documents.
 */
// TODO: Add more schemes if needed
const enum FileScheme {
    File = 'file',
}

/**
 * Checks if the given URI is a file URI.
 *
 * @param uri The URI to check.
 *
 * @returns True if the URI is a file URI, false otherwise.
 */
export const isFileUri = (uri: string) => {
    try {
        return URI.parse(uri).scheme.toLowerCase() === FileScheme.File;
    } catch {
        // If parsing fails, we assume it's not a valid file URI
        return false;
    }
};
