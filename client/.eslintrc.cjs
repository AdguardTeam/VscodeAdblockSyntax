const path = require('node:path');

module.exports = {
    extends: '../.eslintrc.cjs',
    parserOptions: {
        tsconfigRootDir: path.join(__dirname),
        project: 'tsconfig.json',
    },
};
