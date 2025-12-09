const path = require('node:path');

const MAX_LINE_LENGTH = 120;

/**
 * ESLint rules.
 *
 * @see {@link https://eslint.org/docs/v8.x/rules/}
 */
const ESLINT_RULES = {
    indent: 'off',
    'no-bitwise': 'off',
    'no-new': 'off',
    'no-continue': 'off',
    'arrow-body-style': 'off',

    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-constant-condition': ['error', { checkLoops: false }],
    'max-len': [
        'error',
        {
            code: MAX_LINE_LENGTH,
            comments: MAX_LINE_LENGTH,
            tabWidth: 4,
            ignoreUrls: true,
            ignoreTrailingComments: false,
            ignoreComments: false,
        },
    ],
    // Sort members of import statements, e.g. `import { B, A } from 'module';` -> `import { A, B } from 'module';`
    // Note: imports themself are sorted by import/order rule
    'sort-imports': ['error', {
        ignoreCase: true,
        // Avoid conflict with import/order rule
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],
};

/**
 * TypeScript ESLint rules.
 *
 * @see {@link https://typescript-eslint.io/rules/}
 */
const TYPESCRIPT_ESLINT_RULES = {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',

    '@typescript-eslint/member-delimiter-style': 'error',

    '@typescript-eslint/indent': ['error', 4],
    '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
            accessibility: 'explicit',
            overrides: {
                accessors: 'explicit',
                constructors: 'no-public',
                methods: 'explicit',
                properties: 'off',
                parameterProperties: 'explicit',
            },
        },
    ],
    // Force proper import and export of types
    '@typescript-eslint/consistent-type-imports': [
        'error',
        {
            prefer: 'type-imports',
            fixStyle: 'inline-type-imports',
        },
    ],
    '@typescript-eslint/consistent-type-exports': [
        'error',
        {
            fixMixedExportsWithInlineTypeSpecifier: true,
        },
    ],
};

/**
 * Import plugin rules.
 *
 * @see {@link https://github.com/import-js/eslint-plugin-import/tree/main/docs/rules}
 */
const IMPORT_PLUGIN_RULES = {
    'import/prefer-default-export': 'off',

    'import-newlines/enforce': ['error', 3, MAX_LINE_LENGTH],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    // Split external and internal imports with an empty line
    'import/order': [
        'error',
        {
            groups: [
                // Built-in Node.js modules
                'builtin',
                // External packages
                'external',
                // Parent modules should be in the second place, e.g. `import { foo } from '../bar';`
                'parent',
                // Sibling modules should be in the third place, e.g. `import { foo } from './bar';`
                'sibling',
                // All other imports should be in the last place
            ],
            alphabetize: { order: 'asc', caseInsensitive: true },
            'newlines-between': 'always',
        },
    ],
};

/**
 * JSDoc plugin rules.
 *
 * @see {@link https://github.com/gajus/eslint-plugin-jsdoc?tab=readme-ov-file#user-content-eslint-plugin-jsdoc-rules}
 */
const JSDOC_PLUGIN_RULES = {
    // Types are described in TypeScript
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-throws-type': 'off',
    'jsdoc/no-undefined-types': 'off',
    'jsdoc/require-returns-type': 'off',

    'jsdoc/require-param-description': 'error',
    'jsdoc/require-property-description': 'error',
    'jsdoc/require-returns-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns-check': 'error',

    'jsdoc/check-tag-names': [
        'warn',
        {
            // Define additional tags
            // https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-tag-names.md#definedtags
            definedTags: ['note'],
        },
    ],

    'jsdoc/require-hyphen-before-param-description': ['error', 'never'],
    'jsdoc/require-jsdoc': [
        'error',
        {
            contexts: [
                'ClassDeclaration',
                'ClassProperty',
                'PropertyDefinition',
                'FunctionDeclaration',
                'MethodDefinition',
            ],
        },
    ],
    'jsdoc/require-description': [
        'error',
        {
            contexts: [
                'ClassDeclaration',
                'ClassProperty',
                'PropertyDefinition',
                'FunctionDeclaration',
                'MethodDefinition',
            ],
        },
    ],
    'jsdoc/require-description-complete-sentence': [
        'error',
        {
            abbreviations: [
                'e.g.',
                'i.e.',
            ],
        },
    ],
    'jsdoc/multiline-blocks': [
        'error',
        {
            noSingleLineBlocks: true,
            singleLineTags: [
                'inheritdoc',
            ],
        },
    ],
    'jsdoc/tag-lines': [
        'error',
        'any',
        {
            startLines: 1,
        },
    ],
    'jsdoc/sort-tags': [
        'error',
        {
            linesBetween: 1,
            tagSequence: [
                { tags: ['file'] },
                { tags: ['template'] },
                { tags: ['see'] },
                { tags: ['param'] },
                { tags: ['returns'] },
                { tags: ['throws'] },
                { tags: ['example'] },
            ],
        },
    ],
};

/**
 * N plugin rules.
 *
 * @see {@link https://github.com/eslint-community/eslint-plugin-n?tab=readme-ov-file#-rules}
 */
const N_PLUGIN_RULES = {
    // Import plugin is enough, also, this rule requires extensions in ESM, but we use bundler resolution
    'n/no-missing-import': 'off',
    'n/no-unpublished-import': 'off',
    // Require using node protocol for node modules, e.g. `node:fs` instead of `fs`.
    'n/prefer-node-protocol': 'error',
    // Prefer `/promises` API for `fs` and `dns` modules, if the corresponding imports are used.
    'n/prefer-promises/fs': 'error',
    'n/prefer-promises/dns': 'error',
};

/**
 * Boundaries plugin rules.
 *
 * @see {@link https://github.com/javierbrea/eslint-plugin-boundaries#readme}
 */
const BOUNDARIES_PLUGIN_RULES = {
    'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
            {
                from: 'client',
                allow: ['client'],
            },
            {
                from: 'server',
                allow: ['server'],
            },
            // TODO: Add more rules, like helpers only can import helpers, etc.
        ],
    }],
};

/**
 * Merges multiple rule sets into a single object.
 *
 * @param ruleSets The rule sets to merge.
 *
 * @returns The merged rule set.
 */
function mergeRules(...ruleSets) {
    const merged = {};
    for (const rules of ruleSets) {
        for (const [key, value] of Object.entries(rules)) {
            if (merged[key]) {
                throw new Error(`Duplicate ESLint rule: ${key}`);
            }
            merged[key] = value;
        }
    }
    return merged;
}

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        'import',
        'import-newlines',
        '@typescript-eslint',
        'n',
        'boundaries',
    ],
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:jsdoc/recommended',
        'plugin:jsdoc/recommended-typescript',
        'plugin:n/recommended',
    ],
    ignorePatterns: [
        'out',
        'coverage',
    ],
    settings: {
        'boundaries/elements': [
            {
                type: 'client',
                pattern: 'client',
                mode: 'folder',
            },
            {
                type: 'server',
                pattern: 'server',
                mode: 'folder',
            },
        ],
    },
    rules: mergeRules(
        ESLINT_RULES,
        TYPESCRIPT_ESLINT_RULES,
        IMPORT_PLUGIN_RULES,
        JSDOC_PLUGIN_RULES,
        N_PLUGIN_RULES,
        BOUNDARIES_PLUGIN_RULES,
    ),
};
