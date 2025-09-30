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

if (!pkg.version) {
    throw new Error('Missing required field "version" in package.json');
}

const main = (): void => {
    const content = `version=${pkg.version}`;

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
