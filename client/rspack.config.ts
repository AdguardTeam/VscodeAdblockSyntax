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
                // Automatically split all other vendors by package name
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module: any) {
                        const { context } = module;

                        // Handle pnpm's .pnpm directory structure
                        // pnpm creates these paths:
                        // - node_modules/.pnpm/<package>@<version>/node_modules/<package>
                        // - node_modules/.pnpm/@scope+package@<version>/node_modules/@scope/package
                        // - node_modules/.pnpm/node_modules/<package> (edge case)
                        const pnpmMatch = context.match(
                            /[\\/]\.pnpm[\\/](?:@?[^@/\\]+@[^/\\]+[\\/])?node_modules[\\/]((?:@[^/\\]+[\\/])?[^/\\]+)/,
                        );
                        if (pnpmMatch) {
                            const packageName = pnpmMatch[1]
                                .replace('@', '')
                                .replace(/\//g, '-');
                            return `vendors/${packageName}`;
                        }

                        // Standard node_modules structure (npm/yarn)
                        // - node_modules/<package>
                        // - node_modules/@scope/package
                        const packageNameMatch = context.match(
                            /[\\/]node_modules[\\/]((?:@[^/\\]+[\\/])?[^/\\]+)/,
                        );
                        if (packageNameMatch) {
                            const packageName = packageNameMatch[1]
                                .replace('@', '')
                                .replace(/\//g, '-');
                            return `vendors/${packageName}`;
                        }

                        return 'vendors/vendor';
                    },
                    chunks: 'all',
                    priority: 10,
                    reuseExistingChunk: true,
                },
            },
        },
    },

    devtool: isProduction ? false : 'source-map',
});
