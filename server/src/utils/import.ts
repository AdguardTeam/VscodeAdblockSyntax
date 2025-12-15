/**
 * Helper function to import the module dynamically.
 *
 * @param path Path to the module.
 *
 * @returns Loaded module.
 *
 * @throws If the module cannot be found.
 */
export const importModule = async (path: string): Promise<any> => {
    const module = await import(/* webpackIgnore: true */ path);

    // Module may have a default export
    if ('default' in module) {
        return module.default;
    }

    return module;
};
