import { join } from 'path';
import {
    ThemeColor,
    commands,
    StatusBarAlignment,
    workspace as Workspace,
    window as Window,
    type ExtensionContext,
    type StatusBarItem,
    type TextDocument,
    type WorkspaceFolder,
} from 'vscode';
import {
    LanguageClient,
    type LanguageClientOptions,
    type ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import * as v from 'valibot';

import { getOuterMostWorkspaceFolder } from './workspace-folders';

/**
 * Schemes for file documents.
 */
const enum FileScheme {
    File = 'file',
    Untitled = 'untitled',
}

const SERVER_PATH = join('server', 'out', 'server.js');
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
 * Possible names of the config file
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
 */
// TODO (AG-45205): Improve notification schema
const notificationSchema = v.object({
    error: v.optional(v.unknown()),
    aglintEnabled: v.optional(v.boolean()),
});

/**
 * We show the status bar based on the active editor's folder client status.
 *
 * @param folder Folder whose status we want to update.
 * @param params Parameters from the server notification, which may include error status or AGLint enabled state.
 */
function updateStatusBarForFolder(folder: WorkspaceFolder, params: unknown) {
    const active = Window.activeTextEditor?.document?.uri;
    if (!active) {
        return;
    }

    const activeFolder = Workspace.getWorkspaceFolder(active);
    if (!activeFolder) {
        return;
    }

    // Only update the status bar if the active editor's folder matches the one we are updating
    // This prevents unnecessary updates when switching between folders in the workspace
    if (activeFolder.uri.toString() !== folder.uri.toString()) {
        return;
    }

    const parseResult = v.safeParse(notificationSchema, params);
    if (!parseResult.success) {
        return;
    }

    const parsedData = parseResult.output;

    if (parsedData.error) {
        statusBarItem.backgroundColor = new ThemeColor('statusBarItem.warningBackground');
        statusBarItem.text = '$(warning) AGLint';
    } else {
        statusBarItem.backgroundColor = undefined;
        if (parsedData.aglintEnabled === false) {
            statusBarItem.text = '$(debug-pause) AGLint';
        } else {
            statusBarItem.text = 'AGLint';
        }
    }
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

    const clientOptions: LanguageClientOptions = {
        // Its important to limit the document selector to the specific folder
        // to avoid conflicts with other clients in the workspace.
        documentSelector: [
            {
                scheme: DOCUMENT_SCHEME,
                language: LANGUAGE_ID,
                pattern: `${folder.uri.fsPath}/**/*`,
            },
        ],
        workspaceFolder: folder,
        synchronize: {
            fileEvents: [
                // eslint-disable-next-line max-len
                Workspace.createFileSystemWatcher(`**/*.{${Array.from(SUPPORTED_FILE_EXTENSIONS).join(',')}}`, false, true, false),
                Workspace.createFileSystemWatcher(`**/{${Array.from(CONFIG_FILE_NAMES).join(',')}}`),
                Workspace.createFileSystemWatcher(`**/{${IGNORE_FILE_NAME}}`),
            ],
        },
        progressOnInitialization: true,
    };

    const client = new LanguageClient(CLIENT_ID, CLIENT_NAME, serverOptions, clientOptions);

    // Update the status bar item per folder based on server notifications
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

    defaultClient = new LanguageClient(CLIENT_ID, CLIENT_NAME, serverOptions, clientOptions);
    defaultClient.start();
}

/**
 * When a text document is opened, we make sure to create or use an existing client for the folder
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
 */
function attachWorkspaceFolderListeners() {
    Workspace.onDidChangeWorkspaceFolders((event) => {
        for (const folder of event.removed) {
            const key = folder.uri.toString();
            const client = clients.get(key);

            if (client) {
                clients.delete(key);
                client.stop();
            }
        }
    });

    // If the active editor changes, we update the status bar based on the active folder client status
    Window.onDidChangeActiveTextEditor(() => {
        statusBarItem.text = 'AGLint';
        statusBarItem.backgroundColor = undefined;
    });
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
    statusBarItem = Window.createStatusBarItem(StatusBarAlignment.Right, 100);
    statusBarItem.name = 'AGLint';
    statusBarItem.text = 'AGLint';
    statusBarItem.tooltip = 'Show AGLint output channel to see more information';

    // Add command to show AGLint debug console
    statusBarItem.command = { title: 'Open AGLint Output', command: 'aglint.showOutputChannel' };
    statusBarItem.show();

    // This command allows users to open the AGLint output channel from the status bar
    // to the first available client.
    commands.registerCommand('aglint.showOutputChannel', () => {
        const firstClient = defaultClient ?? [...clients.values()][0];
        firstClient?.outputChannel.show();
    });

    // Handle already opened documents
    Workspace.textDocuments.forEach((doc) => didOpenTextDocument(doc, serverModule));

    // Handle newly opened documents
    Workspace.onDidOpenTextDocument((doc) => didOpenTextDocument(doc, serverModule));

    // Handle workspace changes
    attachWorkspaceFolderListeners();

    // Info (with the first available client)
    const anyClient = defaultClient ?? [...clients.values()][0];
    anyClient?.info?.(`AGLint client activated. Extension version: ${context.extension.packageJSON.version}`);
}

/**
 * Function called when the extension is deactivated
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
