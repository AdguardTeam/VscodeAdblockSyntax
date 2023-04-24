import { join } from 'path';
import {
    ThemeColor, commands, StatusBarAlignment, workspace, ExtensionContext, window, StatusBarItem,
} from 'vscode';
import {
    LanguageClient, LanguageClientOptions, ServerOptions, TransportKind,
} from 'vscode-languageclient/node';

const SERVER_PATH = join('server', 'out', 'server.js');
const DOCUMENT_SCHEME = 'file';
const LANGUAGE_ID = 'adblock';
const CLIENT_ID = 'aglint';
const CLIENT_NAME = 'AGLint';

/**
 * Possible names of the config file
 */
const CONFIG_FILE_NAMES = [
    // aglint.config stuff
    'aglint.config.json',
    'aglint.config.yaml',
    'aglint.config.yml',

    // .aglintrc stuff
    '.aglintrc',
    '.aglintrc.json',
    '.aglintrc.yaml',
    '.aglintrc.yml',
];

/**
 * Name of the ignore file
 */
const IGNORE_FILE_NAME = '.aglintignore';

/**
 * Language client instance
 */
let client: LanguageClient;

let statusBarItem: StatusBarItem;

/**
 * Function called when the extension is activated
 *
 * @param context VSCode extension context
 */
export function activate(context: ExtensionContext) {
    // Check if the workspace is a virtual workspace. If yes, then we can't use the Node.js FS API,
    // so we need to abort the activation process.
    //
    // Detection of virtual workspaces is done by checking if all workspace folders have the file scheme.
    // More info:
    // https://code.visualstudio.com/api/extension-guides/virtual-workspaces#detect-virtual-workspaces-programmatically
    // TODO: Implement a workaround for virtual workspaces
    const isVirtualWorkspace = workspace.workspaceFolders
        && workspace.workspaceFolders.every((f) => f.uri.scheme !== 'file');

    if (isVirtualWorkspace) {
        // Show a warning message
        window.showWarningMessage(
            // eslint-disable-next-line max-len
            'AGLint doesn\'t support virtual workspaces, since it requires access to the filesystem via Node.js FS API. Only syntax highlighting will be available here.',
        );

        // Abort the activation
        return;
    }

    // Otherwise, continue the activation process

    // Server is implemented in Node, so we need to launch it as a separate process
    const serverModule = context.asAbsolutePath(join(SERVER_PATH));

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for adblock documents (this extension will also define the adblock language)
        documentSelector: [{ scheme: DOCUMENT_SCHEME, language: LANGUAGE_ID }],

        synchronize: {
            // Notify the server if the configuration has changed (such as .aglintrc, .aglintignore, etc.)
            // We define these files as glob patterns here
            fileEvents: [
                workspace.createFileSystemWatcher(`**/{${CONFIG_FILE_NAMES.join(',')}}`),
                workspace.createFileSystemWatcher(`**/{${IGNORE_FILE_NAME}}`),
            ],
        },

        progressOnInitialization: true,
    };

    // Create the language client and start the client.
    client = new LanguageClient(CLIENT_ID, CLIENT_NAME, serverOptions, clientOptions);

    // Add status bar
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);

    commands.registerCommand('aglint.showOutputChannel', () => {
        client.outputChannel.show();
    });

    statusBarItem.name = 'AGLint';
    statusBarItem.text = 'AGLint';
    statusBarItem.tooltip = 'Show AGLint output channel to see more information';

    // Add command to show AGLint debug console
    statusBarItem.command = { title: 'Open AGLint Output', command: 'aglint.showOutputChannel' };

    // Show the status bar item
    statusBarItem.show();

    // Handle notifications from the server
    client.onNotification('aglint/status', (params) => {
        if (params?.error) {
            // We have an error, so change the status bar background to red
            statusBarItem.backgroundColor = new ThemeColor('statusBarItem.warningBackground');
        } else {
            // Everything is fine, so change the status bar background to the default color
            // In this case, params is null
            statusBarItem.backgroundColor = undefined;
        }
    });

    client.outputChannel.appendLine('AGLint extension client activated');

    // Start the client. This will also launch the server.
    client.start();
}

/**
 * Function called when the extension is deactivated
 *
 * @returns `undefined` if the client is not initialized, otherwise a promise that resolves when the client is stopped
 */
export function deactivate(): Thenable<void> | undefined {
    // Handle the case where the client is not initialized
    if (!client) {
        return undefined;
    }

    return client.stop();
}
