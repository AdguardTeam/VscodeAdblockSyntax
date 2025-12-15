/**
 * @file Mock of VSCode API for testing.
 *
 * This provides minimal mocks of VSCode types and enums needed for unit tests.
 */

/**
 * Mock LogLevel enum.
 *
 * Values from: https://code.visualstudio.com/api/references/vscode-api#LogLevel.
 */
export enum LogLevel {
    Off = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,
}

// Export other mocks as needed for tests
export const workspace = {
    workspaceFolders: [],
    onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
};

export const window = {
    activeTextEditor: undefined,
};
