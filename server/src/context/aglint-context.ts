import type {
    Debug,
    FileSystemAdapter,
    LinterTree,
    PathAdapter,
} from '@adguard/aglint/cli';
import type { Connection, TextDocuments } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { LSPFileSystemAdapter } from '../adapters/fs';
import type { LoadedAglint } from '../utils/aglint-loader';
import { loadAglintModule } from '../utils/aglint-loader';

/**
 * Encapsulates all AGLint-related state and dependencies.
 */
export class AglintContext {
    /**
     * Loaded AGLint module.
     */
    public aglint: LoadedAglint;

    /**
     * Debug instance.
     */
    public debuggerInstance: Debug;

    /**
     * File system adapter.
     */
    public fsAdapter: FileSystemAdapter;

    /**
     * Path adapter.
     */
    public pathAdapter: PathAdapter;

    /**
     * Linter tree.
     */
    public linterTree: LinterTree;

    /**
     * Creates a new AGLint context.
     *
     * @param aglint Loaded AGLint module.
     * @param debuggerInstance Debug instance.
     * @param fsAdapter File system adapter.
     * @param pathAdapter Path adapter.
     * @param linterTree Linter tree.
     */
    constructor(
        aglint: LoadedAglint,
        debuggerInstance: Debug,
        fsAdapter: FileSystemAdapter,
        pathAdapter: PathAdapter,
        linterTree: LinterTree,
    ) {
        this.aglint = aglint;
        this.debuggerInstance = debuggerInstance;
        this.fsAdapter = fsAdapter;
        this.pathAdapter = pathAdapter;
        this.linterTree = linterTree;
    }

    /**
     * Create and initialize a new AGLint context.
     *
     * @param connection Language server connection.
     * @param documents Text document manager.
     * @param root Workspace root path.
     * @param enableDebug Whether to enable debug logging.
     *
     * @returns Initialized AGLint context or undefined if initialization failed.
     */
    public static async create(
        connection: Connection,
        documents: TextDocuments<TextDocument>,
        root: string,
        enableDebug: boolean,
    ): Promise<AglintContext | undefined> {
        const aglint = await loadAglintModule(connection, root);

        if (!aglint) {
            connection.console.error('AGLint module could not be loaded');
            return undefined;
        }

        connection.console.info(`AGLint module loaded from ${aglint.modulePath} (version: ${aglint.version})`);

        const pathAdapter = new aglint.cli.NodePathAdapter();
        const fsAdapter = new LSPFileSystemAdapter(documents);

        const debuggerInstance = new aglint.cli.Debug({
            enabled: enableDebug,
            printTimestamps: false,
            printElapsed: false,
            colors: false,
            logger: (message) => connection.console.debug(`[AGLint debugger] ${message}`),
        });

        const configResolver = new aglint.cli.ConfigResolver(
            fsAdapter,
            pathAdapter,
            {
                presetsRoot: aglint.presetsRoot,
                baseConfig: {},
            },
            debuggerInstance.module('config-resolver'),
        );

        const linterTree = new aglint.cli.LinterTree(
            fsAdapter,
            pathAdapter,
            {
                configFileNames: aglint.cli.CONFIG_FILE_NAMES,
                ignoreFileName: aglint.cli.IGNORE_FILE_NAME,
                root,
            },
            {
                resolve: (p) => configResolver.resolve(p),
                isRoot: (p) => configResolver.isRoot(p),
                invalidate: (p) => configResolver.invalidate(p),
            },
            debuggerInstance.module('linter-tree'),
        );

        return new AglintContext(aglint, debuggerInstance, fsAdapter, pathAdapter, linterTree);
    }
}
