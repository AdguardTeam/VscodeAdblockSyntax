/**
 * @file Tests for diagnostic conversion utilities.
 */

import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver/node';

import { convertAglintPositionToVscodeRange, convertLinterResultToDiagnostics } from './diagnostics';

describe('convertAglintPositionToVscodeRange', () => {
    it('should convert AGLint 1-based positions to VSCode 0-based positions', () => {
        const aglintRange = {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 5 },
        };

        const vscodeRange = convertAglintPositionToVscodeRange(aglintRange);

        expect(vscodeRange.start.line).toBe(0); // 1 - 1 = 0
        expect(vscodeRange.start.character).toBe(0);
        expect(vscodeRange.end.line).toBe(0); // 1 - 1 = 0
        expect(vscodeRange.end.character).toBe(5);
    });

    it('should handle multi-line ranges', () => {
        const aglintRange = {
            start: { line: 5, column: 10 },
            end: { line: 8, column: 20 },
        };

        const vscodeRange = convertAglintPositionToVscodeRange(aglintRange);

        expect(vscodeRange.start.line).toBe(4); // 5 - 1
        expect(vscodeRange.start.character).toBe(10);
        expect(vscodeRange.end.line).toBe(7); // 8 - 1
        expect(vscodeRange.end.character).toBe(20);
    });

    it('should handle zero-column positions', () => {
        const aglintRange = {
            start: { line: 10, column: 0 },
            end: { line: 10, column: 0 },
        };

        const vscodeRange = convertAglintPositionToVscodeRange(aglintRange);

        expect(vscodeRange.start.line).toBe(9); // 10 - 1
        expect(vscodeRange.start.character).toBe(0);
        expect(vscodeRange.end.line).toBe(9);
        expect(vscodeRange.end.character).toBe(0);
    });
});

describe('convertLinterResultToDiagnostics', () => {
    const mockAglintContext = {
        aglint: {
            linter: {
                LinterRuleSeverity: {
                    Warning: 1,
                    Error: 2,
                },
            },
        },
    } as any;

    it('should convert AGLint problems to VSCode diagnostics', () => {
        const linterResult = {
            problems: [
                {
                    ruleId: 'test-rule',
                    message: 'Test error message',
                    severity: 2, // Error
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 10 },
                    },
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toBe('Test error message');
        expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
        expect(diagnostics[0].source).toBe('aglint');
        expect(diagnostics[0].code).toBe('test-rule');
    });

    it('should convert warning severity correctly', () => {
        const linterResult = {
            problems: [
                {
                    message: 'Warning message',
                    severity: 1, // Warning
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                },
            ],
            metadata: {},
            warningCount: 1,
            errorCount: 0,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Warning);
    });

    it('should include code description with documentation URL', () => {
        const linterResult = {
            problems: [
                {
                    ruleId: 'test-rule',
                    message: 'Test error',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                },
            ],
            metadata: {
                'test-rule': {
                    docs: {
                        url: 'https://example.com/rules/test-rule',
                    },
                },
            },
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].codeDescription).toEqual({
            href: 'https://example.com/rules/test-rule',
        });
    });

    it('should not include code description if URL is missing', () => {
        const linterResult = {
            problems: [
                {
                    ruleId: 'test-rule',
                    message: 'Test error',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].codeDescription).toBeUndefined();
    });

    it('should attach fix data when available', () => {
        const fixCommand = {
            range: [0, 10],
            text: 'fixed text',
        };

        const linterResult = {
            problems: [
                {
                    message: 'Test error',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                    fix: fixCommand,
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].data).toEqual({ fix: fixCommand });
    });

    it('should attach suggestions data when available', () => {
        const suggestions = [
            { desc: 'Suggestion 1', fix: { range: [0, 5], text: 'fix1' } },
            { desc: 'Suggestion 2', fix: { range: [0, 5], text: 'fix2' } },
        ];

        const linterResult = {
            problems: [
                {
                    message: 'Test error',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                    suggestions,
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].data).toEqual({ suggestions });
    });

    it('should attach both fix and suggestions when available', () => {
        const fix = { range: [0, 10], text: 'fixed' };
        const suggestions = [{ desc: 'Suggestion', fix: { range: [0, 5], text: 'fix' } }];

        const linterResult = {
            problems: [
                {
                    message: 'Test error',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                    fix,
                    suggestions,
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].data).toEqual({ fix, suggestions });
    });

    it('should handle empty problems array', () => {
        const linterResult = {
            problems: [],
            metadata: {},
            warningCount: 0,
            errorCount: 0,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics).toEqual([]);
    });

    it('should handle multiple problems', () => {
        const linterResult = {
            problems: [
                {
                    message: 'Error 1',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                },
                {
                    message: 'Error 2',
                    severity: 1,
                    position: {
                        start: { line: 2, column: 0 },
                        end: { line: 2, column: 5 },
                    },
                },
                {
                    message: 'Error 3',
                    severity: 2,
                    position: {
                        start: { line: 3, column: 0 },
                        end: { line: 3, column: 5 },
                    },
                },
            ],
            metadata: {},
            warningCount: 1,
            errorCount: 2,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics).toHaveLength(3);
        expect(diagnostics[0].message).toBe('Error 1');
        expect(diagnostics[1].message).toBe('Error 2');
        expect(diagnostics[2].message).toBe('Error 3');
    });

    it('should handle problems without ruleId', () => {
        const linterResult = {
            problems: [
                {
                    message: 'Error without rule',
                    severity: 2,
                    position: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 5 },
                    },
                },
            ],
            metadata: {},
            warningCount: 0,
            errorCount: 1,
            fatalErrorCount: 0,
        };

        const diagnostics = convertLinterResultToDiagnostics(linterResult, mockAglintContext);

        expect(diagnostics[0].code).toBeUndefined();
    });
});
