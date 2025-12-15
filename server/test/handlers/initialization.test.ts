/**
 * @file Tests for server initialization handler.
 */

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { TextDocumentSyncKind } from 'vscode-languageserver/node';

import { handleInitialize } from '../../src/handlers/initialization';
import { createMockServerContext } from '../helpers';

describe('handleInitialize', () => {
    describe('server capabilities', () => {
        it('should return correct server capabilities', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            const result = handleInitialize(params, context);

            expect(result.capabilities).toEqual({
                codeActionProvider: true,
                textDocumentSync: {
                    openClose: true,
                    change: TextDocumentSyncKind.Incremental,
                },
            });
        });

        it('should always enable code action provider', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            const result = handleInitialize(params, context);

            expect(result.capabilities.codeActionProvider).toBe(true);
        });

        it('should always configure text document sync', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            const result = handleInitialize(params, context);

            expect(result.capabilities.textDocumentSync).toEqual({
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
            });
        });
    });

    describe('debug mode initialization', () => {
        it('should set initialDebugMode to true when enabled in options', () => {
            const params = {
                capabilities: {},
                initializationOptions: {
                    enableAglintDebug: true,
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(true);
        });

        it('should set initialDebugMode to false when disabled in options', () => {
            const params = {
                capabilities: {},
                initializationOptions: {
                    enableAglintDebug: false,
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(false);
        });

        it('should not change initialDebugMode when not provided', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();
            context.initialDebugMode = true; // Set to true initially

            handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(true); // Should remain unchanged
        });

        it('should ignore non-boolean enableAglintDebug values', () => {
            const params = {
                capabilities: {},
                initializationOptions: {
                    enableAglintDebug: 'true', // String, not boolean
                },
            } as any;
            const context = createMockServerContext();
            const originalDebugMode = context.initialDebugMode;

            handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(originalDebugMode);
        });
    });

    describe('workspace root extraction', () => {
        it('should extract workspace root from file URI', () => {
            const params = {
                capabilities: {},
                rootUri: 'file:///Users/test/workspace',
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.workspaceRoot).toBe('/Users/test/workspace');
        });

        it('should use rootPath as fallback when URI conversion fails', () => {
            const params = {
                capabilities: {},
                rootUri: 'vscode://custom/uri',
                rootPath: '/fallback/path',
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.workspaceRoot).toBe('/fallback/path');
        });

        it('should set workspaceRoot to undefined when no workspace info available', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.workspaceRoot).toBeUndefined();
        });

        it('should log initialization message with workspace root', () => {
            const params = {
                capabilities: {},
                rootUri: 'file:///Users/test/workspace',
            } as any;
            const context = createMockServerContext();
            const debugSpy = vi.spyOn(context.connection.console, 'debug');

            handleInitialize(params, context);

            expect(debugSpy).toHaveBeenCalledWith(
                '[lsp] AGLint Language Server initialized with workspace root: /Users/test/workspace',
            );
        });

        it('should log initialization message without workspace root', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();
            const debugSpy = vi.spyOn(context.connection.console, 'debug');

            handleInitialize(params, context);

            expect(debugSpy).toHaveBeenCalledWith(
                '[lsp] AGLint Language Server initialized without workspace root',
            );
        });
    });

    describe('client capabilities detection', () => {
        it('should detect workspace configuration capability', () => {
            const params = {
                capabilities: {
                    workspace: {
                        configuration: true,
                    },
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasConfigurationCapability).toBe(true);
        });

        it('should detect missing workspace configuration capability', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasConfigurationCapability).toBe(false);
        });

        it('should detect workspace folders capability', () => {
            const params = {
                capabilities: {
                    workspace: {
                        workspaceFolders: true,
                    },
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasWorkspaceFolderCapability).toBe(true);
        });

        it('should detect missing workspace folders capability', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasWorkspaceFolderCapability).toBe(false);
        });

        it('should detect both capabilities when present', () => {
            const params = {
                capabilities: {
                    workspace: {
                        configuration: true,
                        workspaceFolders: true,
                    },
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasConfigurationCapability).toBe(true);
            expect(context.hasWorkspaceFolderCapability).toBe(true);
        });

        it('should handle null workspace capabilities', () => {
            const params = {
                capabilities: {
                    workspace: null,
                },
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.hasConfigurationCapability).toBe(false);
            expect(context.hasWorkspaceFolderCapability).toBe(false);
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete initialization with all options', () => {
            const params = {
                capabilities: {
                    workspace: {
                        configuration: true,
                        workspaceFolders: true,
                    },
                },
                initializationOptions: {
                    enableAglintDebug: true,
                    workspaceFolder: {
                        uri: 'file:///complete/workspace',
                    },
                },
                rootUri: 'file:///complete/workspace',
            } as any;
            const context = createMockServerContext();

            const result = handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(true);
            expect(context.workspaceRoot).toBe('/complete/workspace');
            expect(context.hasConfigurationCapability).toBe(true);
            expect(context.hasWorkspaceFolderCapability).toBe(true);
            expect(result.capabilities.codeActionProvider).toBe(true);
        });

        it('should handle minimal initialization', () => {
            const params = {
                capabilities: {},
            } as any;
            const context = createMockServerContext();

            const result = handleInitialize(params, context);

            expect(context.initialDebugMode).toBe(false);
            expect(context.workspaceRoot).toBeUndefined();
            expect(context.hasConfigurationCapability).toBe(false);
            expect(context.hasWorkspaceFolderCapability).toBe(false);
            expect(result.capabilities).toBeDefined();
        });

        it('should handle initialization with Windows paths', () => {
            const params = {
                capabilities: {},
                rootUri: 'file:///C:/Users/test/workspace',
            } as any;
            const context = createMockServerContext();

            handleInitialize(params, context);

            expect(context.workspaceRoot).toBeDefined();
            expect(context.workspaceRoot).toContain('Users');
            expect(context.workspaceRoot).toContain('test');
        });
    });
});
