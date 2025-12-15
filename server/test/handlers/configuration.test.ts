/**
 * @file Tests for configuration and settings management.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AglintContext } from '../../src/context/aglint-context';
import { createRetryAglintLoading, pullSettings } from '../../src/handlers/configuration';
import * as lintingOperations from '../../src/linting/orchestration';
import { defaultSettings } from '../../src/settings';
import { createMockConnection, createMockServerContext } from '../helpers';

// Mock the linting operations
vi.mock('../../src/linting/orchestration', () => ({
    refreshLinter: vi.fn(),
    removeAllDiagnostics: vi.fn(),
}));

// Mock AglintContext
vi.mock('../../src/context/aglint-context', () => ({
    AglintContext: {
        create: vi.fn(),
    },
}));

describe('pullSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('settings retrieval', () => {
        it('should fetch settings from workspace when capability is available', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();
            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: true };

            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            await pullSettings(context, connection);

            expect(connection.workspace.getConfiguration).toHaveBeenCalledWith({
                scopeUri: 'file:///test/workspace',
                section: 'adblock',
            });
            expect(context.settings).toEqual(mockSettings);
        });

        it('should use default settings when no capability', async () => {
            const context = createMockServerContext();
            context.hasConfigurationCapability = false;
            const connection = createMockConnection();

            await pullSettings(context, connection);

            expect(connection.workspace.getConfiguration).not.toHaveBeenCalled();
            expect(context.settings).toEqual(defaultSettings);
        });

        it('should use default settings when getConfiguration returns null', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();
            connection.workspace.getConfiguration.mockResolvedValue(null);

            await pullSettings(context, connection);

            expect(context.settings).toEqual(defaultSettings);
        });

        it('should handle workspace root without file URI', async () => {
            const context = createMockServerContext();
            context.workspaceRoot = undefined;
            const connection = createMockConnection();

            await pullSettings(context, connection);

            expect(connection.workspace.getConfiguration).toHaveBeenCalledWith({
                scopeUri: undefined,
                section: 'adblock',
            });
        });
    });

    describe('cache management', () => {
        it('should clear cache when caching is disabled', async () => {
            const context = createMockServerContext();
            context.settings.enableInMemoryAglintCache = true;
            context.aglintContext = {} as any; // Already initialized
            const connection = createMockConnection();

            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: false };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            const clearSpy = vi.spyOn(context.lintingCache, 'clear');

            await pullSettings(context, connection);

            expect(clearSpy).toHaveBeenCalled();
            expect(connection.console.info).toHaveBeenCalledWith(
                '[lsp] AGLint cache cleared (caching disabled)',
            );
        });

        it('should not clear cache when it was already disabled', async () => {
            const context = createMockServerContext();
            context.settings.enableInMemoryAglintCache = false;
            context.aglintContext = {} as any;
            const connection = createMockConnection();

            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: false };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            const clearSpy = vi.spyOn(context.lintingCache, 'clear');

            await pullSettings(context, connection);

            expect(clearSpy).not.toHaveBeenCalled();
        });

        it('should log when cache is enabled', async () => {
            const context = createMockServerContext();
            context.settings.enableInMemoryAglintCache = false;
            context.aglintContext = {} as any;
            const connection = createMockConnection();

            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: true };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            await pullSettings(context, connection);

            expect(connection.console.info).toHaveBeenCalledWith(
                '[lsp] In-memory linting cache enabled',
            );
        });
    });

    describe('AGLint enable/disable', () => {
        it('should send status notification when settings change', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();

            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: true };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            await pullSettings(context, connection);

            expect(connection.sendNotification).toHaveBeenCalledWith('aglint/status', {
                aglintEnabled: true,
            });
        });

        it('should remove diagnostics and return early when AGLint is disabled', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();

            const mockSettings = { enableAglint: false, enableInMemoryAglintCache: true };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            await pullSettings(context, connection);

            expect(lintingOperations.removeAllDiagnostics).toHaveBeenCalledWith(
                context.documents,
                connection,
            );
            expect(connection.console.debug).toHaveBeenCalledWith('[lsp] AGLint is disabled');
            expect(lintingOperations.refreshLinter).not.toHaveBeenCalled();
        });

        it('should log when AGLint is enabled', async () => {
            const context = createMockServerContext();
            context.aglintContext = {} as any; // Already initialized
            const connection = createMockConnection();

            const mockSettings = { enableAglint: true, enableInMemoryAglintCache: true };
            connection.workspace.getConfiguration.mockResolvedValue(mockSettings);

            await pullSettings(context, connection);

            expect(connection.console.debug).toHaveBeenCalledWith('[lsp] AGLint integration is enabled');
        });
    });

    describe('AGLint context initialization', () => {
        it('should initialize AGLint context when not already initialized', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();
            const mockAglintContext = { initialized: true };

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });
            vi.mocked(AglintContext.create).mockResolvedValue(mockAglintContext as any);

            await pullSettings(context, connection);

            expect(AglintContext.create).toHaveBeenCalledWith(
                connection,
                context.documents,
                context.workspaceRoot,
                context.initialDebugMode,
            );
            expect(context.aglintContext).toBe(mockAglintContext);
            expect(lintingOperations.refreshLinter).toHaveBeenCalledWith(context, connection);
        });

        it('should not initialize if already initialized', async () => {
            const context = createMockServerContext();
            context.aglintContext = { existing: true } as any;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(AglintContext.create).not.toHaveBeenCalled();
        });

        it('should not initialize if loading failed', async () => {
            const context = createMockServerContext();
            context.aglintLoadingFailed = true;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(AglintContext.create).not.toHaveBeenCalled();
        });

        it('should not initialize if already loading', async () => {
            const context = createMockServerContext();
            context.aglintLoading = true;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(AglintContext.create).not.toHaveBeenCalled();
        });

        it('should return early if workspace root is not defined', async () => {
            const context = createMockServerContext();
            context.workspaceRoot = undefined;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(connection.console.error).toHaveBeenCalledWith('[lsp] Workspace root is not defined');
            expect(lintingOperations.removeAllDiagnostics).toHaveBeenCalledWith(
                context.documents,
                connection,
            );
            expect(AglintContext.create).not.toHaveBeenCalled();
        });

        it('should set loading flag during initialization', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();
            let loadingDuringCreate = false;

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            vi.mocked(AglintContext.create).mockImplementation(async () => {
                loadingDuringCreate = context.aglintLoading;
                return { initialized: true } as any;
            });

            await pullSettings(context, connection);

            expect(loadingDuringCreate).toBe(true);
            expect(context.aglintLoading).toBe(false); // Cleared after
        });

        it('should clear loading flag even if initialization fails', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            vi.mocked(AglintContext.create).mockRejectedValue(new Error('Init failed'));

            await expect(pullSettings(context, connection)).rejects.toThrow('Init failed');
            expect(context.aglintLoading).toBe(false);
        });

        it('should handle initialization returning null', async () => {
            const context = createMockServerContext();
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            vi.mocked(AglintContext.create).mockResolvedValue(null as any);

            await pullSettings(context, connection);

            expect(context.aglintLoadingFailed).toBe(true);
            expect(connection.console.info).toHaveBeenCalledWith(
                '[lsp] AGLint loading failed. Will retry when package.json or node_modules changes.',
            );
            expect(lintingOperations.removeAllDiagnostics).toHaveBeenCalledWith(
                context.documents,
                connection,
            );
        });
    });

    describe('optimization - skip unnecessary work', () => {
        it('should skip refresh when nothing changed and AGLint is initialized', async () => {
            const context = createMockServerContext();
            context.aglintContext = { existing: true } as any;
            context.settings.enableAglint = true;
            context.settings.enableInMemoryAglintCache = true;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            // Should return early without calling refreshLinter
            expect(lintingOperations.refreshLinter).not.toHaveBeenCalled();
        });

        it('should skip refresh when nothing changed and loading failed', async () => {
            const context = createMockServerContext();
            context.aglintLoadingFailed = true;
            context.settings.enableAglint = true;
            context.settings.enableInMemoryAglintCache = true;
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(lintingOperations.refreshLinter).not.toHaveBeenCalled();
        });

        it('should refresh when enableAglint changes', async () => {
            const context = createMockServerContext();
            context.aglintContext = { existing: true } as any;
            context.settings.enableAglint = false; // Was disabled
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true, // Now enabled
                enableInMemoryAglintCache: true,
            });

            await pullSettings(context, connection);

            expect(lintingOperations.refreshLinter).toHaveBeenCalled();
        });

        it('should refresh when cache setting changes', async () => {
            const context = createMockServerContext();
            context.aglintContext = { existing: true } as any;
            context.settings.enableAglint = true;
            context.settings.enableInMemoryAglintCache = false; // Was disabled
            const connection = createMockConnection();

            connection.workspace.getConfiguration.mockResolvedValue({
                enableAglint: true,
                enableInMemoryAglintCache: true, // Now enabled
            });

            await pullSettings(context, connection);

            expect(lintingOperations.refreshLinter).toHaveBeenCalled();
        });
    });
});

describe('createRetryAglintLoading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should return a debounced function', () => {
        const context = createMockServerContext();
        const connection = createMockConnection();

        const retryFn = createRetryAglintLoading(context, connection);

        expect(typeof retryFn).toBe('function');
        expect(retryFn.clear).toBeDefined(); // Debounce functions have .clear()
    });

    it('should retry loading when loading failed and not currently loading', async () => {
        const context = createMockServerContext();
        context.aglintLoadingFailed = true;
        const connection = createMockConnection();
        const mockAglintContext = { initialized: true };

        connection.workspace.getConfiguration.mockResolvedValue({
            enableAglint: true,
            enableInMemoryAglintCache: true,
        });
        vi.mocked(AglintContext.create).mockResolvedValue(mockAglintContext as any);

        const retryFn = createRetryAglintLoading(context, connection);

        // Call and advance timers to trigger debounce
        retryFn();
        await vi.advanceTimersByTimeAsync(2000);

        expect(connection.console.info).toHaveBeenCalledWith(
            '[lsp] Retrying AGLint loading after package changes settled',
        );
        expect(context.aglintLoadingFailed).toBe(false);
    });

    it('should not retry if loading did not fail', async () => {
        const context = createMockServerContext();
        context.aglintLoadingFailed = false;
        const connection = createMockConnection();

        const retryFn = createRetryAglintLoading(context, connection);

        retryFn();
        await vi.advanceTimersByTimeAsync(2000);

        expect(connection.console.info).not.toHaveBeenCalled();
        expect(AglintContext.create).not.toHaveBeenCalled();
    });

    it('should not retry if currently loading', async () => {
        const context = createMockServerContext();
        context.aglintLoadingFailed = true;
        context.aglintLoading = true;
        const connection = createMockConnection();

        const retryFn = createRetryAglintLoading(context, connection);

        retryFn();
        await vi.advanceTimersByTimeAsync(2000);

        expect(AglintContext.create).not.toHaveBeenCalled();
    });

    it('should debounce multiple calls', async () => {
        const context = createMockServerContext();
        context.aglintLoadingFailed = true;
        const connection = createMockConnection();
        const mockAglintContext = { initialized: true };

        connection.workspace.getConfiguration.mockResolvedValue({
            enableAglint: true,
            enableInMemoryAglintCache: true,
        });
        vi.mocked(AglintContext.create).mockResolvedValue(mockAglintContext as any);

        const retryFn = createRetryAglintLoading(context, connection);

        // Call multiple times quickly
        retryFn();
        await vi.advanceTimersByTimeAsync(100);
        retryFn();
        await vi.advanceTimersByTimeAsync(100);
        retryFn();

        // Advance to trigger debounce
        await vi.advanceTimersByTimeAsync(2000);

        // Should execute, but due to debouncing, multiple quick calls result in one execution
        expect(connection.console.info).toHaveBeenCalled();
        expect(connection.console.info).toHaveBeenCalledWith(
            '[lsp] Retrying AGLint loading after package changes settled',
        );
    });
});
