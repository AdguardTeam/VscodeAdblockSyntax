/**
 * @file Output the version number to a build.txt file.
 */
import fs from 'node:fs';
import path from 'node:path';

const UPPER_LEVEL = '../';

const OUTPUT_FOLDER_NAME = 'out';
const OUTPUT_FILE_NAME = 'build.txt';
const PKG_FILE_NAME = 'package.json';

// Computed constants
const outputFolderLocation = path.join(__dirname, UPPER_LEVEL, OUTPUT_FOLDER_NAME);
const pkgFileLocation = path.join(__dirname, UPPER_LEVEL, PKG_FILE_NAME);

// Read package.json
const pkg = JSON.parse(fs.readFileSync(pkgFileLocation, 'utf-8'));

// package.json intentionally has no "version" field in the repository —
// CI injects the release version before packaging. Local/dev builds fall
// back to a placeholder so this helper still works without CI injection.
const pkgVersion = typeof pkg.version === 'string' && pkg.version.length > 0
    ? pkg.version
    : '0.0.0-dev';

const main = (): void => {
    const content = `version=${pkgVersion}`;

    // Create the output folder if it doesn't exist
    if (!fs.existsSync(outputFolderLocation)) {
        fs.mkdirSync(outputFolderLocation);
    }

    // Write the output file
    const file = path.resolve(outputFolderLocation, OUTPUT_FILE_NAME);
    fs.writeFileSync(file, content);

    // eslint-disable-next-line no-console
    console.log(`Wrote ${content} to ${file} was successful`);
};

main();
