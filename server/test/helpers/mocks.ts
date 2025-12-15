/**
 * @file Shared test mocks and helpers.
 */

import { vi } from 'vitest';

import type { ServerContext } from '../../src/context/server-context';
import { defaultSettings } from '../../src/settings';

/**
 * Creates a mock connection for testing.
 *
 * @returns Mock connection object.
 */
export function createMockConnection() {
    return {
        workspace: {
            getConfiguration: vi.fn(),
        },
        console: {
            debug: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            log: vi.fn(),
        },
        sendNotification: vi.fn(),
        onNotification: vi.fn(),
        onRequest: vi.fn(),
        onCodeAction: vi.fn(),
    } as any;
}

/**
 * Creates a mock ServerContext for testing.
 *
 * @param overrides Optional overrides for specific properties.
 *
 * @returns Mock server context.
 */
export function createMockServerContext(overrides?: Partial<ServerContext>): ServerContext {
    const mockContext = {
        connection: createMockConnection(),
        documents: {
            all: vi.fn(() => []),
            get: vi.fn(),
            keys: vi.fn(() => []),
        } as any,
        settings: { ...defaultSettings },
        workspaceRoot: '/test/workspace',
        initialDebugMode: false,
        hasConfigurationCapability: true,
        hasWorkspaceFolderCapability: false,
        aglintContext: null,
        aglintLoading: false,
        aglintLoadingFailed: false,
        lintingCache: new Map(),
        // Add mutation methods
        updateSettings: vi.fn((settings) => {
            mockContext.settings = settings;
        }),
        updateInitialDebugMode: vi.fn((enabled) => {
            mockContext.initialDebugMode = enabled;
        }),
        updateAglintContext: vi.fn((context) => {
            mockContext.aglintContext = context;
        }),
        setAglintLoading: vi.fn((loading) => {
            mockContext.aglintLoading = loading;
        }),
        setAglintLoadingFailed: vi.fn((failed) => {
            mockContext.aglintLoadingFailed = failed;
        }),
        setWorkspaceRoot: vi.fn((root) => {
            mockContext.workspaceRoot = root;
        }),
        setConfigurationCapability: vi.fn((hasCapability) => {
            mockContext.hasConfigurationCapability = hasCapability;
        }),
        setWorkspaceFolderCapability: vi.fn((hasCapability) => {
            mockContext.hasWorkspaceFolderCapability = hasCapability;
        }),
        ...overrides,
    } as any;

    return mockContext;
}
