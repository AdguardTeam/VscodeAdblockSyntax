import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

/**
 * Minimal mock of VSCode's WorkspaceFolder type.
 */
type WorkspaceFolder = {
    uri: {
        fsPath: string;
    };
};

/**
 * Hoisted stateful mock of the VS Code workspace API.
 */
const h = vi.hoisted(() => {
    const state = {
        folders: [] as WorkspaceFolder[],
        listeners: [] as Array<(...args: any[]) => void>,
    };

    const workspace = {
        get workspaceFolders() {
            return state.folders;
        },
        set workspaceFolders(v: WorkspaceFolder[] | undefined) {
            state.folders = v ?? [];
        },
        onDidChangeWorkspaceFolders(cb: (...args: any[]) => void) {
            state.listeners.push(cb);

            return {
                dispose() {
                    /* noop */
                },
            };
        },
    };

    const api = {
        setFolders(folders: WorkspaceFolder[]) {
            state.folders = folders;
        },
        emitChange() {
            for (const cb of state.listeners) {
                cb({});
            }
        },
        reset() {
            state.folders = [];
            state.listeners = [];
        },
    };

    return {
        state,
        workspace,
        api,
    };
});

vi.mock('vscode', () => ({
    workspace: h.workspace,
}));

/**
 * Helper to create a WorkspaceFolder from a path.
 * Note, this is a minimal stub, only the fsPath is needed for our tests.
 *
 * @param p Path.
 *
 * @returns WorkspaceFolder.
 */
const f = (p: string): WorkspaceFolder => ({
    uri: {
        fsPath: p,
    },
});

describe('workspace utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // ensure fresh import of the SUT each test
        vi.resetModules();

        // reset our hoisted mock state
        h.api.reset();
    });

    it('fileInFolder: handles basic POSIX paths (absolute & relative)', async () => {
        const util = await import('../src/workspace-folders');

        // absolute inside outer
        expect(util.fileInFolder('/a/b/c.txt', '/a')).toBe(true);

        // exact match (implementation treats "inside" as strictly underneath, not equal)
        expect(util.fileInFolder('/a/b', '/a/b')).toBe(false);

        // similar prefix but different folder
        expect(util.fileInFolder('/a/b', '/a/bb')).toBe(false);

        // relative paths resolve against CWD
        expect(util.fileInFolder('src/file.ts', 'src')).toBe(true);
        expect(util.fileInFolder('src/file.ts', 'dist')).toBe(false);
    });

    it('fileInFolder: compares case-insensitively on Windows', async () => {
        // force windows path semantics for this test
        const pathWin32 = await import('node:path').then((m) => m.win32);
        vi.doMock('node:path', () => pathWin32 as any);

        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });

        try {
            const util = await import('../src/workspace-folders');

            const file = 'C:\\Users\\Me\\Project\\src\\Index.ts';
            const folder = 'c:\\users\\me\\project';

            expect(util.fileInFolder(file, folder)).toBe(true);

            expect(util.fileInFolder('C:\\Other\\x.ts', folder)).toBe(false);
        } finally {
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        }
    });

    it('getSortedWorkspaceFolders: sorts by fsPath length ascending and caches', async () => {
        h.api.setFolders([f('/z/very/long/path'), f('/a'), f('/a/b')]);

        const util = await import('../src/workspace-folders');

        const first = util.getSortedWorkspaceFolders().map((w) => w.uri.fsPath);

        expect(first).toEqual(['/a', '/a/b', '/z/very/long/path']);

        // mutate backing folders but don't emit change -> cache should stick
        h.api.setFolders([f('/should/not/be/seen')]);

        const second = util.getSortedWorkspaceFolders().map((w) => w.uri.fsPath);

        expect(second).toEqual(first);
    });

    it('getSortedWorkspaceFolders: cache invalidates on Workspace.onDidChangeWorkspaceFolders', async () => {
        h.api.setFolders([f('/c'), f('/a/b'), f('/a')]);

        const util = await import('../src/workspace-folders');

        const initial = util.getSortedWorkspaceFolders().map((w) => w.uri.fsPath);

        // stable sort by length: '/c'(2), '/a'(2), '/a/b'(4) -> '/c', '/a', '/a/b'
        expect(initial).toEqual(['/c', '/a', '/a/b']);

        // update folders and emit change -> cache should invalidate
        h.api.setFolders([f('/root'), f('/root/sub'), f('/x')]);
        h.api.emitChange();

        const after = util.getSortedWorkspaceFolders().map((w) => w.uri.fsPath);

        expect(after).toEqual(['/x', '/root', '/root/sub']);
    });

    it('getOuterMostWorkspaceFolder: returns the outer-most containing folder', async () => {
        h.api.setFolders([f('/root'), f('/root/packages/app'), f('/root/packages')]);

        const util = await import('../src/workspace-folders');

        const target = f('/root/packages/app');

        expect(util.getOuterMostWorkspaceFolder(target as any).uri.fsPath).toBe('/root');

        const isolated = f('/elsewhere/project');

        expect(util.getOuterMostWorkspaceFolder(isolated as any).uri.fsPath).toBe('/elsewhere/project');
    });
});
