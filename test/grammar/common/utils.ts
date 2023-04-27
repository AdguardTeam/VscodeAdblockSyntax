/**
 * Checks if two arrays are equal
 *
 * @param a First array
 * @param b Second array
 * @returns `true` if the arrays are equal, `false` otherwise
 */
export function isArraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}
