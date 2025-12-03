/**
 * @file Tests for extension constants.
 */

import { describe, expect, it } from 'vitest';

import {
    CLIENT_ID,
    CLIENT_NAME,
    CONFIG_FILE_NAMES,
    IGNORE_FILE_NAME,
    LANGUAGE_ID,
    STATUS_BAR_PRIORITY,
    SUPPORTED_FILE_EXTENSIONS,
} from '../src/constants';

describe('Extension Constants', () => {
    describe('SUPPORTED_FILE_EXTENSIONS', () => {
        it('should include txt extension', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.has('txt')).toBe(true);
        });

        it('should include adblock extension', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.has('adblock')).toBe(true);
        });

        it('should include ublock extension', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.has('ublock')).toBe(true);
        });

        it('should include adguard extension', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.has('adguard')).toBe(true);
        });

        it('should not include unsupported extensions', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.has('js')).toBe(false);
            expect(SUPPORTED_FILE_EXTENSIONS.has('ts')).toBe(false);
            expect(SUPPORTED_FILE_EXTENSIONS.has('json')).toBe(false);
        });

        it('should have exactly 4 supported extensions', () => {
            expect(SUPPORTED_FILE_EXTENSIONS.size).toBe(4);
        });
    });

    describe('CONFIG_FILE_NAMES', () => {
        it('should include aglint.config.json', () => {
            expect(CONFIG_FILE_NAMES.has('aglint.config.json')).toBe(true);
        });

        it('should include aglint.config.yaml', () => {
            expect(CONFIG_FILE_NAMES.has('aglint.config.yaml')).toBe(true);
        });

        it('should include aglint.config.yml', () => {
            expect(CONFIG_FILE_NAMES.has('aglint.config.yml')).toBe(true);
        });

        it('should include .aglintrc', () => {
            expect(CONFIG_FILE_NAMES.has('.aglintrc')).toBe(true);
        });

        it('should include .aglintrc.json', () => {
            expect(CONFIG_FILE_NAMES.has('.aglintrc.json')).toBe(true);
        });

        it('should include .aglintrc.yaml', () => {
            expect(CONFIG_FILE_NAMES.has('.aglintrc.yaml')).toBe(true);
        });

        it('should include .aglintrc.yml', () => {
            expect(CONFIG_FILE_NAMES.has('.aglintrc.yml')).toBe(true);
        });

        it('should not include random config files', () => {
            expect(CONFIG_FILE_NAMES.has('random.json')).toBe(false);
            expect(CONFIG_FILE_NAMES.has('config.yaml')).toBe(false);
        });

        it('should have exactly 7 config file names', () => {
            expect(CONFIG_FILE_NAMES.size).toBe(7);
        });
    });

    describe('IGNORE_FILE_NAME', () => {
        it('should be .aglintignore', () => {
            expect(IGNORE_FILE_NAME).toBe('.aglintignore');
        });
    });

    describe('LANGUAGE_ID', () => {
        it('should be adblock', () => {
            expect(LANGUAGE_ID).toBe('adblock');
        });
    });

    describe('CLIENT_ID', () => {
        it('should be aglint', () => {
            expect(CLIENT_ID).toBe('aglint');
        });
    });

    describe('CLIENT_NAME', () => {
        it('should be AGLint', () => {
            expect(CLIENT_NAME).toBe('AGLint');
        });
    });

    describe('STATUS_BAR_PRIORITY', () => {
        it('should be a positive number', () => {
            expect(STATUS_BAR_PRIORITY).toBeGreaterThan(0);
        });

        it('should be within typical range (0-200)', () => {
            expect(STATUS_BAR_PRIORITY).toBeLessThanOrEqual(200);
        });

        it('should be 100', () => {
            expect(STATUS_BAR_PRIORITY).toBe(100);
        });
    });
});
