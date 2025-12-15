const path = require('node:path');

module.exports = {
    extends: '../.eslintrc.cjs',
    parserOptions: {
        tsconfigRootDir: path.join(__dirname),
        project: 'tsconfig.json',
    },
    rules: {
        // In this package we do not have real dependencies, all of them are dev dependencies
        'import/no-extraneous-dependencies': 'off',
    },
};
