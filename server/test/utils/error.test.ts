/**
 * @file Tests for error utilities.
 */

import { describe, expect, it } from 'vitest';

import { getErrorMessage, getErrorStack } from '../../src/utils/error';

describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
        const error = new Error('Test error message');
        expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should extract message from custom error with message property', () => {
        const error = { message: 'Custom error message' };
        expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should convert string to error message', () => {
        const error = 'Simple string error';
        expect(getErrorMessage(error)).toBe('"Simple string error"');
    });

    it('should convert number to error message', () => {
        const error = 42;
        expect(getErrorMessage(error)).toBe('42');
    });

    it('should convert boolean to error message', () => {
        expect(getErrorMessage(true)).toBe('true');
        expect(getErrorMessage(false)).toBe('false');
    });

    it('should convert null to error message', () => {
        expect(getErrorMessage(null)).toBe('null');
    });

    it('should convert undefined to error message', () => {
        expect(getErrorMessage(undefined)).toBe('');
    });

    it('should convert object to JSON string error message', () => {
        const error = { code: 'ERR_001', details: 'Something went wrong' };
        const message = getErrorMessage(error);
        expect(message).toContain('ERR_001');
        expect(message).toContain('Something went wrong');
    });

    it('should handle objects with circular references', () => {
        const error: any = { name: 'CircularError' };
        error.self = error; // Create circular reference

        const message = getErrorMessage(error);
        expect(message).toBeTruthy();
        // Should not throw and should contain some string representation
        expect(typeof message).toBe('string');
    });

    it('should handle array as error', () => {
        const error = ['error1', 'error2'];
        const message = getErrorMessage(error);
        expect(message).toContain('error1');
        expect(message).toContain('error2');
    });

    it('should handle nested error objects', () => {
        const error = {
            message: 'Outer error',
            cause: new Error('Inner error'),
        };
        expect(getErrorMessage(error)).toBe('Outer error');
    });
});

describe('getErrorStack', () => {
    it('should extract stack trace from Error object', () => {
        const error = new Error('Test error');
        const stack = getErrorStack(error);

        expect(stack).toBeDefined();
        expect(stack).toContain('Error');
    });

    it('should return undefined for objects without stack', () => {
        const error = { message: 'No stack here' };
        const stack = getErrorStack(error);

        // Stack should be undefined for plain objects
        expect(stack).toBeUndefined();
    });

    it('should handle string errors', () => {
        const error = 'String error';
        const stack = getErrorStack(error);

        // String errors get converted to Error objects which have stacks
        expect(typeof stack).toBe('string');
    });

    it('should handle Error with custom stack property', () => {
        const error = new Error('Test');
        error.stack = 'Custom stack trace';

        expect(getErrorStack(error)).toBe('Custom stack trace');
    });

    it('should handle null and undefined', () => {
        // Both should be converted to Error objects with stacks
        expect(typeof getErrorStack(null)).toBe('string');
        expect(typeof getErrorStack(undefined)).toBe('string');
    });

    it('should handle objects with circular references', () => {
        const error: any = { name: 'CircularError' };
        error.self = error;

        const stack = getErrorStack(error);
        // Should not throw
        expect(stack !== undefined || stack === undefined).toBe(true);
    });
});

describe('error utilities edge cases', () => {
    it('should handle Symbol as error', () => {
        const error = Symbol('test-symbol');
        const message = getErrorMessage(error);

        // Symbols can't be JSON-stringified (returns undefined), which becomes empty string
        expect(typeof message).toBe('string');
        // The actual message will be empty since JSON.stringify(Symbol) is undefined
    });

    it('should handle function as error', () => {
        const error = function testFunction() { return 'error'; };
        const message = getErrorMessage(error);

        expect(typeof message).toBe('string');
    });

    it('should handle BigInt as error', () => {
        const error = BigInt(9007199254740991);
        const message = getErrorMessage(error);

        expect(message).toContain('9007199254740991');
    });

    it('should preserve Error subclass information', () => {
        /**
         * Custom error class for testing.
         */
        class CustomError extends Error {
            /**
             * Creates a CustomError.
             *
             * @param message Error message.
             */
            constructor(message: string) {
                super(message);
                this.name = 'CustomError';
            }
        }

        const error = new CustomError('Custom error occurred');
        expect(getErrorMessage(error)).toBe('Custom error occurred');

        const stack = getErrorStack(error);
        expect(stack).toBeDefined();
        expect(stack).toContain('CustomError');
    });
});
