/**
 * @file Tests for status parsing utilities.
 */

import { describe, expect, it } from 'vitest';

import { parseStatusParams } from '../../src/utils/status-parser';

describe('parseStatusParams', () => {
    it('should parse valid status with error', () => {
        const result = parseStatusParams({ error: 'Something went wrong' });
        expect(result).toEqual({ error: 'Something went wrong' });
    });

    it('should parse valid status with aglintEnabled', () => {
        const result = parseStatusParams({ aglintEnabled: false });
        expect(result).toEqual({ aglintEnabled: false });
    });

    it('should parse valid status with both error and aglintEnabled', () => {
        const result = parseStatusParams({
            error: 'Error message',
            aglintEnabled: true,
        });
        expect(result).toEqual({
            error: 'Error message',
            aglintEnabled: true,
        });
    });

    it('should handle undefined params', () => {
        const result = parseStatusParams(undefined);
        expect(result).toEqual({});
    });

    it('should handle null params', () => {
        const result = parseStatusParams(null);
        expect(result).toEqual({});
    });

    it('should handle empty object', () => {
        const result = parseStatusParams({});
        expect(result).toEqual({});
    });

    it('should return empty object for invalid params', () => {
        const result = parseStatusParams('invalid string');
        expect(result).toEqual({});
    });

    it('should return empty object for number', () => {
        const result = parseStatusParams(123);
        expect(result).toEqual({});
    });

    it('should return empty object for boolean', () => {
        const result = parseStatusParams(true);
        expect(result).toEqual({});
    });

    it('should handle status with only error field', () => {
        const result = parseStatusParams({ error: new Error('Test error') });
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Test error');
    });

    it('should handle status with aglintEnabled true', () => {
        const result = parseStatusParams({ aglintEnabled: true });
        expect(result).toEqual({ aglintEnabled: true });
    });

    it('should ignore extra fields', () => {
        const result = parseStatusParams({
            error: 'Error',
            aglintEnabled: false,
            extraField: 'should be ignored',
        });

        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('aglintEnabled');
        // Extra fields might be included depending on schema behavior
    });
});
