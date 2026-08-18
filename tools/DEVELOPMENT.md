<!-- omit in toc -->
# Development Guide — tools

Developer guide for the `@vscode-adblock-syntax/tools` package: repository-wide
build and utility scripts.

This is part of a monorepo. For environment setup and repo-wide commands, start
with the root [DEVELOPMENT.md](../DEVELOPMENT.md). For code guidelines and
architecture, see [AGENTS.md](AGENTS.md).

<!-- omit in toc -->
## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
    - [Run a script](#run-a-script)
    - [Lint](#lint)
    - [Type check](#type-check)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

A collection of small, standalone, dependency-free Node.js scripts used by the
repo's build and maintenance workflows:

- [build-txt.ts](build-txt.ts) — writes the extension version from the root
    `package.json` into `out/build.txt` (falls back to `0.0.0-dev` when no
    version is injected).
- [clean.ts](clean.ts) — removes `node_modules` from every workspace package.

The scripts are run via `tsx` and rely only on Node.js built-ins and the `pnpm`
CLI. This package has no build or test step of its own.

## Prerequisites

Node.js v22, pnpm v10, Git. See the root
[Prerequisites](../DEVELOPMENT.md#prerequisites). Run `pnpm install` once from
the repository root.

## Getting Started

There is nothing to build here. The scripts are invoked from the repo root, for
example via the root `pnpm clean` command.

## Development Workflow

### Run a script

```bash
pnpm clean                          # runs tsx tools/clean.ts (removes node_modules)
pnpm exec tsx tools/build-txt.ts    # writes version -> out/build.txt
```

### Lint

This package has no per-package lint script; lint it from the repo root:

```bash
pnpm lint:code   # ESLint (add -- --fix)
pnpm lint:md     # markdownlint
```

### Type check

Type checking is covered by the root command:

```bash
pnpm test:compile
```

## Common Tasks

- **Add a script**: create a single-file `*.ts` script that performs its work and
    exits non-zero on failure. Prefer Node.js built-ins (`node:fs`, `node:path`,
    `node:child_process`) so cleanup-style scripts run even without installed
    `node_modules`. Update [AGENTS.md](AGENTS.md) Project Structure/Overview.
- **Grow non-trivial logic**: extract the logic into a testable function before
    adding a test setup (no test runner is configured here yet).
- **Change a script's inputs/outputs**: update any CI configuration that consumes
    the output (e.g. the `build.txt` location).

## Troubleshooting

- **`tsx: command not found`**: run scripts through pnpm (`pnpm exec tsx ...`) or
    the root `pnpm clean` so the workspace `tsx` is used; run `pnpm install` first.
- **`clean` fails partway**: it exits non-zero on error; re-run after resolving
    the reported filesystem issue. It is safe to run even when some package
    `node_modules` are already absent.

## Additional Resources

- Root guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
- Code guidelines: [AGENTS.md](AGENTS.md)
- Related package: [syntaxes](../syntaxes/DEVELOPMENT.md)
