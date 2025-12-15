// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        coverage: {
            include: [
                'src/**/*.ts',
            ],
        },
        alias: {
            // Mock the vscode module for testing
            vscode: new URL('./tests/__mocks__/vscode.ts', import.meta.url).pathname,
        },
    },
});
