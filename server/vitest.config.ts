import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        coverage: {
            include: [
                'src/**/*.ts',
            ],
        },
    },
});
