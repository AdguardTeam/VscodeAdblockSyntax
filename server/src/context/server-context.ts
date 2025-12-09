/**
 * @file Server context - centralized state management for the language server.
 */

import type { Connection, TextDocuments } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import { LintingCache } from '../linting/cache';
import type { ExtensionSettings } from '../settings';
import { defaultSettings } from '../settings';

import type { AglintContext } from './aglint-context';

/**
 * Centralized server context holding all shared state.
 */
export class ServerContext {
    /**
     * Language server connection.
     */
    public connection: Connection;

    /**
     * Text document manager.
     */
    public documents: TextDocuments<TextDocument>;

    /**
     * Whether the client supports workspace/configuration request.
     */
    public hasConfigurationCapability = false;

    /**
     * Whether the client supports workspace/workspaceFolders request.
     */
    public hasWorkspaceFolderCapability = false;

    /**
     * Root folder of the VSCode workspace.
     */
    public workspaceRoot: string | undefined;

    /**
     * Current extension settings.
     */
    public settings: ExtensionSettings = defaultSettings;

    /**
     * Initial debug mode from VSCode log level.
     */
    public initialDebugMode = false;

    /**
     * AGLint context instance, if initialized.
     */
    public aglintContext: AglintContext | undefined;

    /**
     * Flag to track if AGLint loading has failed.
     */
    public aglintLoadingFailed = false;

    /**
     * Flag to track if AGLint loading is currently in progress.
     */
    public aglintLoading = false;

    /**
     * Cache for linting results.
     */
    public lintingCache: LintingCache;

    /**
     * Creates a new server context.
     *
     * @param connection Language server connection.
     * @param documents Text document manager.
     */
    constructor(connection: Connection, documents: TextDocuments<TextDocument>) {
        this.connection = connection;
        this.documents = documents;
        this.lintingCache = new LintingCache();
    }

    /**
     * Update the extension settings.
     *
     * @param settings New settings to apply.
     */
    public updateSettings(settings: ExtensionSettings): void {
        this.settings = settings;
    }

    /**
     * Update the initial debug mode flag.
     *
     * @param enabled Whether debug mode is enabled.
     */
    public updateInitialDebugMode(enabled: boolean): void {
        this.initialDebugMode = enabled;
    }

    /**
     * Update the AGLint context.
     *
     * @param context New AGLint context or undefined to clear.
     */
    public updateAglintContext(context: AglintContext | undefined): void {
        this.aglintContext = context;
    }

    /**
     * Set the AGLint loading state.
     *
     * @param loading Whether AGLint is currently loading.
     */
    public setAglintLoading(loading: boolean): void {
        this.aglintLoading = loading;
    }

    /**
     * Set the AGLint loading failed state.
     *
     * @param failed Whether AGLint loading has failed.
     */
    public setAglintLoadingFailed(failed: boolean): void {
        this.aglintLoadingFailed = failed;
    }

    /**
     * Set the workspace root path.
     *
     * @param root Workspace root path or undefined.
     */
    public setWorkspaceRoot(root: string | undefined): void {
        this.workspaceRoot = root;
    }

    /**
     * Set whether the client supports configuration capability.
     *
     * @param hasCapability Whether the capability is supported.
     */
    public setConfigurationCapability(hasCapability: boolean): void {
        this.hasConfigurationCapability = hasCapability;
    }

    /**
     * Set whether the client supports workspace folder capability.
     *
     * @param hasCapability Whether the capability is supported.
     */
    public setWorkspaceFolderCapability(hasCapability: boolean): void {
        this.hasWorkspaceFolderCapability = hasCapability;
    }
}
