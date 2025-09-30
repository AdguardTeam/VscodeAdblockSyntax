import { build } from 'plist';
import { parse } from 'yaml';

/**
 * Converts a YAML grammar file into a PList representation.
 *
 * @param yamlContent Raw YAML content from the grammar file.
 *
 * @returns PList representation of the grammar.
 *
 * @throws If the YAML content is syntactically invalid.
 */
export function convertYamlToPlist(yamlContent: string): string {
    // Parse the YAML content into a JavaScript object
    const grammar = parse(yamlContent);

    // Convert the JavaScript object into a PList representation
    return build(grammar);
}
