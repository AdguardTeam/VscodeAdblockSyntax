import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        setupFiles: [
            './test/setup/custom-matchers/index.ts',
        ],
        watch: false,
    },
});
