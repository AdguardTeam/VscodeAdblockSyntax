/**
 * @file Tests for log-level utility functions.
 */

import { describe, expect, it } from 'vitest';
import { LogLevel } from 'vscode';

import { shouldEnableAglintDebug } from '../../src/utils/log-level';

describe('shouldEnableAglintDebug', () => {
    it('should enable debug for Trace level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Trace)).toBe(true);
    });

    it('should enable debug for Debug level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Debug)).toBe(true);
    });

    it('should disable debug for Info level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Info)).toBe(false);
    });

    it('should disable debug for Warning level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Warning)).toBe(false);
    });

    it('should disable debug for Error level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Error)).toBe(false);
    });

    it('should disable debug for Off level', () => {
        expect(shouldEnableAglintDebug(LogLevel.Off)).toBe(false);
    });

    it('should handle boundary case correctly', () => {
        // LogLevel.Debug is the boundary - should be true
        expect(shouldEnableAglintDebug(LogLevel.Debug)).toBe(true);

        // LogLevel.Info is just above - should be false
        expect(shouldEnableAglintDebug(LogLevel.Info)).toBe(false);
    });
});
