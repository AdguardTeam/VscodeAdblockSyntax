/**
 * @file Linting cache management.
 */

import { type Diagnostic, LRUCache } from 'vscode-languageserver/node';

/**
 * Maximum number of entries in the LRU cache.
 */
const CACHE_MAX_ENTRIES = 100;

/**
 * Create a cache key for linting results.
 *
 * @param uri Document URI.
 * @param aglintVersion AGLint version.
 * @param documentVersion Document version (incremented on each change).
 * @param configHash Hash of the linter config.
 *
 * @returns Cache key.
 */
export function createLintCacheKey(
    uri: string,
    aglintVersion: string,
    documentVersion: number,
    configHash: string,
): string {
    return `${uri}:${aglintVersion}:${documentVersion}:${configHash}`;
}

/**
 * Cache for linting results using LRU eviction strategy.
 */
export class LintingCache {
    /**
     * Internal LRU cache.
     */
    private cache: LRUCache<string, Diagnostic[]>;

    /**
     * Creates a new linting cache.
     */
    constructor() {
        this.cache = new LRUCache<string, Diagnostic[]>(CACHE_MAX_ENTRIES);
    }

    /**
     * Get cached diagnostics.
     *
     * @param key Cache key.
     *
     * @returns Cached diagnostics or undefined.
     */
    public get(key: string): Diagnostic[] | undefined {
        return this.cache.get(key);
    }

    /**
     * Set cached diagnostics.
     *
     * @param key Cache key.
     * @param diagnostics Diagnostics to cache.
     */
    public set(key: string, diagnostics: Diagnostic[]): void {
        this.cache.set(key, diagnostics);
    }

    /**
     * Clear the cache.
     */
    public clear(): void {
        this.cache.clear();
    }
}
