/* eslint-disable no-bitwise */
/**
 * @file AGLint Language Server for VSCode (Node.js).
 *
 * @todo Split this server into multiple files by creating a server context.
 */

import { join as joinPath, type ParsedPath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type * as AGLint from '@adguard/aglint';
import cloneDeep from 'clone-deep';
import { satisfies } from 'semver';
import {
    CodeAction,
    CodeActionKind,
    createConnection,
    type Diagnostic,
    DiagnosticSeverity,
    DidChangeConfigurationNotification,
    type InitializeParams,
    type InitializeResult,
    Position,
    ProposedFeatures,
    Range,
    TextDocumentEdit,
    TextDocuments,
    TextDocumentSyncKind,
    TextEdit,
    uinteger,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { CommentMarker, type ConfigCommentRule, ConfigCommentRuleParser } from './agtree';
import {
    AGLINT_PACKAGE_NAME,
    AGLINT_REPO_URL,
    EMPTY,
    LF,
    SPACE,
} from './common/constants';
import { defaultSettings, type ExtensionSettings } from './settings';
import { resolveAglintModulePath } from './utils/aglint-resolver';
import { getErrorMessage } from './utils/error';
import { getInstallationCommand, NPM, type PackageManager } from './utils/package-managers';
import { isFileUri } from './utils/uri';

// Store AGLint module here
let AGLintModule: typeof AGLint;

/**
 * Minimum version of the external AGLint module that is supported by the VSCode extension.
 * If the version is lower than this, the extension will fallback to the bundled version.
 */
const MIN_EXTERNAL_AGLINT_VERSION = '2.0.6';

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
 * Root folder of the VSCode workspace.
 */
let workspaceRoot: string | undefined;

type CachedPaths = { [key: string]: AGLint.LinterConfig };

/**
 * Cache of the scanned workspace.
 */
let cachedPaths: CachedPaths | undefined;

/**
 * Actual settings for the extension (always synced).
 */
let settings: ExtensionSettings = defaultSettings;

/**
 * AGLint commands supported by the language server.
 */
enum AglintCommand {
    DisableNextLine = 'aglint-disable-next-line',
}

/**
 * Scan the workspace and cache the result.
 *
 * @returns True if the caching succeeded, false otherwise.
 */
async function cachePaths(): Promise<boolean> {
    // Cache the scan result
    try {
        if (!workspaceRoot) {
            throw new Error('Could not determine the workspace root of the VSCode instance');
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
                    'AGLint could not find the config file. To set up a configuration file for this project, please run:',
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
 * Helper function to import the AGLint module dynamically.
 *
 * @param path Path to the AGLint module.
 *
 * @returns Loaded AGLint module.
 *
 * @throws If the module cannot be found.
 */
const importAglint = async (path: string): Promise<typeof AGLint> => {
    const aglintPkg = await import(path);

    // Module may have a default export
    if ('default' in aglintPkg) {
        return aglintPkg.default as typeof AGLint;
    }

    return aglintPkg;
};

/**
 * Load the installed AGLint module. If the module is not found, it will
 * fallback to the bundled version.
 *
 * @param dir Workspace root path.
 * @param searchExternal Search for external AGLint installations (default: true).
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
            connection.console.info(`Found external AGLint at: ${externalAglintPath}`);
        }
    } else {
        connection.console.info(
            'Searching for external AGLint installations disabled, falling back to the bundled version.',
        );
    }

    if (externalAglintPath) {
        // Dynamic import requires a URL, not a path
        const externalAglintUrlPath = pathToFileURL(externalAglintPath).toString();

        connection.console.info(`Loading external AGLint module from: ${externalAglintPath}`);

        try {
            AGLintModule = await importAglint(externalAglintUrlPath);

            connection.console.info('Successfully loaded external AGLint module');
            connection.console.info('Checking the version of external AGLint module');

            const suffix = `version: ${AGLintModule.version}, minimum required version: ${MIN_EXTERNAL_AGLINT_VERSION}`;

            if (satisfies(AGLintModule.version, `>=${MIN_EXTERNAL_AGLINT_VERSION}`)) {
                connection.console.info(
                    `External AGLint module version is compatible with the VSCode extension (${suffix})`,
                );
                return;
            }

            connection.console.error(
                `External AGLint module version is not compatible with the VSCode extension (${suffix})`,
            );
        } catch (error: unknown) {
            connection.console.error(
                // eslint-disable-next-line max-len
                `Failed to load external AGLint module from: ${externalAglintPath}, because of the following error: ${getErrorMessage(error)}`,
            );
        }

        connection.console.info('Falling back to the bundled version of AGLint');
    }

    connection.console.info('Loading bundled AGLint module');

    AGLintModule = await importAglint(BUNDLED_AGLINT_PATH);

    connection.console.info(`Successfully loaded bundled AGLint module (version: ${AGLintModule.version})`);
}

/**
 * Helper function to extract the workspace root URI from the initialization parameters.
 *
 * @param params Initialization parameters.
 *
 * @returns Workspace root URI or undefined if not found.
 */
const extractWorkspaceRootUri = (params: InitializeParams): string | undefined => {
    let workspaceRootUri: string | undefined;

    if (params.initializationOptions && params.initializationOptions.workspaceFolder?.uri) {
        workspaceRootUri = params.initializationOptions.workspaceFolder.uri;
    } else if (params.rootUri) {
        workspaceRootUri = params.rootUri;
    } else if (params.workspaceFolders?.length) {
        workspaceRootUri = params.workspaceFolders[0].uri;
    }

    return workspaceRootUri;
};

/**
 * Helper function to get the workspace root path from the workspace root URI.
 *
 * @param rootUri Workspace root URI.
 *
 * @returns Workspace root path or undefined if the URI is not a file URI.
 */
const getWorkspaceRootFromRootUri = (rootUri: string | undefined): string | undefined => {
    return rootUri && isFileUri(rootUri)
        ? fileURLToPath(rootUri)
        : undefined;
};

connection.onInitialize(async (params: InitializeParams) => {
    const { capabilities } = params;

    const workspaceRootUri = extractWorkspaceRootUri(params);
    workspaceRoot = getWorkspaceRootFromRootUri(workspaceRootUri);

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);

    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

    let message = 'Initializing server instance ';
    if (workspaceRoot) {
        message += `for workspace root: ${workspaceRoot}`;
    } else {
        message += 'without workspace root';
    }
    connection.console.log(message);

    // TODO: Define the capabilities of the language server here
    const result: InitializeResult = {
        capabilities: {
            codeActionProvider: true,
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
            },
        },
    };

    // Since we start a new server instance for each workspace folder,
    // we do not need to handle workspace folder changes.
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(() => {
            connection.console.log('Workspace folder change event received (ignored by per-folder server instance).');
        });
    }

    return result;
});

/**
 * Lint the document and send the diagnostics to VSCode. It handles the
 * ignore & config files, since it uses the cached scan result, which
 * is based on the AGLint CLI logic.
 *
 * @param textDocument Document to lint.
 */
async function lintFile(textDocument: TextDocument): Promise<void> {
    if (!isFileUri(textDocument.uri)) {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }

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
                range: Range.create(
                    // Note: linting problems using 1-based line numbers, but VSCode uses 0-based line numbers
                    Position.create(problem.position.startLine - 1, problem.position.startColumn ?? 0),
                    Position.create(problem.position.endLine - 1, problem.position.endColumn ?? 0),
                ),
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
            // eslint-disable-next-line no-await-in-loop
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
 * Parse AGLint config comment rule in a tolerant way (did not throw on parsing error).
 *
 * @param rule Rule to parse.
 *
 * @returns AGLint config comment rule node or null if parsing failed.
 */
const parseConfigCommentTolerant = (rule: string): ConfigCommentRule | null => {
    try {
        return ConfigCommentRuleParser.parse(rule);
    } catch (error: unknown) {
        connection.console.error(`'${rule}' is not a valid AGLint config comment rule: ${getErrorMessage(error)}`);
        return null;
    }
};

connection.onCodeAction((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (textDocument === undefined) {
        return undefined;
    }

    const { diagnostics } = params.context;
    const actions: CodeAction[] = [];

    // Make '! aglint-disable-next-line' prefix
    const aglintDisableNextLinePrefix = [
        CommentMarker.Regular,
        SPACE,
        AglintCommand.DisableNextLine,
    ].join(EMPTY);

    for (const diagnostic of diagnostics) {
        const { code, range } = diagnostic;
        const { line } = range.start;

        if (!code) {
            // In this case we don't have a rule name, because some parsing error happened,
            // and parsing errors have more priority than linting errors: if a rule cannot be parsed,
            // it cannot be checked with linter rules.
            // So we need to suggest disabling AGLint for the line completely as a quick fix.
            const titleDisableRule = 'Disable AGLint for this line';
            const actionDisableRule = CodeAction.create(titleDisableRule, CodeActionKind.QuickFix);

            // Or delete this rule
            const titleRemoveRule = 'Remove this rule';
            const actionRemoveRule = CodeAction.create(titleRemoveRule, CodeActionKind.QuickFix);

            if (line === 0) {
                // If there are no previous lines, just insert the comment before the problematic line.
                actionDisableRule.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [TextEdit.insert(
                                Position.create(line, 0),
                                `${aglintDisableNextLinePrefix}${LF}`,
                            )],
                        ),
                    ],
                };

                actions.push(actionDisableRule);

                actionRemoveRule.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [TextEdit.del(Range.create(
                                Position.create(line, 0),
                                Position.create(line + 1, 0),
                            ))],
                        ),
                    ],
                };

                actions.push(actionRemoveRule);

                continue;
            }

            if (line > 0) {
                // If we have previous lines
                const previousLine = line - 1;

                // Get the previous line
                const prevLine = textDocument.getText(
                    Range.create(
                        Position.create(previousLine, 0),
                        // Note: we do not know the length of the previous line, so we use the max value
                        Position.create(previousLine, uinteger.MAX_VALUE),
                    ),
                );

                // If the previous line is '! aglint-disable-next-line some-rule-name', we need to replace it
                // to '! aglint-disable-next-line' - because in this case we want to disable AGLint completely
                // for the problematic line, not just some rule.
                const commentNode = parseConfigCommentTolerant(prevLine.trim());

                if (
                    commentNode
                    && commentNode.command.value === AglintCommand.DisableNextLine
                    && commentNode.params
                ) {
                    delete commentNode.params;

                    actionDisableRule.edit = {
                        documentChanges: [
                            TextDocumentEdit.create(
                                { uri: textDocument.uri, version: textDocument.version },
                                [TextEdit.replace(
                                    Range.create(
                                        Position.create(previousLine, 0),
                                        Position.create(previousLine, prevLine.length),
                                    ),
                                    ConfigCommentRuleParser.generate(commentNode),
                                )],
                            ),
                        ],
                    };

                    actions.push(actionDisableRule);
                    continue;
                }

                // Otherwise just insert the comment before the problematic line
                actionDisableRule.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [TextEdit.insert(
                                Position.create(line, 0),
                                `${aglintDisableNextLinePrefix}${LF}`,
                            )],
                        ),
                    ],
                };

                actions.push(actionDisableRule);

                // Or remove rule
                actionRemoveRule.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [TextEdit.del(Range.create(
                                Position.create(line, 0),
                                Position.create(line + 1, 0),
                            ))],
                        ),
                    ],
                };

                actions.push(actionRemoveRule);
                continue;
            }
        }

        // If we are here, it means that we have a linter rule name,
        // so we need to suggest disabling this rule for the line
        const action = CodeAction.create(`Disable AGLint rule '${code}' for this line`, CodeActionKind.QuickFix);

        // If there are no previous lines, just insert the comment before the problematic line
        if (line === 0) {
            action.edit = {
                documentChanges: [
                    TextDocumentEdit.create(
                        { uri: textDocument.uri, version: textDocument.version },
                        [TextEdit.insert(
                            Position.create(line, 0),
                            `${aglintDisableNextLinePrefix}${SPACE}${code}${LF}`,
                        )],
                    ),
                ],
            };
            actions.push(action);
            continue;
        }

        if (line > 0) {
            // If we have previous lines
            const previousLine = line - 1;

            const prevLine = textDocument.getText(
                Range.create(
                    Position.create(previousLine, 0),
                    // Note: we do not know the length of the previous line, so we use the max value
                    Position.create(previousLine, uinteger.MAX_VALUE),
                ),
            );

            // If the previous line is '! aglint-disable-next-line some-rule-name', we need to replace it
            // to '! aglint-disable-next-line some-rule-name, currently-problematic-rule-name'.
            // In other words, we just need to add the new rule to the list of rules to disable.
            const commentNode = parseConfigCommentTolerant(prevLine.trim());

            if (
                commentNode
                && commentNode.command.value === AglintCommand.DisableNextLine
                && commentNode.params
                && commentNode.params.type === 'ParameterList'
            ) {
                commentNode.params.children.push({
                    type: 'Value',
                    value: String(code),
                });
                action.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [TextEdit.replace(
                                Range.create(
                                    Position.create(previousLine, 0),
                                    Position.create(previousLine, prevLine.length),
                                ),
                                ConfigCommentRuleParser.generate(commentNode),
                            )],
                        ),
                    ],
                };
                actions.push(action);
                continue;
            }

            // Otherwise just insert the comment before the problematic line
            action.edit = {
                documentChanges: [
                    TextDocumentEdit.create(
                        { uri: textDocument.uri, version: textDocument.version },
                        [TextEdit.insert(
                            Position.create(line, 0),
                            `${aglintDisableNextLinePrefix}${SPACE}${code}${LF}`,
                        )],
                    ),
                ],
            };
            actions.push(action);
            continue;
        }
    }
    return actions;
});

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
 * changed and must be reread".
 *
 * @see https://github.com/microsoft/vscode-languageserver-node/issues/380#issuecomment-414691493
 *
 * @param initial If true, it means that this is the first time we pull the settings.
 */
async function pullSettings(initial = false) {
    // Store old settings
    const oldSettings = cloneDeep(settings);

    if (hasConfigurationCapability) {
        const scopeUri = workspaceRoot ? pathToFileURL(workspaceRoot).toString() : undefined;
        const receivedSettings = await connection.workspace.getConfiguration({ scopeUri, section: 'adblock' });

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
        connection.console.error('Could not determine the workspace root of the VSCode instance');
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
