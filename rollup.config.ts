import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import externals from "rollup-plugin-node-externals";
import json from "@rollup/plugin-json";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";

// Is this a watch build?
const watch = process.env.ROLLUP_WATCH;

// Common plugins
const common = [json(), commonjs(), resolve({ preferBuiltins: false })];

// Config for the client
const client = {
    input: "./client/src/extension.ts",
    output: [
        {
            file: "./client/out/extension.js",
            format: "cjs",
            exports: "auto",
            sourcemap: true,
        },
    ],
    plugins: [
        ...common,
        typescript({
            tsconfig: "./client/tsconfig.json",
        }),
        externals({
            packagePath: ["./client/package.json"],
            include: ["vscode"],
        }),
        !watch && terser(),
    ],
};

// Config for the server
const server = {
    input: "./server/src/server.ts",
    output: [
        {
            file: "./server/out/server.js",
            format: "cjs",
            exports: "auto",
            sourcemap: true,
        },
    ],
    plugins: [
        ...common,
        typescript({
            tsconfig: "./server/tsconfig.json",
        }),
        externals({
            packagePath: ["./server/package.json"],
        }),
        alias({
            entries: [{ find: "css-tree", replacement: "./server/node_modules/css-tree/dist/csstree.esm.js" }],
        }),
        !watch && terser(),
    ],
};

export default [client, server];
