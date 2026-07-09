<!-- omit in toc -->
# Development Guide — server

Developer guide for the `@vscode-adblock-syntax/server` package: the Language
Server Protocol (LSP) server that integrates AGLint to provide diagnostics and
code actions.

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
    - [Coverage](#coverage)
    - [Lint](#lint)
    - [Type check](#type-check)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

The server runs as a separate Node.js process (one per outermost workspace
folder) and speaks LSP to the [client](../client/DEVELOPMENT.md). It dynamically
locates and loads AGLint from the user's workspace (local or global install),
lints filter-list documents, converts AGLint problems into VSCode diagnostics,
and offers code actions (apply fix, apply suggestion, disable a rule). All state
is in memory and the server degrades gracefully if AGLint cannot be loaded. It
is built with Rspack (with code splitting) to `out/server.js`.

## Prerequisites

Node.js v22 (the package requires `node >=20`), pnpm v10, VSCode `^1.74.0`, Git.
See the root [Prerequisites](../DEVELOPMENT.md#prerequisites). Run `pnpm install`
once from the repository root.

`@adguard/aglint` and `@adguard/agtree` are type-only/dev dependencies — the
runtime AGLint module is resolved from the user's workspace, not bundled.

## Getting Started

The server is launched by the client. To debug it end-to-end:

1. Open the repository **root** in VSCode.
2. Press `F5` (Launch Client). The launch config has
    `autoAttachChildProcesses` enabled, so the debugger attaches to the spawned
    server process.
3. The Extension Development Host opens the preconfigured
    [test/static/aglint](../test/static/aglint) workspace, which has AGLint and an
    `.aglintrc` available for linting.

## Development Workflow

Run these from this directory, or from the repo root with the
`--filter @vscode-adblock-syntax/server` flag.

### Build

```bash
pnpm --filter @vscode-adblock-syntax/server build   # Rspack (code splitting) -> server/out
```

The `prebuild` script clears `out/` first. Add `--watch` (or use the VSCode
watch task) for incremental rebuilds during debugging.

### Test

```bash
pnpm --filter @vscode-adblock-syntax/server test    # Vitest
```

Tests live in [test/](test) and mirror `src/`. Mock LSP boundaries with the
factories in [test/helpers/mocks.ts](test/helpers/mocks.ts)
(`createMockConnection`, `createMockServerContext`); test pure logic (cache keys,
diagnostic conversion, config-comment parsing) directly.

### Coverage

Coverage uses `@vitest/coverage-v8`:

```bash
pnpm --filter @vscode-adblock-syntax/server test -- --coverage
```

### Lint

```bash
pnpm --filter @vscode-adblock-syntax/server lint        # ESLint + markdownlint
pnpm --filter @vscode-adblock-syntax/server lint:code   # ESLint (add -- --fix)
pnpm --filter @vscode-adblock-syntax/server lint:md     # markdownlint
```

### Type check

```bash
pnpm --filter @vscode-adblock-syntax/server exec tsc --noEmit
```

## Common Tasks

- **Add an LSP handler**: keep handlers thin (validate input, call a service,
    return a response). Put handlers under `src/handlers/` and business logic
    under `src/linting/` or `src/code-actions/`.
- **Touch AGLint integration**: only `type` imports from `@adguard/aglint` are
    allowed (enforced by ESLint). Obtain the runtime module through
    [src/loaders/aglint.ts](src/loaders/aglint.ts), never import it directly.
- **Change settings/protocol**: update [src/settings.ts](src/settings.ts), the
    root [package.json](../package.json) `contributes.configuration`, and the
    relevant `AGENTS.md`.
- **Manage state**: hold mutable state in `ServerContext` / `AglintContext`; do
    not add module-level singletons.

## Troubleshooting

- **AGLint not found / not linting**: AGLint is resolved from the user's
    workspace (local or global). Ensure `@adguard/aglint` (>= `4.0.0-beta.1`) is
    installed and an `.aglintrc.*` exists. The server reports status via the
    `aglint/status` notification and never crashes on a missing install.
- **Older AGLint version rejected**: the minimum is `4.0.0-beta.1`; upgrade the
    workspace AGLint.
- **Server process not hitting breakpoints**: the launch config attaches to child
    processes automatically; confirm you launched via `F5` (Launch Client) from
    the repo root and that the server watch build succeeded.
- **Diagnostics seem stale**: in-memory caching is keyed by version/config;
    toggle `adblock.enableInMemoryAglintCache` or change the document/config to
    invalidate.

## Additional Resources

- Root guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
- Code guidelines: [AGENTS.md](AGENTS.md)
- Related packages:
    [client](../client/DEVELOPMENT.md),
    [shared](../shared/DEVELOPMENT.md)
- [AGLint](https://github.com/AdguardTeam/AGLint)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
