/**
 * @file AGLint Language Server for VSCode (Node.js).
 */

import { createConnection, ProposedFeatures, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { ServerContext } from './context/server-context';
import { registerEventHandlers, setupWorkspaceFolderHandler } from './handlers/event-handlers';
import { handleInitialize } from './handlers/initialization';

/**
 * Create a connection for the server, using Node's IPC as a transport.
 * Also include all preview / proposed LSP features.
 */
const connection = createConnection(ProposedFeatures.all);

connection.console.info(`[lsp] AGLint Language Server starting (Node.js ${process.version})`);

/**
 * Create a simple text document manager.
 */
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Server context holding all shared state.
 */
const serverContext = new ServerContext(connection, documents);

/**
 * Handle server initialization.
 */
connection.onInitialize((params) => {
    const result = handleInitialize(params, serverContext);

    // Setup workspace folder change handler
    setupWorkspaceFolderHandler(connection, serverContext);

    return result;
});

/**
 * Register all event handlers.
 */
registerEventHandlers(connection, documents, serverContext);

/**
 * Make the text document manager listen on the connection
 * for open, change and close text document events.
 */
documents.listen(connection);

/**
 * Listen on the connection.
 */
connection.listen();
