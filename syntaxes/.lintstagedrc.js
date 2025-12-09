/** @type {import('lint-staged').Configuration} */
const path = require('node:path');

/**
 * Make file path relative to the current working directory
 *
 * @param {string} file File path
 *
 * @returns {string} Relative path
 */
const makeRelative = (file) => path.relative(process.cwd(), file);

module.exports = {
    // run tests if the grammar file are changed
    'adblock.yaml-tmlanguage': 'vitest run',
    '**/*.md': 'markdownlint',
    '**/*.js': 'eslint --cache',
    '**/*.ts': [
        // Type-check only the staged TS files while still honoring tsconfig
        // Exclude config files that import build tools (they're checked by tsconfig.json)
        (files) => {
            const filesToCheck = files.filter(file => !file.includes('vitest.config.ts'));
            return filesToCheck.length > 0 ? `tsc-files --noEmit ${filesToCheck.join(' ')}` : 'echo "No files to type-check"';
        },

        // Run tests that are related to those changed files
        (files) => {
            const testableFiles = files.filter(file => !file.includes('vitest.config.ts'));
            return testableFiles.length > 0 ? `vitest related --run ${testableFiles.map(makeRelative).join(' ')}` : 'echo "No test files"';
        },

        // Lint the staged TS files
        'eslint --cache',
    ],
};
