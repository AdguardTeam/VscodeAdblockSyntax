import { join } from "path";
import { workspace, ExtensionContext, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";

const SERVER_PATH = join("server", "out", "server.js");
const DOCUMENT_SCHEME = "file";
const LANGUAGE_ID = "adblock";
const CLIENT_ID = "aglint";
const CLIENT_NAME = "AGLint";

/**
 * Possible names of the config file
 */
const CONFIG_FILE_NAMES = [
    // aglint.config stuff
    "aglint.config.json",
    "aglint.config.yaml",
    "aglint.config.yml",

    // .aglintrc stuff
    ".aglintrc",
    ".aglintrc.json",
    ".aglintrc.yaml",
    ".aglintrc.yml",
];

/**
 * Name of the ignore file
 */
const IGNORE_FILE_NAME = ".aglintignore";

/**
 * Language client instance
 */
let client: LanguageClient;

/**
 * Function called when the extension is activated
 *
 * @param context VSCode extension context
 */
export function activate(context: ExtensionContext) {
    // The server is implemented in Node, so we need to launch it as a separate process
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
                workspace.createFileSystemWatcher(`**/{${CONFIG_FILE_NAMES.join(",")}}`),
                workspace.createFileSystemWatcher(`**/{${IGNORE_FILE_NAME}}`),
            ],
        },

        progressOnInitialization: true,
    };

    // Create the language client and start the client.
    client = new LanguageClient(CLIENT_ID, CLIENT_NAME, serverOptions, clientOptions);

    // Handle notifications from the server
    client.onNotification("aglint/caching-paths-failed", ({ error }) => {
        window.showErrorMessage(
            // eslint-disable-next-line max-len
            "Failed to scan the workspace. This usually indicates a misconfigured AGLint setup. Error: " +
                JSON.stringify(error)
        );
    });

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
