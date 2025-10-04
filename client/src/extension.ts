import { join } from 'node:path';

import { FileScheme } from '@vscode-adblock-syntax/shared';
import * as v from 'valibot';
import {
    commands,
    type ExtensionContext,
    RelativePattern,
    StatusBarAlignment,
    type StatusBarItem,
    type TextDocument,
    ThemeColor,
    window as Window,
    workspace as Workspace,
    type WorkspaceFolder,
} from 'vscode';
import {
    LanguageClient,
    type LanguageClientOptions,
    type ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

import { fileInFolder, getOuterMostWorkspaceFolder } from './workspace-folders';

const SERVER_PATH = join('server', 'out', 'server.cjs');
const DOCUMENT_SCHEME = FileScheme.File;
const LANGUAGE_ID = 'adblock';
const CLIENT_ID = 'aglint';
const CLIENT_NAME = 'AGLint';

/**
 * Supported file extensions.
 */
const SUPPORTED_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
    'txt',
    'adblock',
    'ublock',
    'adguard',
]);

/**
 * Possible names of the config file.
 */
const CONFIG_FILE_NAMES: ReadonlySet<string> = new Set([
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
const IGNORE_FILE_NAME = '.aglintignore';

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
const STATUS_BAR_PRIORITY = 100;

/**
 * Language client instance for the default workspace folder or untitled documents.
 * This is used when no specific workspace folder is available.
 */
let defaultClient: LanguageClient | undefined;

/**
 * Map of language clients for each workspace folder.
 * This allows us to manage multiple clients for different folders in the workspace.
 */
const clients = new Map<string, LanguageClient>();

/**
 * Status bar item to show the AGLint status.
 * This is shared across all workspace folders and updates based on the active editor's folder.
 */
let statusBarItem: StatusBarItem;

/**
 * Schema for the server notification parameters.
 * Allow undefined / null payloads to act as "neutral" updates.
 */
// TODO (AG-45205): Improve notification schema
const notificationSchema = v.object({
    error: v.optional(v.unknown()),
    aglintEnabled: v.optional(v.boolean()),
});

type AglintStatus = v.InferInput<typeof notificationSchema>;

/**
 * Map of last-known status per OUTERMOST folder.
 * For example, if `project-1` is added to the workspace, but
 * `project-1/sub-project-1` is also added, then `project-1` is the OUTERMOST folder.
 *
 * Keys are the URI of the OUTERMOST folder.
 * Values are the last-known status for that folder.
 */
const folderStatus = new Map<string, AglintStatus>();

/**
 * Render the status bar from a stored status (or reset if none).
 *
 * @param status Status to render.
 */
function renderStatus(status: AglintStatus | undefined) {
    if (!status) {
        statusBarItem.backgroundColor = undefined;
        statusBarItem.text = 'AGLint';
        return;
    }

    if (status.error) {
        statusBarItem.backgroundColor = new ThemeColor('statusBarItem.warningBackground');
        statusBarItem.text = '$(warning) AGLint';
        return;
    }

    statusBarItem.backgroundColor = undefined;
    statusBarItem.text = status.aglintEnabled === false
        ? '$(debug-pause) AGLint'
        : 'AGLint';
}

/**
 * Parse incoming server params; tolerate undefined/null.
 *
 * @param params Params to parse.
 *
 * @returns Parsed status.
 */
function parseStatusParams(params: unknown): AglintStatus {
    const schema = v.union([notificationSchema, v.undefined(), v.null()]);
    const parsed = v.safeParse(schema, params);

    if (!parsed.success) {
        return {};
    }

    return (parsed.output ?? {});
}

/**
 * Update the status bar for a specific workspace folder.
 *
 * When user switches to a file in a different folder, this function is called to update the status bar
 * for the OUTERMOST folder of that workspace.
 *
 * @param folder Folder whose status we want to update.
 * @param params Parameters from the server notification, which may include error status or AGLint enabled state.
 */
function updateStatusBarForFolder(folder: WorkspaceFolder, params: unknown) {
    const status = parseStatusParams(params);

    // Store last-known status for the OUTERMOST folder of this client
    const outer = getOuterMostWorkspaceFolder(folder);
    const key = outer.uri.toString();
    folderStatus.set(key, status);

    // If active editor belongs to the same OUTERMOST folder, render immediately
    const activeUri = Window.activeTextEditor?.document?.uri;
    if (!activeUri) {
        return;
    }

    const activeFolder = Workspace.getWorkspaceFolder(activeUri);
    if (!activeFolder) {
        return;
    }

    const activeOuter = getOuterMostWorkspaceFolder(activeFolder);
    if (activeOuter.uri.toString() !== key) {
        // different folder: keep it stored for later
        return;
    }

    renderStatus(status);
}

/**
 * Creates a language client for a specific workspace folder.
 *
 * @param folder The workspace folder for which the client is created.
 * @param serverModule The path to the server module.
 *
 * @returns A new instance of LanguageClient for the specified folder.
 */
function createClientForFolder(folder: WorkspaceFolder, serverModule: string): LanguageClient {
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc },
    };

    const rootFs = folder.uri.fsPath;

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: DOCUMENT_SCHEME, language: LANGUAGE_ID }],

        workspaceFolder: folder,
        initializationOptions: {
            workspaceFolder: { uri: folder.uri.toString(), name: folder.name },
        },

        synchronize: {
            fileEvents: [
                Workspace.createFileSystemWatcher(
                    new RelativePattern(folder, `**/*.{${Array.from(SUPPORTED_FILE_EXTENSIONS).join(',')}}`),
                    false,
                    true,
                    false,
                ),
                // eslint-disable-next-line max-len
                Workspace.createFileSystemWatcher(new RelativePattern(folder, `**/{${Array.from(CONFIG_FILE_NAMES).join(',')}}`)),
                Workspace.createFileSystemWatcher(new RelativePattern(folder, `**/${IGNORE_FILE_NAME}`)),
            ],
        },

        middleware: {
            didOpen: (doc, next) => {
                if (fileInFolder(doc.uri.fsPath, rootFs)) {
                    return next(doc);
                }

                return Promise.resolve();
            },
            didChange: (change, next) => {
                if (fileInFolder(change.document.uri.fsPath, rootFs)) {
                    return next(change);
                }

                return Promise.resolve();
            },
            willSave: (e, next) => {
                if (fileInFolder(e.document.uri.fsPath, rootFs)) {
                    return next(e);
                }

                return Promise.resolve();
            },
            willSaveWaitUntil: async (e, next) => {
                if (fileInFolder(e.document.uri.fsPath, rootFs)) {
                    return next(e);
                }

                return Promise.resolve([]);
            },
            didSave: (doc, next) => {
                if (fileInFolder(doc.uri.fsPath, rootFs)) {
                    return next(doc);
                }

                return Promise.resolve();
            },
            didClose: (doc, next) => {
                if (fileInFolder(doc.uri.fsPath, rootFs)) {
                    return next(doc);
                }

                return Promise.resolve();
            },
        },

        progressOnInitialization: true,
    };

    const id = `${CLIENT_ID}:${folder.uri.toString()}`;
    const name = `${CLIENT_NAME} (${folder.name})`;
    const client = new LanguageClient(id, name, serverOptions, clientOptions);

    client.onNotification('aglint/status', (params: unknown) => {
        updateStatusBarForFolder(folder, params);
    });

    return client;
}

/**
 * Default client creation for untitled documents or when no workspace folder is available.
 *
 * @param serverModule The path to the server module.
 */
function ensureDefaultClient(serverModule: string) {
    if (defaultClient) {
        return;
    }

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc },
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: FileScheme.Untitled, language: LANGUAGE_ID }],
        progressOnInitialization: true,
    };

    // Give the untitled client a unique ID too
    defaultClient = new LanguageClient(
        `${CLIENT_ID}:untitled`,
        `${CLIENT_NAME} (untitled)`,
        serverOptions,
        clientOptions,
    );
    defaultClient.start();
}

/**
 * When a text document is opened, we make sure to create or use an existing client for the folder.
 *
 * @param document The opened text document.
 * @param serverModule The path to the server module.
 */
function didOpenTextDocument(document: TextDocument, serverModule: string): void {
    // Only handle documents with the specific language ID and schemes
    if (
        document.languageId !== LANGUAGE_ID
        || (document.uri.scheme !== FileScheme.File && document.uri.scheme !== FileScheme.Untitled)
    ) {
        return;
    }

    const { uri } = document;

    if (uri.scheme === FileScheme.Untitled) {
        ensureDefaultClient(serverModule);
        return;
    }

    const workspaceFolder = Workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        return;
    }

    const mostOuterWorkspaceFolder = getOuterMostWorkspaceFolder(workspaceFolder);
    const key = mostOuterWorkspaceFolder.uri.toString();

    if (!clients.has(key)) {
        const client = createClientForFolder(mostOuterWorkspaceFolder, serverModule);
        client.start();
        clients.set(key, client);
    }
}

/**
 * Attaches listeners to workspace folder changes to manage clients.
 *
 * @param context Extension context.
 */
function attachWorkspaceFolderListeners(context: ExtensionContext) {
    // Remove clients AND their stored status when folders are removed
    context.subscriptions.push(
        Workspace.onDidChangeWorkspaceFolders((event) => {
            for (const folder of event.removed) {
                const outer = getOuterMostWorkspaceFolder(folder);
                const outerKey = outer.uri.toString();
                folderStatus.delete(outerKey);

                const key = folder.uri.toString();
                const client = clients.get(key);
                if (client) {
                    clients.delete(key);
                    client.stop();
                }
            }
        }),

        // On editor change, render the last-known status of that folder (don’t reset blindly)
        Window.onDidChangeActiveTextEditor((editor) => {
            if (!editor) {
                renderStatus(undefined);
                return;
            }

            const folder = Workspace.getWorkspaceFolder(editor.document.uri);
            if (!folder) {
                renderStatus(undefined);
                return;
            }

            const outer = getOuterMostWorkspaceFolder(folder);
            const key = outer.uri.toString();

            renderStatus(folderStatus.get(key));
        }),
    );
}

/**
 * Activates the extension.
 *
 * @param context The extension context.
 */
export function activate(context: ExtensionContext) {
    const isVirtualWorkspace = Workspace.workspaceFolders
        && Workspace.workspaceFolders.every((f) => f.uri.scheme !== FileScheme.File);

    if (isVirtualWorkspace) {
        Window.showWarningMessage(
            // eslint-disable-next-line max-len
            'AGLint does not support virtual workspaces, since it requires access to the filesystem via Node.js FS API. Only syntax highlighting will be available here.',
        );
        return;
    }

    const serverModule = context.asAbsolutePath(join(SERVER_PATH));

    // Status bar
    statusBarItem = Window.createStatusBarItem(StatusBarAlignment.Right, STATUS_BAR_PRIORITY);
    statusBarItem.name = 'AGLint';
    statusBarItem.text = 'AGLint';
    statusBarItem.tooltip = 'Show AGLint output channel to see more information';

    // Add command to show AGLint debug console
    statusBarItem.command = { title: 'Open AGLint Output', command: 'aglint.showOutputChannel' };
    statusBarItem.show();

    context.subscriptions.push(
        statusBarItem,
        commands.registerCommand('aglint.showOutputChannel', () => {
            const activeUri = Window.activeTextEditor?.document?.uri;
            if (activeUri) {
                const folder = Workspace.getWorkspaceFolder(activeUri);
                if (folder) {
                    const outer = getOuterMostWorkspaceFolder(folder);
                    const key = outer.uri.toString();
                    const clientForFolder = clients.get(key)
                        // fall back to client created with the exact (non-outer) key
                        ?? clients.get(folder.uri.toString());
                    clientForFolder?.outputChannel.show();
                    return;
                }
            }
            const firstClient = defaultClient ?? [...clients.values()][0];
            firstClient?.outputChannel.show();
        }),
    );

    // Handle already opened documents
    Workspace.textDocuments.forEach((doc) => didOpenTextDocument(doc, serverModule));

    // Handle newly opened documents
    context.subscriptions.push(
        Workspace.onDidOpenTextDocument((doc) => didOpenTextDocument(doc, serverModule)),
    );

    // Handle workspace changes and editor changes
    attachWorkspaceFolderListeners(context);

    // Info (with the first available client)
    const anyClient = defaultClient ?? [...clients.values()][0];
    anyClient?.info?.(`AGLint client activated. Extension version: ${context.extension.packageJSON.version}`);
}

/**
 * Function called when the extension is deactivated.
 *
 * @returns An array of promises that resolves when all clients are stopped.
 */
export function deactivate(): Thenable<void> | undefined {
    const promises: Thenable<void>[] = [];

    if (defaultClient) {
        promises.push(defaultClient.stop());
    }

    for (const client of clients.values()) {
        promises.push(client.stop());
    }

    return Promise.all(promises).then(() => undefined);
}
