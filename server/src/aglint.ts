/**
 * @file Integrated version of AGLint
 *
 * In this file, we simply re-export the AGLint API from the @adguard/aglint
 * package, which is a dev dependency of this server package, so we simply call
 * it "integrated" / "bundled" version.
 *
 * We always make a separate bundle for this file, so the server bundle can
 * import it as a fallback if it doesn't found any other AGLint installation
 * with module finder.
 */

export * from '@adguard/aglint';
