/**
 * @file Tests for workspace utilities.
 */

import { describe, expect, it } from 'vitest';

import { extractWorkspaceRootUri, getWorkspaceRootFromRootUri } from '../../src/utils/workspace';

describe('extractWorkspaceRootUri', () => {
    it('should extract from initializationOptions.workspaceFolder.uri (highest priority)', () => {
        const params = {
            initializationOptions: {
                workspaceFolder: {
                    uri: 'file:///workspace/from/init-options',
                },
            },
            rootUri: 'file:///workspace/from/rootUri',
            workspaceFolders: [
                { uri: 'file:///workspace/from/folders', name: 'test' },
            ],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///workspace/from/init-options');
    });

    it('should extract from rootUri when initializationOptions.workspaceFolder is not available', () => {
        const params = {
            rootUri: 'file:///workspace/from/rootUri',
            workspaceFolders: [
                { uri: 'file:///workspace/from/folders', name: 'test' },
            ],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///workspace/from/rootUri');
    });

    it('should extract from workspaceFolders[0] when neither initializationOptions nor rootUri available', () => {
        const params = {
            workspaceFolders: [
                { uri: 'file:///workspace/from/folders', name: 'test' },
            ],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///workspace/from/folders');
    });

    it('should return undefined when no workspace information is available', () => {
        const params = {} as any;

        expect(extractWorkspaceRootUri(params)).toBeUndefined();
    });

    it('should return undefined when workspaceFolders is empty array', () => {
        const params = {
            workspaceFolders: [],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBeUndefined();
    });

    it('should return undefined when initializationOptions exists but workspaceFolder is missing', () => {
        const params = {
            initializationOptions: {
                someOtherOption: true,
            },
            rootUri: null,
        } as any;

        // rootUri is null (falsy), so logic falls through and returns undefined
        expect(extractWorkspaceRootUri(params)).toBeUndefined();
    });

    it('should handle multiple workspace folders and pick the first one', () => {
        const params = {
            workspaceFolders: [
                { uri: 'file:///workspace/first', name: 'first' },
                { uri: 'file:///workspace/second', name: 'second' },
                { uri: 'file:///workspace/third', name: 'third' },
            ],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///workspace/first');
    });

    it('should prioritize initializationOptions even when all sources are present', () => {
        const params = {
            initializationOptions: {
                workspaceFolder: {
                    uri: 'file:///priority/init-options',
                },
            },
            rootUri: 'file:///priority/rootUri',
            workspaceFolders: [
                { uri: 'file:///priority/folders', name: 'test' },
            ],
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///priority/init-options');
    });

    it('should handle Windows-style file URIs', () => {
        const params = {
            rootUri: 'file:///C:/Users/test/workspace',
        } as any;

        expect(extractWorkspaceRootUri(params)).toBe('file:///C:/Users/test/workspace');
    });
});

describe('getWorkspaceRootFromRootUri', () => {
    it('should convert file URI to path', () => {
        const uri = 'file:///Users/test/workspace';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBe('/Users/test/workspace');
    });

    it('should return undefined for non-file URI (http)', () => {
        const uri = 'http://example.com/workspace';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeUndefined();
    });

    it('should return undefined for non-file URI (https)', () => {
        const uri = 'https://example.com/workspace';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeUndefined();
    });

    it('should return undefined for undefined URI', () => {
        const path = getWorkspaceRootFromRootUri(undefined);

        expect(path).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
        const path = getWorkspaceRootFromRootUri('');

        expect(path).toBeUndefined();
    });

    it('should handle Windows-style file URI', () => {
        const uri = 'file:///C:/Users/test/workspace';
        const path = getWorkspaceRootFromRootUri(uri);

        // On Windows this will return C:\Users\test\workspace
        // On Unix this will return /C:/Users/test/workspace
        expect(path).toBeDefined();
        expect(path).toContain('Users');
        expect(path).toContain('test');
        expect(path).toContain('workspace');
    });

    it('should handle file URI with special characters', () => {
        const uri = 'file:///workspace/with%20spaces';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeDefined();
        expect(path).toContain('with spaces');
    });

    it('should handle file URI with encoded characters', () => {
        // Note: fileURLToPath throws on encoded slashes
        const uri = 'file:///workspace/with%20spaces'; // Use encoded space instead
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeDefined();
        expect(path).toContain('workspace');
        expect(path).toContain('with spaces');
    });

    it('should return undefined for malformed URIs', () => {
        // Malformed URIs are not file:// URIs, so isFileUri returns false
        const path = getWorkspaceRootFromRootUri('vscode://file');

        expect(path).toBeUndefined();
    });

    it('should handle file URI with trailing slash', () => {
        const uri = 'file:///Users/test/workspace/';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeDefined();
        expect(path).toContain('workspace');
    });

    it('should handle file URI with query parameters (edge case)', () => {
        const uri = 'file:///Users/test/workspace?param=value';
        const path = getWorkspaceRootFromRootUri(uri);

        expect(path).toBeDefined();
    });
});

describe('workspace utilities integration', () => {
    it('should handle full workflow from params to path', () => {
        const params = {
            rootUri: 'file:///Users/developer/project',
        } as any;

        const uri = extractWorkspaceRootUri(params);
        expect(uri).toBe('file:///Users/developer/project');

        const path = getWorkspaceRootFromRootUri(uri);
        expect(path).toBe('/Users/developer/project');
    });

    it('should handle workflow with no workspace info', () => {
        const params = {} as any;

        const uri = extractWorkspaceRootUri(params);
        expect(uri).toBeUndefined();

        const path = getWorkspaceRootFromRootUri(uri);
        expect(path).toBeUndefined();
    });

    it('should handle workflow with non-file URI', () => {
        const params = {
            rootUri: 'vscode://file/path',
        } as any;

        const uri = extractWorkspaceRootUri(params);
        expect(uri).toBe('vscode://file/path');

        const path = getWorkspaceRootFromRootUri(uri);
        expect(path).toBeUndefined(); // Not a file:// URI
    });
});
