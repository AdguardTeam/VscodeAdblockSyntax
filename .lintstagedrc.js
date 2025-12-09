/**
 * Lint-staged configuration for the monorepo root.
 *
 * Delegates to workspace-level configs for package-specific linting with
 * type checking (tsc-files) and related tests (vitest related).
 *
 * @type {import('lint-staged').Config}
 */

module.exports = {
    // Root markdown files
    '*.md': 'markdownlint',

    // Root-level tools and scripts
    'tools/**/*.{ts,js,cjs,mjs}': 'eslint --cache',

    // Delegate to workspace configs (they have tsc-files + vitest related)
    'client/**/*.{ts,js,md}': () => 'pnpm --filter @vscode-adblock-syntax/client exec lint-staged',
    'server/**/*.{ts,js,md}': () => 'pnpm --filter @vscode-adblock-syntax/server exec lint-staged',
    'shared/**/*.{ts,js,md}': () => 'pnpm --filter @vscode-adblock-syntax/shared exec lint-staged',
    'syntaxes/**/*.{ts,js,md,yaml-tmlanguage}': () => 'pnpm --filter @vscode-adblock-syntax/syntaxes exec lint-staged',
};
