<!-- omit in toc -->
# Development Guide — shared

Developer guide for the `@vscode-adblock-syntax/shared` package: types and
utilities shared between the [client](../client/DEVELOPMENT.md) and
[server](../server/DEVELOPMENT.md).

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
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

A small, dependency-free internal library consumed by the client and server. It
holds contracts that must stay consistent across the process boundary (e.g. the
document `FileScheme` enum) and is the intended home for future shared
validation schemas (Valibot) and custom LSP protocol types. It performs no I/O
and has no side effects. It is built with Rspack for the bundle plus
`tsc --emitDeclarationOnly` for type declarations, and exposes its public API
through the `exports` map (`out/index.js` / `out/index.d.ts`).

## Prerequisites

Node.js v22 (the package requires `node >=20`), pnpm v10, Git. See the root
[Prerequisites](../DEVELOPMENT.md#prerequisites). Run `pnpm install` once from
the repository root.

## Getting Started

`shared` is built before `client` and `server` depend on it. Build it (or rely
on the watch task) when changing its public API so consumers pick up fresh
declarations:

```bash
pnpm --filter @vscode-adblock-syntax/shared build
```

## Development Workflow

Run these from this directory, or from the repo root with the
`--filter @vscode-adblock-syntax/shared` flag.

### Build

```bash
pnpm --filter @vscode-adblock-syntax/shared build   # Rspack + postbuild emits .d.ts
```

The `prebuild` script clears `out/`; the `postbuild` script runs
`tsc --project tsconfig.build.json --emitDeclarationOnly` to emit type
declarations.

### Test

```bash
pnpm --filter @vscode-adblock-syntax/shared test    # Vitest
```

Tests live in [test/](test) (currently a placeholder); add tests as real logic
such as validation schemas is introduced.

### Lint

```bash
pnpm --filter @vscode-adblock-syntax/shared lint        # ESLint + markdownlint
pnpm --filter @vscode-adblock-syntax/shared lint:code   # ESLint (add -- --fix)
pnpm --filter @vscode-adblock-syntax/shared lint:md     # markdownlint
```

### Type check

```bash
pnpm --filter @vscode-adblock-syntax/shared exec tsc --noEmit
```

## Common Tasks

- **Add to the public API**: implement in a focused file under `src/`, then
    re-export it from [src/index.ts](src/index.ts) — anything not re-exported
    there is internal. Rebuild so `client`/`server` get the new declarations.
- **Keep it dependency-free**: every dependency here becomes a transitive
    dependency of both client and server; prefer Node.js built-ins and avoid
    side effects.
- **Never import from `client` or `server`**: this package sits at the bottom of
    the dependency graph.

## Troubleshooting

- **Consumers don't see a new export**: rebuild `shared` so `out/index.d.ts` and
    `out/index.js` are regenerated; the watch task handles this during debugging.
- **Type errors after an API change**: run `tsc --noEmit` here and in the
    consuming package; update both `client` and `server` to match the new type.

## Additional Resources

- Root guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
- Code guidelines: [AGENTS.md](AGENTS.md)
- Related packages:
    [client](../client/DEVELOPMENT.md),
    [server](../server/DEVELOPMENT.md)
