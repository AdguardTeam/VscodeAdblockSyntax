/**
 * @file Custom types for Vitest to extend `expect` function with custom matchers.
 *
 * @see https://vitest.dev/guide/extending-matchers#extending-matchers
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitest';

import { type ToBeTokenizedProperly } from '../test/setup/custom-matchers/expect-tokenization';

// Note: first argument is passed to `expect`, so we need to remove it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RemoveFirstArg<T> = T extends (arg0: any, ...args: infer U) => infer R ? (...args: U) => R : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CustomMatchers<R = unknown> {
    toBeTokenizedProperly: RemoveFirstArg<ToBeTokenizedProperly>;
}

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-explicit-any
    interface Assertion<T = any> extends CustomMatchers<T> {}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
