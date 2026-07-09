<!-- omit in toc -->
# Development Guide

A comprehensive guide for developers working on the VSCode Adblock Syntax
extension: how to set up the environment, run the project locally, test, build,
and contribute code.

This is the repo-wide guide. Each package has its own focused guide:

- [client/DEVELOPMENT.md](client/DEVELOPMENT.md) — VSCode extension client (LSP client).
- [server/DEVELOPMENT.md](server/DEVELOPMENT.md) — LSP language server (AGLint integration).
- [shared/DEVELOPMENT.md](shared/DEVELOPMENT.md) — shared types and utilities.
- [syntaxes/DEVELOPMENT.md](syntaxes/DEVELOPMENT.md) — TextMate grammar and tests.
- [tools/DEVELOPMENT.md](tools/DEVELOPMENT.md) — repository build/utility scripts.

For code guidelines and architecture, see [AGENTS.md](AGENTS.md). For the
user-facing manual, see [README.md](README.md).

<!-- omit in toc -->
## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
    - [Clone and install](#clone-and-install)
    - [Recommended VSCode extensions](#recommended-vscode-extensions)
    - [Project structure](#project-structure)
- [Development Workflow](#development-workflow)
    - [Running the extension in development mode](#running-the-extension-in-development-mode)
    - [Code style and linting](#code-style-and-linting)
    - [Testing](#testing)
    - [Type checking](#type-checking)
    - [Building for production](#building-for-production)
    - [Branching and pull requests](#branching-and-pull-requests)
- [Common Tasks](#common-tasks)
    - [Available commands](#available-commands)
    - [Updating syntax highlighting](#updating-syntax-highlighting)
    - [Packaging the extension](#packaging-the-extension)
    - [Working in a single package](#working-in-a-single-package)
    - [Versioning](#versioning)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Prerequisites

Install the following before you start:

- [Node.js](https://nodejs.org/en/download): v22 (the engines field requires
    `>=20`; development uses Node v22). Use [nvm](https://github.com/nvm-sh/nvm)
    to manage multiple versions.
- [pnpm](https://pnpm.io/installation): v10 (the repo pins `packageManager` to
    pnpm 10).
- [VSCode](https://code.visualstudio.com/): the extension host targets
    VSCode `^1.74.0`.
- [Git](https://git-scm.com/).

## Getting Started

### Clone and install

```bash
git clone https://github.com/AdguardTeam/VscodeAdblockSyntax.git
cd VscodeAdblockSyntax
pnpm install
```

`pnpm install` installs dependencies for every workspace package and runs the
`prepare` script, which initializes [Husky](https://typicode.github.io/husky)
Git hooks (linting and tests run on commit).

### Recommended VSCode extensions

Open the repository root in VSCode and install the recommended extensions when
prompted (defined in [.vscode/extensions.json](.vscode/extensions.json)). They
are **required** for the development workflow:

- `dbaeumer.vscode-eslint` — ESLint integration.
- `davidanson.vscode-markdownlint` — Markdown linting.
- `vitest.explorer` — run and debug Vitest tests from the editor.
- `editorconfig.editorconfig` — consistent editor settings.

### Project structure

This is a [pnpm workspaces](https://pnpm.io/workspaces) monorepo of five
packages plus supporting folders:

```text
.
├── client/         # VSCode extension entry (LSP client)
├── server/         # LSP language server (AGLint integration)
├── shared/         # Shared types/utilities for client + server
├── syntaxes/       # TextMate grammar source, compiler, tests
├── tools/          # Repo build/utility scripts
├── test/           # Static fixtures (sample rules, AGLint test workspace)
├── icons/          # Extension icons
└── bamboo-specs/   # CI/CD pipeline configuration
```

The dependency direction is one-way: `client` and `server` depend on `shared`;
`shared` depends on neither. `client` and `server` run as separate processes and
communicate only over the Language Server Protocol (LSP). See [AGENTS.md](AGENTS.md)
for the full architecture.

## Development Workflow

### Running the extension in development mode

1. Open the repository **root** folder in VSCode.
2. Select `Run > Start Debugging` or press `F5`. This runs the
    `Launch Client` configuration in [.vscode/launch.json](.vscode/launch.json),
    which starts the watch build tasks
    (see [.vscode/tasks.json](.vscode/tasks.json)) and opens a new
    "Extension Development Host" window with the
    [test/static/aglint](test/static/aglint) workspace loaded.
3. The watch build does **not** auto-reload the extension. After changing code,
    reload the host window with `Cmd/Ctrl + R` or run
    `Developer: Reload Window` from the command palette.

> The debug launch relies on VSCode problem matchers to interpret the watch
> build output; if the build errors, the launch stops.

### Code style and linting

Formatting and style are enforced by ESLint (airbnb-base + airbnb-typescript,
JSDoc, import, boundaries) and markdownlint. There is no separate format
command. Key rules: 4-space indentation, max line length 120, grouped and
alphabetized imports, inline type imports, required JSDoc. Full rules live in
[AGENTS.md](AGENTS.md#code-quality).

```bash
pnpm lint        # all linters recursively (ESLint + markdownlint)
pnpm lint:code   # ESLint only (add -- --fix to auto-fix)
pnpm lint:md     # markdownlint only
```

### Testing

Every package uses [Vitest](https://vitest.dev). Run all tests from the root:

```bash
pnpm test        # run all package tests once
```

Run tests for a single package with a workspace filter (see
[Working in a single package](#working-in-a-single-package)). Update or add
tests for any code you change before considering a task done.

### Type checking

```bash
pnpm test:compile   # type-check all packages (tsc --noEmit), no emit
```

TypeScript targets `ESNext` with `strict` mode; shared compiler options are in
[tsconfig.base.json](tsconfig.base.json).

### Building for production

```bash
pnpm build   # build all packages recursively in production mode
```

This sets `NODE_ENV=production` and builds the shared, client, and server
bundles with [Rspack](https://rspack.dev) (minified) and compiles the grammar
with `tsx`.

### Branching and pull requests

- Branch off the default branch and keep changes focused.
- Husky hooks run linters and tests on commit; do **not** bypass them with
    `--no-verify`.
- Before opening a pull request, ensure `pnpm lint`, `pnpm test:compile`, and
    `pnpm test` all pass.
- Update the relevant `AGENTS.md` when you change project structure, commands,
    or the client/server protocol, and update [README.md](README.md) when
    user-facing behavior changes.
- AdGuard contributors can receive rewards; see the
    [contribute page](https://adguard.com/contribute.html).

## Common Tasks

### Available commands

Run from the repository root with pnpm v10:

| Command | Description |
| --- | --- |
| `pnpm build` | Build all packages recursively (production, minified). |
| `pnpm test` | Run all package tests once (Vitest). |
| `pnpm test:compile` | Type-check all packages (`tsc --noEmit`). |
| `pnpm lint` | Run all linters recursively (ESLint + markdownlint). |
| `pnpm lint:code` | Lint code with ESLint (cached). |
| `pnpm lint:md` | Lint Markdown with markdownlint. |
| `pnpm clean` | Remove generated files / `node_modules`. |
| `pnpm package` | Package the extension into `out/vscode-adblock.vsix`. |
| `pnpm package:pre` | Package a pre-release build (`--pre-release`). |
| `pnpm increment` | Increment the patch version (used by CI). |

### Updating syntax highlighting

1. Edit the grammar source in
    [syntaxes/adblock.yaml-tmlanguage](syntaxes/adblock.yaml-tmlanguage).
2. Add or modify example rules under [test/static/rules](test/static/rules) (link
    related GitHub issues in the rule files).
3. Add or update tokenization tests under
    [syntaxes/test/adblock](syntaxes/test/adblock) and rebuild the grammar, then
    run `pnpm --filter @vscode-adblock-syntax/syntaxes test`.
4. Open the [test/static](test/static) folder in the Extension Development Host
    to check highlighting visually.

See [syntaxes/DEVELOPMENT.md](syntaxes/DEVELOPMENT.md) for full details.

### Packaging the extension

```bash
pnpm build           # build all packages first
pnpm package         # produces out/vscode-adblock.vsix
```

To verify a build, install the generated `.vsix` in VSCode: command palette →
`Extensions: Install from VSIX...` → select `out/vscode-adblock.vsix`.

### Working in a single package

Use pnpm workspace filters to scope commands to one package, for example:

```bash
pnpm --filter @vscode-adblock-syntax/server build
pnpm --filter @vscode-adblock-syntax/syntaxes test
pnpm --filter @vscode-adblock-syntax/client exec tsc --noEmit
```

Each package guide documents its own commands:
[client](client/DEVELOPMENT.md), [server](server/DEVELOPMENT.md),
[shared](shared/DEVELOPMENT.md), [syntaxes](syntaxes/DEVELOPMENT.md),
[tools](tools/DEVELOPMENT.md).

### Versioning

The extension uses an **odd/even minor** scheme: even minor versions are
releases (`2.0.0`, `2.2.0`), odd minor versions are pre-releases (`2.1.0`,
`2.3.0`). VSCode Marketplace and Open VSX accept only `major.minor.patch` — no
`-alpha`/`-beta` suffixes. Always keep pre-release versions higher than the
latest release so VSCode does not downgrade pre-release users.

## Troubleshooting

- **Changes not visible in the Extension Development Host**: reload the host
    window (`Cmd/Ctrl + R`); the watch build does not auto-reload.
- **Watch build stops on launch**: the `F5` launch halts when the watch build
    reports an error via the problem matcher. Fix the reported TypeScript/ESLint
    error and relaunch.
- **AGLint linting does not run**: AGLint is resolved from the user's workspace
    (local or global), not bundled. Confirm `@adguard/aglint` (>= `4.0.0-beta.1`)
    is installed and an `.aglintrc.*` config exists. The
    [test/static/aglint](test/static/aglint) workspace is preconfigured.
- **No linting in virtual/untrusted workspaces**: this is expected — AGLint needs
    the Node.js filesystem API, so only syntax highlighting is available there.
- **Grammar/tokenization tests fail to load the grammar**: build the grammar
    first (`pnpm --filter @vscode-adblock-syntax/syntaxes build`); tests load the
    compiled `out/adblock.plist`.
- **Stale build or dependency issues**: run `pnpm clean` then `pnpm install` to
    reset generated files and `node_modules`.
- **Husky hook blocks a commit**: fix the reported lint/test failures rather than
    bypassing the hook with `--no-verify`.

## Additional Resources

- [AGENTS.md](AGENTS.md) — code guidelines and architecture.
- [README.md](README.md) — user-facing documentation.
- Package guides:
    [client](client/DEVELOPMENT.md),
    [server](server/DEVELOPMENT.md),
    [shared](shared/DEVELOPMENT.md),
    [syntaxes](syntaxes/DEVELOPMENT.md),
    [tools](tools/DEVELOPMENT.md).
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [VSCode Syntax Highlight Guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VSCode API reference](https://code.visualstudio.com/api/references/vscode-api)
- [Online test page for TextMate grammars](https://novalightshow.netlify.app/)
