/**
 * @file AGLint Language Server for VSCode (Node.js)
 */

import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    InitializeResult,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ParsedPath, join as joinPath } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
// TODO: Implement minimum version check
// import { satisfies } from 'semver';
// Import type definitions from the AGLint package
import type * as AGLint from '@adguard/aglint';
import cloneDeep from 'clone-deep';
import { resolveAglintModulePath } from './utils/aglint-resolver';
import { AGLINT_PACKAGE_NAME, AGLINT_REPO_URL, LF } from './common/constants';
import { defaultSettings, ExtensionSettings } from './settings';
import { NPM, PackageManager, getInstallationCommand } from './utils/package-managers';

// Store AGLint module here
let AGLintModule: typeof AGLint;

// TODO: Implement minimum version check
// const MIN_AGLINT_VERSION = '1.0.12';

/**
 * Path to the bundled AGLint module, relative to the server bundle.
 * Development done in TypeScript, but here we should think as if
 * the bundles would already be built.
 */
const BUNDLED_AGLINT_PATH = './aglint.js';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

/**
 * Root folder of the VSCode workspace
 */
let workspaceRoot: string | undefined;

type CachedPaths = { [key: string]: AGLint.LinterConfig };

/**
 * Cache of the scanned workspace
 */
let cachedPaths: CachedPaths | undefined;

/**
 * Actual settings for the extension (always synced)
 */
let settings: ExtensionSettings = defaultSettings;

/**
 * Scan the workspace and cache the result.
 */
async function cachePaths(): Promise<boolean> {
    // Cache the scan result
    try {
        if (!workspaceRoot) {
            throw new Error('Couldn\'t determine the workspace root of the VSCode instance');
        }

        // Get the config for the cwd, should exist
        const rootConfig = await AGLintModule.buildConfigForDirectory(workspaceRoot);

        const scanResult = await AGLintModule.scan(workspaceRoot);

        // Create a map of paths to configs
        const newCache: CachedPaths = {};

        if (!settings.enableAglint) {
            // If AGLint is disabled, we should ignore the scan
            return false;
        }

        await AGLintModule.walk(
            scanResult,
            {
                file: async (path: ParsedPath, config: AGLint.LinterConfig) => {
                    const filePath = joinPath(path.dir, path.base);

                    // Add the file path to the new cache map with the resolved config
                    newCache[filePath] = { ...config };
                },
            },
            rootConfig,
        );

        // Update the whole cache
        cachedPaths = { ...newCache };

        connection.console.info(`AGLint successfully scanned and cached the workspace: ${workspaceRoot}`);

        // Notify the client that the caching succeeded
        await connection.sendNotification('aglint/status');

        return true;
    } catch (error: unknown) {
        // Clear the cache
        cachedPaths = undefined;

        // Log the error
        connection.console.error(`AGLint failed to scan and cache the workspace: ${workspaceRoot}`);

        if (error instanceof Error) {
            if (error.name === 'NoConfigError') {
                /* eslint-disable max-len */
                connection.console.error([
                    'AGLint couldn\'t find the config file. To set up a configuration file for this project, please run:',
                    '',
                    `    ${getInstallationCommand(settings.packageManager, AGLINT_PACKAGE_NAME)} init`,
                    '',
                    'IMPORTANT: The init command creates a root config file, so be sure to run it in the root directory of your project!',
                    '',
                    'AGLint will try to find the config file in the current directory (cwd), but if the config file is not found',
                    'there, it will try to find it in the parent directory, and so on until it reaches your OS root directory.',
                ].join(LF));
                /* eslint-enable max-len */
            } else {
                connection.console.error(error.toString());
            }
        } else {
            connection.console.error(JSON.stringify(error));
        }

        // Notify the client that the caching failed
        await connection.sendNotification('aglint/status', { error });

        return false;
    }
}

/**
 * Load the installed AGLint module. If the module is not found, it will
 * fallback to the bundled version.
 *
 * @param dir Workspace root path
 * @param searchExternal Search for external AGLint installations (default: true)
 * @param packageManagers Package managers to use when searching for external AGLint installations (default: NPM).
 * It is only relevant if `searchExternal` is set to `true`. Technically, multiple package managers can be used,
 * but in practice, we only use one.
 */
async function loadAglintModule(
    dir: string,
    searchExternal = true,
    packageManagers: PackageManager[] = [NPM],
): Promise<void> {
    // Initially, we assume that the AGLint module is not installed
    let externalAglintPath: string | undefined;

    if (searchExternal) {
        connection.console.info(`Searching for external AGLint installations from: ${dir}`);

        externalAglintPath = await resolveAglintModulePath(
            dir,
            (message: string, verbose?: string | undefined) => {
                connection.tracer.log(message, verbose);
            },
            packageManagers,
        );

        if (!externalAglintPath) {
            connection.console.info([
                /* eslint-disable max-len */
                'It seems that the AGLint package is not installed either locally or globally. Falling back to the bundled version.',
                `You can install AGLint by running: ${getInstallationCommand(settings.packageManager, AGLINT_PACKAGE_NAME)}`,
                /* eslint-enable max-len */
            ].join(LF));
        } else {
            connection.console.info(`Using AGlint from: ${externalAglintPath}`);
        }
    } else {
        connection.console.info(
            'Searching for external AGLint installations disabled, falling back to the bundled version.',
        );
    }

    // Convert external path to a file URL, otherwise the module will fail to load
    if (externalAglintPath) {
        externalAglintPath = pathToFileURL(externalAglintPath).toString();
    }

    // Import corresponding AGLint module
    AGLintModule = await import(externalAglintPath || BUNDLED_AGLINT_PATH);

    // TODO: Another way to import the module, since we use CJS bundles
    // eslint-disable-next-line import/no-dynamic-require, global-require
    // AGLintModule = require(externalAglintPath || bundledAglintPath);

    // TODO: Implement minimum version check
    // TODO: Version should be exported from AGLint to do this simply
    // if (!satisfies(AGLint.version, `>=${MIN_AGLINT_VERSION}`)) {
    //     throw new Error([
    //         `The installed AGLint module is too old: ${version}`,
    //         `The minimum required version is: ${MIN_AGLINT_VERSION}`,
    //         `Please update the AGLint module: ${workspaceRoot}`,
    //     ].join(LF));
    // }
}

connection.onInitialize(async (params: InitializeParams) => {
    const { capabilities } = params;

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);

    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

    // TODO: Define the capabilities of the language server here
    const result: InitializeResult = {
        capabilities: {},
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }

    // TODO: Checks for better way to get the workspace root
    workspaceRoot = params.workspaceFolders ? fileURLToPath(params.workspaceFolders[0].uri) : undefined;

    return result;
});

/**
 * Lint the document and send the diagnostics to VSCode. It handles the
 * ignore & config files, since it uses the cached scan result, which
 * is based on the AGLint CLI logic.
 *
 * @param textDocument Document to lint
 */
async function lintFile(textDocument: TextDocument): Promise<void> {
    try {
        const documentPath = fileURLToPath(textDocument.uri);

        // If AGLint is disabled, report no diagnostics
        if (!settings.enableAglint) {
            // Reset the diagnostics for the document
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });

            return;
        }

        // If the file is not present in the cached path map, it means that it is
        // not lintable or it is marked as ignored in some .aglintignore file.
        // In this case, we should not lint it.
        // If the file is present in the cached path map, it means that it is
        // lintable and it has a config associated with it, at least the default one
        // (this is the natural behavior of the AGLint CLI's scan/walk functions).
        const config = cachedPaths !== undefined ? cachedPaths[documentPath] : undefined;

        // Skip linting if the file is not present in the cached path map
        if (config === undefined) {
            return;
        }

        // This is the actual content of the file in the editor
        const text = textDocument.getText();

        // Create the linter instance and lint the document text
        const linter = new AGLintModule.Linter(true, config);
        const { problems } = linter.lint(text);

        // Convert problems to VSCode diagnostics
        const diagnostics: Diagnostic[] = [];

        for (const problem of problems) {
            const severity = problem.severity === 'warn' || problem.severity === 1
                ? DiagnosticSeverity.Warning
                : DiagnosticSeverity.Error;

            const diagnostic: Diagnostic = {
                severity,

                // Linting problems using 1-based line numbers, but VSCode uses 0-based line numbers
                range: {
                    start: {
                        line: problem.position.startLine - 1,
                        character: problem.position.startColumn !== undefined ? problem.position.startColumn : 0,
                    },
                    end: {
                        line: problem.position.endLine - 1,
                        character: problem.position.endColumn !== undefined ? problem.position.endColumn : 0,
                    },
                },

                message: problem.message,

                source: 'aglint',
            };

            // Add permalink to the rule documentation
            if (problem.rule) {
                diagnostic.code = problem.rule;
                diagnostic.codeDescription = {
                    href: `${AGLINT_REPO_URL}#${problem.rule}`,
                };
            }

            diagnostics.push(diagnostic);

            // Notify the client that the linting succeeded
            await connection.sendNotification('aglint/status');
        }

        // Send the computed diagnostics to VSCode.
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    } catch (error: unknown) {
        connection.console.error(`AGLint failed to lint the document: ${textDocument.uri}`);

        if (error instanceof Error) {
            connection.console.error(error.toString());
        } else {
            connection.console.error(JSON.stringify(error));
        }

        // Reset the diagnostics for the document
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });

        // Notify the client that the linting failed
        await connection.sendNotification('aglint/status', { error });
    }
}

/**
 * Remove all diagnostics from all open text documents.
 */
function removeAllDiagnostics() {
    documents.all().forEach((document) => {
        connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    });
}

/**
 * Rebuild the cached paths and revalidate any open text documents.
 */
async function refreshLinter() {
    if (!settings.enableAglint || !workspaceRoot) {
        removeAllDiagnostics();
        return;
    }

    // Revalidate the cached paths
    await cachePaths();

    // Revalidate any open text documents
    documents.all().forEach(lintFile);
}

/**
 * Pull the settings from VSCode and update the settings variable. It also
 * re-builts the cached paths and revalidates any open text documents.
 *
 * "In this model the clients simply sends an empty change event to signal that the settings have
 * changed and must be reread"
 *
 * @param initial If true, it means that this is the first time we pull the settings
 * @see https://github.com/microsoft/vscode-languageserver-node/issues/380#issuecomment-414691493
 */
async function pullSettings(initial = false) {
    // Store old settings
    const oldSettings = cloneDeep(settings);

    if (hasConfigurationCapability) {
        // Get settings from VSCode
        const receivedSettings = (await connection.workspace.getConfiguration('adblock')) as ExtensionSettings;

        // Update the settings. No need to validate them, VSCode does this for us based on the schema
        // specified in the package.json
        // If we didn't receive any settings, use the default ones
        settings = receivedSettings || defaultSettings;
    } else {
        settings = defaultSettings;
    }

    // If initial is true, it means that this is the first time we pull the settings
    // In this case, we should load the AGLint module
    // If module related settings changed, we also need to reload the AGLint module
    if (
        initial
        || oldSettings.useExternalAglintPackages !== settings.useExternalAglintPackages
        || oldSettings.packageManager !== settings.packageManager
    ) {
        // Workspace root should be defined at this point
        if (!workspaceRoot) {
            connection.console.error('Workspace root is not defined');
            removeAllDiagnostics();
            return;
        }

        await loadAglintModule(workspaceRoot, settings.useExternalAglintPackages, [settings.packageManager]);
    }

    // If AGLint is disabled, remove status bar problems
    connection.sendNotification('aglint/status', { aglintEnabled: settings.enableAglint });

    if (!settings.enableAglint) {
        removeAllDiagnostics();
        connection.console.info('AGLint is disabled');
        return;
    }

    await refreshLinter();
}

connection.onDidChangeConfiguration(async () => {
    connection.console.info('Configuration changed');

    // Pull the settings from VSCode
    await pullSettings();
});

// Called when any of monitored file paths change
connection.onDidChangeWatchedFiles(async () => {
    // Reset current file diagnostics
    removeAllDiagnostics();

    await refreshLinter();
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    lintFile(change.document);
});

connection.onInitialized(async () => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }

    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(() => {
            connection.console.log('Workspace folder change event received.');
        });
    }

    if (!workspaceRoot) {
        connection.console.error('Couldn\'t determine the workspace root of the VSCode instance');
    } else {
        // Pull the settings from VSCode (in initial mode)
        await pullSettings(true);

        connection.console.info(`AGLint Language Server initialized in workspace: ${workspaceRoot}`);
    }
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.info(`AGLint Node.js Language Server running in node ${process.version}`);
