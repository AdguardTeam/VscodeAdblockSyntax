module.exports = {
    extends: '../.eslintrc.cjs',
    rules: {
        'no-restricted-imports': 'off',
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
