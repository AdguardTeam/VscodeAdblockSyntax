/**
 * @file Utility functions for parsing and handling AGLint status notifications.
 */

import * as v from 'valibot';

/**
 * Schema for the server notification parameters.
 * Allow undefined / null payloads to act as "neutral" updates.
 */
const notificationSchema = v.object({
    error: v.optional(v.unknown()),
    aglintEnabled: v.optional(v.boolean()),
});

export type AglintStatus = v.InferInput<typeof notificationSchema>;

/**
 * Parse incoming server params; tolerate undefined/null.
 *
 * @param params Params to parse.
 *
 * @returns Parsed status.
 */
export function parseStatusParams(params: unknown): AglintStatus {
    const schema = v.union([notificationSchema, v.undefined(), v.null()]);
    const parsed = v.safeParse(schema, params);

    if (!parsed.success) {
        return {};
    }

    return (parsed.output ?? {});
}
