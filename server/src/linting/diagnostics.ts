/**
 * @file Diagnostic conversion utilities - converts AGLint results to VSCode diagnostics.
 */

import type { LinterPositionRange, LinterResult } from '@adguard/aglint/linter';
import {
    type Diagnostic,
    DiagnosticSeverity,
    Position,
    Range,
} from 'vscode-languageserver/node';

import type { AglintContext } from '../context/aglint-context';

/**
 * Convert AGLint position range to VSCode range.
 *
 * @param range AGLint position range.
 *
 * @returns VSCode range.
 */
export function convertAglintPositionToVscodeRange(range: LinterPositionRange): Range {
    // Note: AGLint uses 1-based line numbers, but VSCode uses 0-based line numbers
    return Range.create(
        Position.create(range.start.line - 1, range.start.column),
        Position.create(range.end.line - 1, range.end.column),
    );
}

/**
 * Get the rule documentation URL from the linter result.
 *
 * @param ruleId Rule ID.
 * @param linterResult Linter result.
 *
 * @returns Rule documentation URL or undefined if not found.
 */
function getRuleDocumentationUrl(ruleId: string, linterResult: LinterResult): string | undefined {
    if (!linterResult.metadata) {
        return undefined;
    }

    return linterResult.metadata[ruleId]?.docs?.url;
}

/**
 * Convert AGLint result to VSCode diagnostics.
 *
 * @param linterResult Linter result.
 * @param aglintContext AGLint context.
 *
 * @returns VSCode diagnostics.
 */
export function convertLinterResultToDiagnostics(
    linterResult: LinterResult,
    aglintContext: AglintContext,
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const problem of linterResult.problems) {
        const severity = problem.severity === aglintContext.aglint.linter.LinterRuleSeverity.Warning
            ? DiagnosticSeverity.Warning
            : DiagnosticSeverity.Error;

        const diagnostic: Diagnostic = {
            severity,
            range: convertAglintPositionToVscodeRange(problem.position),
            message: problem.message,
            source: 'aglint',
        };

        // Add permalink to the rule documentation
        if (problem.ruleId) {
            diagnostic.code = problem.ruleId;
            const href = getRuleDocumentationUrl(problem.ruleId, linterResult);
            if (href) {
                diagnostic.codeDescription = {
                    href,
                };
            }
        }

        // Attach fix and suggestions data for code actions
        if (problem.fix || problem.suggestions) {
            diagnostic.data = {};

            if (problem.fix) {
                diagnostic.data.fix = problem.fix;
            }

            if (problem.suggestions) {
                diagnostic.data.suggestions = problem.suggestions;
            }
        }

        diagnostics.push(diagnostic);
    }

    return diagnostics;
}
