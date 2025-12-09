import * as esbuild from 'esbuild';

const args = process.argv.slice(2);

const buildOptions: esbuild.BuildOptions = {
    entryPoints: ['src/**/*.ts'],
    bundle: false, // Keep file structure matching .d.ts files
    outdir: 'out',
    platform: 'node',
    // TODO: Switch to ESM, once https://github.com/microsoft/vscode/issues/130367 is fixed
    format: 'cjs',
    logLevel: 'info',
    minify: args.includes('--minify'),
};

const main = async () => {
    if (args.includes('--watch')) {
        const buildContext = await esbuild.context(buildOptions);
        buildContext.watch();
    } else {
        await esbuild.build(buildOptions);
    }
};

main();
