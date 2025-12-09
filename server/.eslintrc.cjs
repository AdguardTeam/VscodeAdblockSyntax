const path = require('node:path');

module.exports = {
    extends: '../.eslintrc.cjs',
    parserOptions: {
        tsconfigRootDir: path.join(__dirname),
        project: 'tsconfig.json',
    },
    rules: {
        // Disable the base rule to avoid conflicts
        'no-restricted-imports': 'off',
        // Only allow type imports from aglint (server-specific rule)
        '@typescript-eslint/no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['@adguard/aglint', '@adguard/aglint/*'],
                        allowTypeImports: true,
                    },
                ],
            },
        ],
    },
};
