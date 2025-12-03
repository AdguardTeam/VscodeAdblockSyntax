/**
 * @file Constants used across the extension.
 */

import { FileScheme } from '@vscode-adblock-syntax/shared';

/**
 * Supported file extensions.
 */
export const SUPPORTED_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    'txt',
    'adblock',
    'ublock',
    'adguard',
]);

/**
 * Possible names of the config file.
 */
export const CONFIG_FILE_NAMES: ReadonlySet<string> = new Set([
    // aglint.config stuff
    'aglint.config.json',
    'aglint.config.yaml',
    'aglint.config.yml',

    // .aglintrc stuff
    '.aglintrc',
    '.aglintrc.json',
    '.aglintrc.yaml',
    '.aglintrc.yml',
]);

/**
 * Name of the ignore file.
 */
export const IGNORE_FILE_NAME = '.aglintignore';

/**
 * Default document scheme for filtering documents.
 */
export const DOCUMENT_SCHEME = FileScheme.File;

/**
 * Language ID for adblock filter lists.
 */
export const LANGUAGE_ID = 'adblock';

/**
 * Client ID for the language client.
 */
export const CLIENT_ID = 'aglint';

/**
 * Display name for the language client.
 */
export const CLIENT_NAME = 'AGLint';

/**
 * Priority for the VS Code status bar item.
 *
 * Higher values mean the item is placed more to the left *within its alignment group*.
 * For {@link StatusBarAlignment.Right}, a higher number positions it closer
 * to the center of the status bar; a lower number moves it toward the right edge.
 *
 * This project uses `100` as a balanced value; it is prominent but not far-left,
 * following the example from `vscode-extension-samples`:
 * https://github.com/microsoft/vscode-extension-samples/blob/986bcc700dee6cc4d1e6d4961a316eead110fb21/statusbar-sample/src/extension.ts#L21.
 *
 * Other extensions typically use values between 0 and 200:
 * https://github.com/search?q=createStatusBarItem(vscode.StatusBarAlignment.Right&type=code.
 *
 * This value is based on convention and visual preference, and can be adjusted in the future if needed.
 */
export const STATUS_BAR_PRIORITY = 100;
