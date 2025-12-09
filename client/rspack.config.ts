/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'node:path';

import { defineConfig } from '@rspack/cli';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    target: 'node',
    mode: isProduction ? 'production' : 'development',

    stats: 'normal',

    entry: {
        extension: './src/extension.ts',
    },

    output: {
        path: resolve(__dirname, 'out'),
        filename: '[name].js', // -> extension.js
        chunkFilename: '[name].[contenthash:8].js', // -> vendors.abc12345.js, agtree-compatibility.def67890.js
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
        splitChunks: {
            chunks: 'all',
            minSize: 20000,
            cacheGroups: {
                vscodeLanguageclientVendor: {
                    test: /[\\/]node_modules[\\/]vscode-languageclient[\\/]/,
                    name: 'vendors/vscode-languageclient',
                    chunks: 'all',
                    priority: 35,
                    reuseExistingChunk: true,
                },
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors/vendors',
                    chunks: 'all',
                    priority: 10,
                    reuseExistingChunk: true,
                },
                common: {
                    minChunks: 2,
                    name: 'common',
                    chunks: 'all',
                    priority: 0,
                    reuseExistingChunk: true,
                },
            },
        },
    },

    devtool: isProduction ? false : 'source-map',
});
