import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,
    testTimeout: 30000,
    testMatch: ['**/test/**/*.test.ts'],
};

export default config;
