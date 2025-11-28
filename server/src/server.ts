/**
 * @file AGLint Language Server for VSCode (Node.js).
 *
 * @todo Split this server into multiple files by creating a server context.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';

import type { LinterConfigFile } from '@adguard/aglint/cli';
import type {
    LinterConfig,
    LinterFixCommand,
    LinterOffsetRange,
    LinterPositionRange,
    LinterResult,
    LinterRunOptions,
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
    LRUCache,
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

import { EMPTY, LF, SPACE } from './common/constants';
import { AglintContext } from './context/aglint-context';
import { defaultSettings, type ExtensionSettings } from './settings';
import { getErrorMessage, getErrorStack } from './utils/error';
import { isFileUri } from './utils/uri';

/**
 * Debounce delay for linting files.
 * It is used to avoid too frequent linting when the user modifies the file.
 */
const LINT_FILE_DEBOUNCE_DELAY = 100;

/**
 * Create a connection for the server, using Node's IPC as a transport.
 * Also include all preview / proposed LSP features.
 */
const connection = createConnection(ProposedFeatures.all);

/**
 * Create a simple text document manager.
 */
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Whether the client supports the `workspace/configuration` request.
 */
let hasConfigurationCapability = false;

/**
 * Whether the client supports the `workspace/workspaceFolders` request.
 */
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
 * AGLint context instance, if initialized.
 */
let aglintContext: AglintContext | undefined;

/**
 * Cache for linting results, keyed by cache key.
 * Uses LRU eviction strategy with size limit (no TTL).
 */
const lintCache = new LRUCache<string, Diagnostic[]>(100);

/**
 * Create a cache key for linting results.
 *
 * @param uri Document URI.
 * @param aglintVersion AGLint version.
 * @param documentVersion Document version (incremented on each change).
 * @param configHash Hash of the linter config.
 *
 * @returns Cache key.
 */
function createLintCacheKey(
    uri: string,
    aglintVersion: string,
    documentVersion: number,
    configHash: string,
): string {
    return `${uri}:${aglintVersion}:${documentVersion}:${configHash}`;
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
    if (!isFileUri(textDocument.uri) || !workspaceRoot || !aglintContext) {
        return undefined;
    }

    const config = await aglintContext.linterTree.getResolvedConfig(fileURLToPath(textDocument.uri));

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
 * Get the rule documentation URL from the linter result.
 *
 * @param ruleId Rule ID.
 * @param linterResult Linter result.
 *
 * @returns Rule documentation URL or undefined if the rule documentation URL is not found.
 */
const getRuleDocumentationUrlFromLinterResult = (ruleId: string, linterResult: LinterResult): string | undefined => {
    if (!linterResult.metadata) {
        return undefined;
    }

    return linterResult.metadata[ruleId]?.docs?.url;
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

    if (!aglintContext) {
        return diagnostics;
    }

    for (const problem of linterResult.problems) {
        const severity = problem.severity === aglintContext.aglint.linter.LinterRuleSeverity.Warning
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
            const href = getRuleDocumentationUrlFromLinterResult(problem.ruleId, linterResult);
            if (href) {
                diagnostic.codeDescription = {
                    href,
                };
            }
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
 * Lint the document and send the diagnostics to VSCode.
 *
 * @param textDocument Document to lint.
 */
async function lintFile(textDocument: TextDocument): Promise<void> {
    if (
        !isFileUri(textDocument.uri)
        || !workspaceRoot
        || !settings.enableAglint
        || !aglintContext
        || await aglintContext.linterTree.isIgnored(fileURLToPath(textDocument.uri))
    ) {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }

    const documentPath = fileURLToPath(textDocument.uri);
    const startTime = Date.now();

    try {
        const config = await getLinterConfig(textDocument);

        if (!config) {
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
            return;
        }

        const text = textDocument.getText();

        // Normalize config for linting (this is what will actually be used)
        const normalizedConfig: LinterConfig = {
            platforms: config.platforms,
            rules: config.rules ?? {},
            allowInlineConfig: true,
        };

        // Create cache key using document version and config hash
        const configHash = aglintContext.aglint.cli.getLinterConfigHash(normalizedConfig);
        const cacheKey = createLintCacheKey(
            textDocument.uri,
            aglintContext.aglint.version,
            textDocument.version,
            configHash,
        );

        // Check cache first if caching is enabled
        if (settings.enableInMemoryAglintCache) {
            const cachedDiagnostics = lintCache.get(cacheKey);
            if (cachedDiagnostics) {
                const duration = Date.now() - startTime;
                connection.console.info(
                    `Linting completed for: ${documentPath} (from cache, ${duration}ms)`,
                );
                connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: cachedDiagnostics });
                return;
            }
        }

        connection.console.info(`Linting started for: ${documentPath}`);

        const linterRunOptions: LinterRunOptions = {
            fileProps: {
                filePath: documentPath,
                content: text,
                cwd: workspaceRoot,
            },
            config: normalizedConfig,
            subParsers: aglintContext.aglint.linter.defaultSubParsers,
            loadRule: aglintContext.aglint.loadRule,
            // Need to include metadata to get the rule documentation
            includeMetadata: true,
            debug: aglintContext.debuggerInstance.module('linter-core'),
        };

        // connection.console.log(`Linting document: ${documentPath} with config: ${JSON.stringify(config, null, 2)}`);

        const linterResult = await aglintContext.aglint.linter.lint(linterRunOptions);
        const diagnostics = getVscodeDiagnosticsFromLinterResult(linterResult);

        // Store result in cache if caching is enabled
        if (settings.enableInMemoryAglintCache) {
            lintCache.set(cacheKey, diagnostics);
        }

        const duration = Date.now() - startTime;
        connection.console.info(`Linting completed for: ${documentPath} (${duration}ms)`);

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
 * Lint the document and send the diagnostics to VSCode.
 * Debounced version of {@link lintFile}.
 *
 * @param textDocument Document to lint.
 */
const lintFileDebounced = debounce(lintFile, LINT_FILE_DEBOUNCE_DELAY);

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
        aglintContext?.aglint.linter.LinterConfigCommentType.DisableNextLine,
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
                    // eslint-disable-next-line max-len
                    && commentNode.command.value === aglintContext?.aglint.linter.LinterConfigCommentType.DisableNextLine
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
            const { fix } = diagnostic.data;

            if (aglintContext?.aglint.linter.isLinterFixCommand(fix)) {
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
        }

        if (diagnostic.data?.suggestions) {
            const { suggestions } = diagnostic.data;

            if (aglintContext?.aglint.linter.isLinterSuggestions(suggestions)) {
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
                                        suggestion.fix,
                                    ),
                                ],
                            ),
                        ],
                    };
                    actions.push(actionFix);
                }
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
                // eslint-disable-next-line max-len
                && commentNode.command.value === aglintContext?.aglint.linter.LinterConfigCommentType.DisableNextLine
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
    // Note: No need to clear cache here - cache keys include AGLint version,
    // so version changes are handled automatically
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
 */
async function pullSettings() {
    const previousEnableAglint = settings.enableAglint;
    const previousEnableDebug = settings.enableAglintDebug;
    const previousEnableCache = settings.enableInMemoryAglintCache;

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

    // If nothing changed and AGLint is already initialized, skip heavy work
    if (
        aglintContext
        && previousEnableAglint === settings.enableAglint
        && previousEnableDebug === settings.enableAglintDebug
        && previousEnableCache === settings.enableInMemoryAglintCache
    ) {
        return;
    }

    // Clear cache if caching was disabled
    if (previousEnableCache && !settings.enableInMemoryAglintCache) {
        lintCache.clear();
        connection.console.info('AGLint cache cleared (caching disabled)');
    }

    // Send status notification about AGLint being enabled/disabled
    connection.sendNotification('aglint/status', { aglintEnabled: settings.enableAglint });

    // If AGLint is disabled, clean up and return early
    if (!settings.enableAglint) {
        removeAllDiagnostics();
        connection.console.info('AGLint is disabled');
        return;
    }

    connection.console.info('AGLint is enabled');

    // Initialize AGLint context if not already initialized
    if (!aglintContext) {
        if (!workspaceRoot) {
            connection.console.error('Workspace root is not defined');
            removeAllDiagnostics();
            return;
        }

        aglintContext = await AglintContext.create(connection, documents, workspaceRoot, settings.enableAglintDebug);

        if (!aglintContext) {
            removeAllDiagnostics();
            return;
        }
    } else if (previousEnableDebug !== settings.enableAglintDebug) {
        // Handle debug setting change
        connection.console.info(`AGLint debug mode changed: ${settings.enableAglintDebug}`);

        if (settings.enableAglintDebug) {
            aglintContext.debuggerInstance.enable();
        } else {
            aglintContext.debuggerInstance.disable();
        }
    }

    await refreshLinter();
}

connection.onDidChangeConfiguration(async () => {
    await pullSettings();
});

// Called when any of monitored file paths change
connection.onDidChangeWatchedFiles(async (events) => {
    const { changes } = events;

    for (const change of changes) {
        const filePath = fileURLToPath(change.uri);
        connection.console.info(`Configuration file changed: ${filePath}`);

        // eslint-disable-next-line no-await-in-loop
        await aglintContext?.linterTree.changed(filePath);
    }

    // Reset current file diagnostics
    removeAllDiagnostics();

    // Note: No need to clear cache here - cache keys include config hash,
    // so config changes are handled automatically
    await refreshLinter();
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    lintFileDebounced(change.document);
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
        // Pull the settings from VSCode
        await pullSettings();

        connection.console.info(`AGLint Language Server initialized in workspace: ${workspaceRoot}`);
    }
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.info(`AGLint Node.js Language Server running in node ${process.version}`);
