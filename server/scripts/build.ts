import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

const common: esbuild.BuildOptions = {
    bundle: true,
    outdir: 'out',
    platform: 'node',
    // TODO: Switch to ESM, once https://github.com/microsoft/vscode/issues/130367 is fixed
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    sourcemap: true,
    logLevel: 'info',
    minify: args.includes('--minify'),
};

const agtreeBuildOptions: esbuild.BuildOptions = {
    ...common,
    entryPoints: {
        agtree: '@adguard/agtree',
    },
};

const ecssTreeBuildOptions: esbuild.BuildOptions = {
    ...common,
    platform: 'browser',
    entryPoints: {
        'ecss-tree': '@adguard/ecss-tree',
    },
};

const aglintBuildOptions: esbuild.BuildOptions = {
    ...common,
    entryPoints: {
        aglint: '@adguard/aglint',
    },
    alias: {
        '@adguard/agtree': './agtree.cjs',
        '@adguard/ecss-tree': './ecss-tree.cjs',
    },
    external: [
        './agtree.cjs',
        './ecss-tree.cjs',
    ],
};

const serverBuildOptions: esbuild.BuildOptions = {
    ...common,
    entryPoints: {
        server: 'src/server.ts',
    },
    alias: {
        '@adguard/agtree': './agtree.cjs',
        '@adguard/ecss-tree': './ecss-tree.cjs',
        '@adguard/aglint': './aglint.cjs',
    },
    external: [
        'vscode-languageserver',
        'vscode-languageserver-textdocument',
        './agtree.cjs',
        './ecss-tree.cjs',
        './aglint.cjs',
    ],
};

if (isWatch) {
    const ctxAgtree = await esbuild.context(agtreeBuildOptions);
    const ctxEcssTree = await esbuild.context(ecssTreeBuildOptions);
    const ctxAglint = await esbuild.context(aglintBuildOptions);
    const ctxServer = await esbuild.context(serverBuildOptions);

    await Promise.all([
        ctxAgtree.watch(),
        ctxEcssTree.watch(),
        ctxAglint.watch(),
        ctxServer.watch(),
    ]);
} else {
    await esbuild.build(agtreeBuildOptions);
    await esbuild.build(ecssTreeBuildOptions);
    await esbuild.build(aglintBuildOptions);
    await esbuild.build(serverBuildOptions);
}
