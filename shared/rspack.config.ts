/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'node:path';

import { defineConfig } from '@rspack/cli';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    target: 'node',
    mode: isProduction ? 'production' : 'development',

    stats: 'normal',

    entry: {
        index: './src/index.ts',
        'file-scheme': './src/file-scheme.ts',
    },

    output: {
        path: resolve(__dirname, 'out'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        clean: true,
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                            },
                            target: 'es2020',
                        },
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    externals: {
        vscode: 'commonjs vscode',
    },
    optimization: {
        minimize: isProduction,
    },
    devtool: isProduction ? false : 'source-map',
});
