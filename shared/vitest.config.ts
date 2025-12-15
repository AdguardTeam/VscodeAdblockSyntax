import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        passWithNoTests: true,
        coverage: {
            include: [
                'src/**/*.ts',
            ],
        },
    },
});
