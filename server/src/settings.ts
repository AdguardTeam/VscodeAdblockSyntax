/**
 * @file Extension settings
 *
 * Guide to add new settings to the extension:
 *
 * 1. Add a new entry to:
 *   - extension metadata (package.json: contributes.configuration.properties)
 *   - extension settings interface (settings.ts: ExtensionSettings)
 *   - default settings object (settings.ts: defaultSettings)
 * 2. Implement the logic in the server.ts file
 */

import { NPM, PackageManager } from './utils/package-managers';

/**
 * Represents the extension settings
 */
export interface ExtensionSettings {
    enableAglint: boolean;
    useExternalAglintPackages: boolean;
    packageManager: PackageManager;
}

/**
 * Default extension settings
 */
export const defaultSettings: ExtensionSettings = {
    enableAglint: true,
    useExternalAglintPackages: true,
    packageManager: NPM,
};
