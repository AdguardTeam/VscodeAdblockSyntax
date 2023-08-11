import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    testTimeout: 30000,
    testMatch: ['**/test/**/*.test.ts'],
    // Speed up tests by using SWC instead of Babel
    transform: { '.ts': '@swc/jest' },
};

export default config;
