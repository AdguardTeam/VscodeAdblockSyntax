/* eslint-disable no-bitwise */
/**
 * @file AGLint Language Server for VSCode (Node.js).
 *
 * @todo Split this server into multiple files by creating a server context.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';

import type {
    FileSystemAdapter,
    LinterConfigFile,
    LinterTree,
    PathAdapter,
} from '@adguard/aglint/cli';
import type {
    LinterFixCommand,
    LinterOffsetRange,
    LinterPositionRange,
    LinterResult,
    LinterRunOptions,
    LinterSuggestion,
} from '@adguard/aglint/linter';
import { CommentMarker, type ConfigCommentRule, ConfigCommentRuleParser } from '@adguard/agtree';
import debounce from 'debounce';
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

import { LSPFileSystemAdapter } from './adapters/fs';
import { EMPTY, LF, SPACE } from './common/constants';
import { defaultSettings, type ExtensionSettings } from './settings';
import { loadAglintModule, type LoadedAglint } from './utils/aglint-loader';
import { getErrorMessage, getErrorStack } from './utils/error';
import { isFileUri } from './utils/uri';

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

/**
 * Actual settings for the extension (always synced).
 */
let settings: ExtensionSettings = defaultSettings;

/**
 * Loaded AGLint module, if any.
 */
let aglint: LoadedAglint | undefined;

/**
 * File system adapter, if any.
 */
let fsAdapter: FileSystemAdapter | undefined;

/**
 * Path adapter, if any.
 */
let pathAdapter: PathAdapter | undefined;

/**
 * Linter tree, if any.
 */
let linterTree: LinterTree | undefined;

/**
 * AGLint commands supported by the language server.
 */
enum AglintCommand {
    DisableNextLine = 'aglint-disable-next-line',
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
 * Get the linter config for the given document.
 *
 * @param textDocument Document to get the linter config for.
 *
 * @returns Linter config for the document or undefined if the document is not lintable.
 */
async function getLinterConfig(textDocument: TextDocument): Promise<LinterConfigFile | undefined> {
    // e.g. new unsaved documents
    if (!isFileUri(textDocument.uri) || !workspaceRoot) {
        return undefined;
    }

    const config = await linterTree?.getResolvedConfig(fileURLToPath(textDocument.uri));

    return config;
}

/**
 * Convert AGLint position range to VSCode range.
 *
 * @param range AGLint position range.
 *
 * @returns VSCode range.
 */
const getVscodeCodeRangeFromAglintPositionRange = (range: LinterPositionRange): Range => {
    // Note: linting problems using 1-based line numbers, but VSCode uses 0-based line numbers
    return Range.create(
        Position.create(range.start.line - 1, range.start.column),
        Position.create(range.end.line - 1, range.end.column),
    );
};

/**
 * Convert AGLint result to VSCode diagnostics.
 *
 * @param linterResult Linter result.
 *
 * @returns VSCode diagnostics.
 */
const getVscodeDiagnosticsFromLinterResult = (linterResult: LinterResult): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];

    if (!aglint) {
        return diagnostics;
    }

    for (const problem of linterResult.problems) {
        const severity = problem.severity === aglint.linter.LinterRuleSeverity.Warning
            ? DiagnosticSeverity.Warning
            : DiagnosticSeverity.Error;

        const diagnostic: Diagnostic = {
            severity,
            range: getVscodeCodeRangeFromAglintPositionRange(problem.position),
            message: problem.message,
            source: 'aglint',
        };

        // Add permalink to the rule documentation
        if (problem.ruleId) {
            diagnostic.code = problem.ruleId;
            diagnostic.codeDescription = {
                href: aglint.linter.getAglintRuleDocumentationUrl(problem.ruleId),
            };
        }

        if (problem.fix || problem.suggestions) {
            diagnostic.data = {};

            if (problem.fix) {
                diagnostic.data.fix = problem.fix;
            }

            if (problem.suggestions) {
                diagnostic.data.suggestions = problem.suggestions;
            }
        }

        diagnostics.push(diagnostic);
    }

    return diagnostics;
};

/**
 * Lint the document and send the diagnostics to VSCode. It handles the
 * ignore & config files, since it uses the cached scan result, which
 * is based on the AGLint CLI logic.
 *
 * @param textDocument Document to lint.
 */
async function lintFile(textDocument: TextDocument): Promise<void> {
    if (
        !isFileUri(textDocument.uri)
        || !workspaceRoot
        || !settings.enableAglint
        || !aglint
        || await linterTree?.isIgnored(fileURLToPath(textDocument.uri))
    ) {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }

    try {
        const config = await getLinterConfig(textDocument);

        if (!config) {
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
            return;
        }

        const documentPath = fileURLToPath(textDocument.uri);
        const text = textDocument.getText();

        const linterRunOptions: LinterRunOptions = {
            fileProps: {
                filePath: documentPath,
                content: text,
                cwd: workspaceRoot,
            },
            config: {
                syntax: config.syntax,
                rules: config.rules ?? {},
                allowInlineConfig: true,
            },
            subParsers: aglint.linter.defaultSubParsers,
            loadRule: aglint.loadRule,
        };

        // connection.console.log(`Linting document: ${documentPath} with config: ${JSON.stringify(config, null, 2)}`);

        const linterResult = await aglint.linter.lint(linterRunOptions);
        const diagnostics = getVscodeDiagnosticsFromLinterResult(linterResult);

        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    } catch (error: unknown) {
        let message = `AGLint failed to lint the document: ${textDocument.uri}, got error: ${getErrorMessage(error)}`;
        const stack = getErrorStack(error);
        if (stack) {
            message += `, ${stack}`;
        }
        connection.console.error(message);

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

/**
 * Convert AGLint offset range to VSCode range.
 *
 * @param textDocument Text document.
 * @param range AGLint offset range.
 *
 * @returns VSCode range.
 */
const convertAglintRangeToVsCodeRange = (textDocument: TextDocument, range: LinterOffsetRange): Range => {
    const [startOffset, endOffset] = range;
    const start = textDocument.positionAt(startOffset);
    const end = textDocument.positionAt(endOffset);
    return Range.create(start, end);
};

/**
 * Convert AGLint fix to VSCode code edit.
 *
 * @param textDocument Text document.
 * @param fix AGLint fix.
 *
 * @returns VSCode code edit.
 */
const convertAglintFixToVsCodeCodeEdit = (textDocument: TextDocument, fix: LinterFixCommand): TextEdit => {
    return TextEdit.replace(
        convertAglintRangeToVsCodeRange(textDocument, fix.range),
        fix.text,
    );
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

        if (diagnostic.data?.fix) {
            // eslint-disable-next-line prefer-destructuring
            const fix = diagnostic.data.fix as LinterFixCommand;
            const actionFix = CodeAction.create(`Fix AGLint rule '${code}'`, CodeActionKind.QuickFix);

            actionFix.edit = {
                documentChanges: [
                    TextDocumentEdit.create(
                        { uri: textDocument.uri, version: textDocument.version },
                        [
                            convertAglintFixToVsCodeCodeEdit(
                                textDocument,
                                fix,
                            ),
                        ],
                    ),
                ],
            };
            actions.push(actionFix);
        }

        if (diagnostic.data?.suggestions) {
            // eslint-disable-next-line prefer-destructuring
            const suggestions: LinterSuggestion[] = diagnostic.data.suggestions;

            for (const suggestion of suggestions) {
                const actionFix = CodeAction.create(
                    `Apply suggestion '${suggestion.message}' from AGLint rule '${code}'`,
                    CodeActionKind.QuickFix,
                );

                actionFix.edit = {
                    documentChanges: [
                        TextDocumentEdit.create(
                            { uri: textDocument.uri, version: textDocument.version },
                            [
                                convertAglintFixToVsCodeCodeEdit(
                                    textDocument,
                                    suggestion.fix as LinterFixCommand,
                                ),
                            ],
                        ),
                    ],
                };
                actions.push(actionFix);
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
    if (initial) {
        // Workspace root should be defined at this point
        if (!workspaceRoot) {
            connection.console.error('Workspace root is not defined');
            removeAllDiagnostics();
            return;
        }

        aglint = await loadAglintModule(
            connection,
            workspaceRoot,
        );

        connection.console.info('AGLint module loaded');

        if (!aglint) {
            connection.console.error('AGLint module could not be loaded');
            removeAllDiagnostics();
            return;
        }

        if (workspaceRoot) {
            pathAdapter = new aglint.cli.NodePathAdapter();
            fsAdapter = new LSPFileSystemAdapter(documents);

            const configResolver = new aglint.cli.ConfigResolver(fsAdapter, pathAdapter, {
                presetsRoot: aglint.presetsRoot,
                baseConfig: {},
            });

            linterTree = new aglint.cli.LinterTree(fsAdapter, pathAdapter, {
                configFileNames: aglint.cli.CONFIG_FILE_NAMES,
                ignoreFileName: aglint.cli.IGNORE_FILE_NAME,
                root: workspaceRoot,
            }, {
                resolve: (p) => configResolver.resolve(p),
                isRoot: (p) => configResolver.isRoot(p),
            });
        }
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
    debounce(lintFile, 100)(change.document);
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
