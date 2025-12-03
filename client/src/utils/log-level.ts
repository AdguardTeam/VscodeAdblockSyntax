/**
 * @file Utility functions for working with VSCode log levels.
 */

import { LogLevel } from 'vscode';

/**
 * Convert VSCode LogLevel to a simple boolean for AGLint debug mode.
 * Enable AGLint debugger only when VSCode log level is Debug or Trace.
 *
 * @param logLevel VSCode log level.
 *
 * @returns Whether AGLint debug mode should be enabled.
 */
export function shouldEnableAglintDebug(logLevel: LogLevel): boolean {
    // LogLevel enum: Off = 0, Trace = 1, Debug = 2, Info = 3, Warning = 4, Error = 5
    // Enable AGLint debug when log level is Trace (1) or Debug (2)
    // Off (0) should NOT enable debug
    return logLevel === LogLevel.Trace || logLevel === LogLevel.Debug;
}
