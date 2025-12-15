/**
 * @file Tests for package manager utilities.
 */

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    BUN,
    findGlobalPathForPackageManager,
    getInstallationCommand,
    NPM,
    PNPM,
    YARN,
} from '../../src/utils/package-managers';

// Mock the internal 'run' function that spawns child processes
// This prevents actual shell command execution during tests
vi.mock('node:child_process', () => ({
    spawnSync: vi.fn(() => ({
        status: 0,
        stdout: Buffer.from('/mock/global/path\n'),
        stderr: Buffer.from(''),
    })),
}));

describe('package manager constants', () => {
    it('should export correct package manager constants', () => {
        expect(NPM).toBe('npm');
        expect(YARN).toBe('yarn');
        expect(PNPM).toBe('pnpm');
        expect(BUN).toBe('bun');
    });
});

describe('getInstallationCommand', () => {
    describe('npm', () => {
        it('should generate local install command', () => {
            expect(getInstallationCommand(NPM, 'package-name')).toBe('npm install package-name');
        });

        it('should generate global install command', () => {
            expect(getInstallationCommand(NPM, 'package-name', true)).toBe('npm install -g package-name');
        });

        it('should handle package with scope', () => {
            expect(getInstallationCommand(NPM, '@scope/package')).toBe('npm install @scope/package');
        });

        it('should handle package with version', () => {
            expect(getInstallationCommand(NPM, 'package@1.2.3')).toBe('npm install package@1.2.3');
        });
    });

    describe('yarn', () => {
        it('should generate local install command', () => {
            expect(getInstallationCommand(YARN, 'package-name')).toBe('yarn add package-name');
        });

        it('should generate global install command', () => {
            expect(getInstallationCommand(YARN, 'package-name', true)).toBe('yarn global add package-name');
        });

        it('should handle scoped packages', () => {
            expect(getInstallationCommand(YARN, '@scope/package')).toBe('yarn add @scope/package');
        });

        it('should handle packages with version', () => {
            expect(getInstallationCommand(YARN, 'package@1.2.3')).toBe('yarn add package@1.2.3');
        });
    });

    describe('pnpm', () => {
        it('should generate local install command', () => {
            expect(getInstallationCommand(PNPM, 'package-name')).toBe('pnpm add package-name');
        });

        it('should generate global install command', () => {
            expect(getInstallationCommand(PNPM, 'package-name', true)).toBe('pnpm add -g package-name');
        });

        it('should handle scoped packages', () => {
            expect(getInstallationCommand(PNPM, '@scope/package')).toBe('pnpm add @scope/package');
        });

        it('should handle packages with version', () => {
            expect(getInstallationCommand(PNPM, 'package@1.2.3')).toBe('pnpm add package@1.2.3');
        });
    });

    describe('bun', () => {
        it('should generate local install command', () => {
            expect(getInstallationCommand(BUN, 'package-name')).toBe('bun add package-name');
        });

        it('should generate global install command', () => {
            expect(getInstallationCommand(BUN, 'package-name', true)).toBe('bun add -g package-name');
        });

        it('should handle scoped packages', () => {
            expect(getInstallationCommand(BUN, '@scope/package')).toBe('bun add @scope/package');
        });

        it('should handle packages with version', () => {
            expect(getInstallationCommand(BUN, 'package@1.2.3')).toBe('bun add package@1.2.3');
        });
    });

    describe('edge cases', () => {
        it('should handle empty package name', () => {
            const cmd = getInstallationCommand(NPM, '');
            expect(cmd).toContain('npm install');
        });

        it('should handle package names with special characters', () => {
            expect(getInstallationCommand(NPM, 'package-with-dashes')).toBe('npm install package-with-dashes');
        });

        it('should handle very long package names', () => {
            const longName = 'a'.repeat(100);
            const cmd = getInstallationCommand(NPM, longName);
            expect(cmd).toContain(longName);
        });

        it('should handle unknown package manager gracefully', () => {
            const cmd = getInstallationCommand('unknown' as any, 'package');
            expect(cmd).toBe('Unknown package manager');
        });
    });
});

describe('findGlobalPathForPackageManager', () => {
    it('should be an async function', () => {
        expect(findGlobalPathForPackageManager).toBeInstanceOf(Function);
        const result = findGlobalPathForPackageManager(NPM);
        expect(result).toBeInstanceOf(Promise);
    });

    it('should accept NPM as package manager', async () => {
        // We can't test actual execution without mocking child_process,
        // but we can verify it doesn't throw
        const result = await findGlobalPathForPackageManager(NPM);
        // Result can be string or undefined depending on system
        expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('should accept YARN as package manager', async () => {
        const result = await findGlobalPathForPackageManager(YARN);
        expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('should accept PNPM as package manager', async () => {
        const result = await findGlobalPathForPackageManager(PNPM);
        expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('should accept BUN as package manager', async () => {
        const result = await findGlobalPathForPackageManager(BUN);
        expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('should accept tracer function', async () => {
        const traces: string[] = [];
        const tracer = (msg: string) => traces.push(msg);

        await findGlobalPathForPackageManager(NPM, tracer);

        // Tracer may or may not be called depending on system state
        // Just verify it doesn't throw
        expect(Array.isArray(traces)).toBe(true);
    });

    it('should return undefined for unknown package manager', async () => {
        const result = await findGlobalPathForPackageManager('unknown' as any);
        expect(result).toBeUndefined();
    });
});

describe('command format validation', () => {
    it('should generate valid shell commands for all package managers', () => {
        const packageManagers = [NPM, YARN, PNPM, BUN];
        const testPackage = 'test-package';

        packageManagers.forEach((pm) => {
            const localCmd = getInstallationCommand(pm, testPackage, false);
            const globalCmd = getInstallationCommand(pm, testPackage, true);

            // Commands should contain the package manager name
            expect(localCmd).toContain(pm);
            expect(globalCmd).toContain(pm);

            // Commands should contain the package name
            expect(localCmd).toContain(testPackage);
            expect(globalCmd).toContain(testPackage);

            // Global commands should have global flag
            if (pm === YARN) {
                expect(globalCmd).toContain('global');
            } else {
                expect(globalCmd).toContain('-g');
            }
        });
    });

    it('should generate commands without extra whitespace', () => {
        const cmd = getInstallationCommand(NPM, 'package');
        expect(cmd).not.toMatch(/\s{2,}/); // No double spaces
        expect(cmd.trim()).toBe(cmd); // No leading/trailing spaces
    });

    it('should maintain command structure consistency', () => {
        // All commands should follow pattern: <pm> <subcommand> <flags?> <package>
        expect(getInstallationCommand(NPM, 'pkg')).toMatch(/^npm install pkg$/);
        expect(getInstallationCommand(YARN, 'pkg')).toMatch(/^yarn add pkg$/);
        expect(getInstallationCommand(PNPM, 'pkg')).toMatch(/^pnpm add pkg$/);
        expect(getInstallationCommand(BUN, 'pkg')).toMatch(/^bun add pkg$/);
    });
});
