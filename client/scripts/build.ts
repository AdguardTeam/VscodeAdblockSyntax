import * as esbuild from 'esbuild';

const args = process.argv.slice(2);

const buildOptions: esbuild.BuildOptions = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outdir: 'out',
    platform: 'node',
    // TODO: Switch to ESM, once https://github.com/microsoft/vscode/issues/130367 is fixed
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    external: [
        'vscode',
    ],
    logLevel: 'info',
    minify: args.includes('--minify'),
};

if (args.includes('--watch')) {
    const buildContext = await esbuild.context(buildOptions);
    buildContext.watch();
} else {
    await esbuild.build(buildOptions);
}
