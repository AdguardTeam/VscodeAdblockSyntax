<!-- omit in toc -->
# Development Guide — syntaxes

Developer guide for the `@vscode-adblock-syntax/syntaxes` package: the TextMate
grammar source for adblock filter syntax, its compiler, and its tokenization
tests.

This is part of a monorepo. For environment setup and repo-wide commands, start
with the root [DEVELOPMENT.md](../DEVELOPMENT.md). For code guidelines and
architecture, see [AGENTS.md](AGENTS.md).

<!-- omit in toc -->
## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
    - [Build](#build)
    - [Test](#test)
    - [Lint](#lint)
    - [Type check](#type-check)
- [Common Tasks](#common-tasks)
    - [Updating the grammar](#updating-the-grammar)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

This package owns the syntax-highlighting grammar. The grammar is authored in
YAML ([adblock.yaml-tmlanguage](adblock.yaml-tmlanguage)) and compiled to a
TextMate PList (`out/adblock.plist`) that the root extension contributes to
VSCode (and that GitHub Linguist uses). It also provides a tokenization test
harness that loads the real grammar with `vscode-textmate` + `vscode-oniguruma`
and asserts token scopes for sample rules. All dependencies are build/test-only.

## Prerequisites

Node.js v22, pnpm v10, Git. See the root
[Prerequisites](../DEVELOPMENT.md#prerequisites). Run `pnpm install` once from
the repository root.

## Getting Started

Build the grammar so the compiled `out/adblock.plist` exists (the tokenization
tests load it):

```bash
pnpm --filter @vscode-adblock-syntax/syntaxes build
```

To preview highlighting visually, open the [test/static](../test/static) folder
in the Extension Development Host (`F5` from the repo root).

## Development Workflow

Run these from this directory, or from the repo root with the
`--filter @vscode-adblock-syntax/syntaxes` flag.

### Build

```bash
pnpm --filter @vscode-adblock-syntax/syntaxes build           # tsx scripts/build.ts (YAML -> PList)
pnpm --filter @vscode-adblock-syntax/syntaxes build -- --watch # incremental rebuilds
```

The `prebuild` script clears `out/` first. Never hand-edit the generated PList —
edit the YAML source and rebuild.

### Test

```bash
pnpm --filter @vscode-adblock-syntax/syntaxes test    # Vitest tokenization tests
```

Tokenization tests live in [test/adblock/](test/adblock), grouped by rule
category (comments, cosmetic, network). They tokenize sample rules with the real
grammar and assert scopes via the custom `expect-tokenization` matcher in
[test/setup/custom-matchers](test/setup/custom-matchers). Build the grammar
before running tests.

### Lint

```bash
pnpm --filter @vscode-adblock-syntax/syntaxes lint        # ESLint + markdownlint
pnpm --filter @vscode-adblock-syntax/syntaxes lint:code   # ESLint (add -- --fix)
pnpm --filter @vscode-adblock-syntax/syntaxes lint:md     # markdownlint
```

### Type check

```bash
pnpm --filter @vscode-adblock-syntax/syntaxes exec tsc --noEmit
```

## Common Tasks

### Updating the grammar

1. Edit the grammar in [adblock.yaml-tmlanguage](adblock.yaml-tmlanguage).
2. Add or modify example rules under [test/static/rules](../test/static/rules)
    (link related GitHub issues in the rule files).
3. Rebuild the grammar, then add or update tokenization tests under
    [test/adblock/](test/adblock) and run the test command above.
4. Open the [test/static](../test/static) folder in the Extension Development
    Host to verify highlighting visually.

You can also experiment with the grammar on the
[online TextMate test page](https://novalightshow.netlify.app/).

> The grammar's scope name (`text.adblock`), output path
> (`syntaxes/out/adblock.plist`), and embedded-language mapping are wired up in
> the root [package.json](../package.json) `contributes.grammars`. Update that
> manifest if scope names or output paths change.

## Troubleshooting

- **Tests fail to load the grammar**: run the build first; tests load the
    compiled `out/adblock.plist`.
- **Build fails with a YAML error**: the build validates the source and reports a
    located error (e.g. `file:line:col`); fix the YAML at that position.
- **Highlighting looks wrong in the host**: rebuild the grammar and reload the
    Extension Development Host window.

## Additional Resources

- Root guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
- Code guidelines: [AGENTS.md](AGENTS.md)
- Related package: [tools](../tools/DEVELOPMENT.md)
- [VSCode Syntax Highlight Guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [Online test page for TextMate grammars](https://novalightshow.netlify.app/)
