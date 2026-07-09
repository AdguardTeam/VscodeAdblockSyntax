<!-- omit in toc -->
# Development Guide — client

Developer guide for the `@vscode-adblock-syntax/client` package: the VSCode
extension entry point and Language Server Protocol (LSP) client.

This is part of a monorepo. For environment setup, the debug workflow, and
repo-wide commands, start with the root [DEVELOPMENT.md](../DEVELOPMENT.md). For
code guidelines and architecture, see [AGENTS.md](AGENTS.md).

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
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

The client is the VSCode-facing half of the extension. It activates the
extension, creates one language client (and a separate server process) per
outermost workspace folder, manages their lifecycle, mirrors AGLint status in
the status bar, and forwards document/configuration events to the server over
LSP. It holds **all** direct VSCode API access; linting logic lives in the
[server](../server/DEVELOPMENT.md). It is built with Rspack; the root
`package.json` `main` field points to `./client/out/extension`.

## Prerequisites

Same as the repo: Node.js v22, pnpm v10, VSCode `^1.74.0`, Git. See the root
[Prerequisites](../DEVELOPMENT.md#prerequisites). Run `pnpm install` once from
the repository root to install dependencies for all packages.

## Getting Started

The client cannot be exercised in isolation — run it through the extension debug
host:

1. Open the repository **root** in VSCode.
2. Press `F5` (Launch Client) to start the watch builds and open the Extension
    Development Host.
3. Reload the host window (`Cmd/Ctrl + R`) after changing client code.

See [Running the extension in development mode](../DEVELOPMENT.md#running-the-extension-in-development-mode).

## Development Workflow

Run these from this directory, or from the repo root with the
`--filter @vscode-adblock-syntax/client` flag.

### Build

```bash
pnpm --filter @vscode-adblock-syntax/client build   # Rspack -> client/out
```

The `prebuild` script clears `out/` first. Add `--watch` (or use the VSCode
watch task) for incremental rebuilds during debugging.

### Test

```bash
pnpm --filter @vscode-adblock-syntax/client test    # Vitest
```

Tests live in [tests/](tests) and mirror `src/`. The VSCode API is mocked in
[tests/\_\_mocks\_\_/vscode.ts](tests/__mocks__/vscode.ts); pure helpers
(`workspace-folders`, `log-level`, `status-parser`) are tested directly.

### Lint

```bash
pnpm --filter @vscode-adblock-syntax/client lint        # ESLint + markdownlint
pnpm --filter @vscode-adblock-syntax/client lint:code   # ESLint (add -- --fix)
pnpm --filter @vscode-adblock-syntax/client lint:md     # markdownlint
```

### Type check

```bash
pnpm --filter @vscode-adblock-syntax/client exec tsc --noEmit
```

## Common Tasks

- **Add a pure helper**: place it under `src/utils/`, keep it free of VSCode API
    calls so it stays unit-testable, and add a matching test under `tests/utils/`.
- **Change client/server messages**: update the LSP wiring in
    [src/extension.ts](src/extension.ts) and keep the contract in sync with the
    [server](../server/DEVELOPMENT.md); share types via
    [shared](../shared/DEVELOPMENT.md), never import from `server`.
- **Change IDs, watched file patterns, or extensions**: update
    [src/constants.ts](src/constants.ts).

## Troubleshooting

- **Client code changes have no effect**: reload the Extension Development Host
    window; the watch build does not auto-reload.
- **`vscode` import errors in tests**: ensure the test uses the mock in
    [tests/\_\_mocks\_\_/vscode.ts](tests/__mocks__/vscode.ts) and that pure logic
    is not pulling in the real VSCode API.
- **Status bar not updating**: verify the `aglint/status` notification payload
    passes `parseStatusParams` validation.

## Additional Resources

- Root guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
- Code guidelines: [AGENTS.md](AGENTS.md)
- Related packages:
    [server](../server/DEVELOPMENT.md),
    [shared](../shared/DEVELOPMENT.md)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
