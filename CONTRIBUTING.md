<!-- omit in toc -->
# Contributing & Development Guide

Thank you for your interest in contributing to the VSCode Adblock Syntax project! This guide aims to provide essential
information about the project and outlines steps to contribute effectively.

Contributors to AdGuard projects can receive **various** rewards; please check [this page][contribute] for details.

Table of Contents:

- [Prerequisites](#prerequisites)
- [Initial setup](#initial-setup)
- [Project structure](#project-structure)
    - [Main packages](#main-packages)
    - [Supporting folders](#supporting-folders)
- [Running the extension in development mode](#running-the-extension-in-development-mode)
- [Creating a production build](#creating-a-production-build)
- [Updating syntax highlighting](#updating-syntax-highlighting)
- [Available commands](#available-commands)
    - [Build commands](#build-commands)
    - [Package commands](#package-commands)
    - [Package-level build commands](#package-level-build-commands)
    - [Utility commands](#utility-commands)
    - [Linting \& testing commands](#linting--testing-commands)
- [Versioning policy](#versioning-policy)
    - [VS Code extension versioning requirements](#vs-code-extension-versioning-requirements)
    - [Pre-release versioning strategy](#pre-release-versioning-strategy)
- [Useful links](#useful-links)

## Prerequisites

Ensure that the following software is installed on your computer:

- [Node.js][nodejs]: v22 (you can install multiple versions using [nvm][nvm])
- [pnpm][pnpm]: v10
- [VSCode][vscode]
- [Git][git]

[git]: https://git-scm.com/
[nodejs]: https://nodejs.org/en/download
[nvm]: https://github.com/nvm-sh/nvm
[pnpm]: https://pnpm.io/installation

## Initial setup

After cloning the repository, follow these steps to initialize the project:

1. Install dependencies by calling `pnpm install`.
   This will also install client and server dependencies via `postinstall` scripts.
   After installation, it will initialize [Husky Git hooks][husky] through the `prepare` script.
2. Install recommended VSCode extensions (refer to the [`.vscode/extensions.json`][vscode-extensions-file] file).
   **These extensions are REQUIRED for the development process.**

## Project structure

This project uses a **monorepo structure** with **pnpm workspaces**. Each package is independent with its own
`package.json`, build system, and tests.

### Main packages

- [**client**][client-dir]: VSCode extension code which has access to all VS Code Namespace API.
    - Built with Rspack
    - Contains the extension activation logic and VSCode integration
- [**server**][server-dir]: Language server running in a separate process.
    - Built with Rspack with code splitting for large dependencies
    - Handles AGLint integration, diagnostics, and language features
- [**shared**][shared-dir]: Shared utilities used by both client and server packages.
    - Built with Rspack
    - Contains common types and utilities
- [**syntaxes**][syntaxes-dir]: TextMate grammars for syntax highlighting.
    - Converts YAML grammar to PList format for VSCode
    - Contains grammar tests and utilities

### Supporting folders

- [**test**][test-dir]: Static test files and test workspaces.
    - [**static/aglint**][test-static-aglint-dir]: AGLint test project workspace.
    - [**static/rules**][test-static-rules-dir]: Rules for testing the syntax highlighting visually.
- [**tools**][tools-dir]: Build and utility scripts for the project.
- [**bamboo-specs**][bamboo-specs-dir]: CI/CD pipeline configurations.

> [!NOTE]
> To learn more about the client-server architecture of VSCode extensions, refer to the [VSCode Language Server
> Extension Guide][vscode-ls-extension-guide].

## Running the extension in development mode

If you've made changes to the extension code and want to test them, follow these steps:

1. Open the project's **root** folder in VSCode.
1. Select `Run > Start Debugging` menu item in VSCode (or just press the `F5` key). This starts the watch build process
   in the background, opening a new VSCode window called "Extension Development Host" where you can test the extension.
1. Watch build does not automatically update the extension in the "Extension Development Host" window. You'll need to
   reload the window manually by pressing `Ctrl + R` or selecting `Developer: Reload Window` command in the command
   palette (`Ctrl + Shift + P`).

> [!IMPORTANT]
> When you start the debugging, VSCode starts the watch build commands in separate terminals. To interpret the terminal
> output correctly, VSCode relies on [problem matchers][vscode-problem-matcher-docs],
> otherwise the watch build will not stop when it encounters an error.

## Creating a production build

To create a production build of the extension:

1. Run `pnpm build` command to build packages.
2. Run `pnpm package` command to package the extension into a `.vsix` file.
3. To ensure the build is correct, install the generated `.vsix` file in VSCode. Open the command palette
   (`Ctrl + Shift + P`), select "Extensions: Install from VSIX...", and choose the `vscode-adblock.vsix` file.

## Updating syntax highlighting

1. Update the TM grammar in the `syntaxes/adblock.yaml-tmlanguage` file.
1. Create/modify example rules in the `test/static/rules` folder. Add link for GitHub issues to rules if related to some
   issue.
1. Create/modify unit tests in `syntaxes/test/adblock`. Ensure tests pass by running
   `pnpm --filter @vscode-adblock-syntax/syntaxes test`.

> [!TIP]
> Open the `test/static` folder in the "Extension Development Host" window and you can check the syntax highlighting
> visually. This is useful when you want to check how the highlighting works with specific rules.

> [!NOTE]
> You can use the [Online test page for TextMate grammars][nova-light-show] to test the TM grammars.

## Available commands

During development, you can use the following commands (listed in `package.json`).

### Build commands

- `pnpm build` - Build all packages recursively with minification enabled.

### Package commands

- `pnpm package` - Package the extension into a `.vsix` file in the `out` directory.
- `pnpm package:pre` - Package the extension with the `--pre-release` flag for prerelease builds.

### Package-level build commands

Each package can be built independently using pnpm workspace filters:

- `pnpm --filter @vscode-adblock-syntax/shared build` - Build the shared package with Rspack.
- `pnpm --filter @vscode-adblock-syntax/client build` - Build the client package with Rspack.
- `pnpm --filter @vscode-adblock-syntax/server build` - Build the server package with Rspack (includes code splitting).
- `pnpm --filter @vscode-adblock-syntax/syntaxes build` - Build the syntaxes package (converts grammar to PList format).

> [!NOTE]
> Rspack builds are configured via `rspack.config.ts` files in each package. Production mode is enabled via
> `NODE_ENV=production` environment variable, which is set automatically by the root `pnpm build` command.

### Utility commands

- `pnpm clean` - Removes all generated files using the clean utility script.
- `pnpm increment` - Increment the patch version number in the `package.json` file. Typically used by CI.

### Linting & testing commands

- `pnpm lint` - Run all linters recursively across all packages.
- `pnpm lint:code` - Lint the code with [ESLint][eslint].
- `pnpm lint:md` - Lint the markdown files with [markdownlint][markdownlint].
- `pnpm test` - Run tests recursively across all packages with [Vitest][vitest].
- `pnpm test:compile` - Type-check all packages without emitting files.

You can also run linting and tests for individual packages:

- `pnpm --filter @vscode-adblock-syntax/shared lint` / `test`
- `pnpm --filter @vscode-adblock-syntax/client lint` / `test`
- `pnpm --filter @vscode-adblock-syntax/server lint` / `test`
- `pnpm --filter @vscode-adblock-syntax/syntaxes lint` / `test`

> [!NOTE]
> Watch builds are handled automatically by VSCode tasks when you start debugging (see
> [`.vscode/tasks.json`][vscode-tasks-file] file). Each package (shared, client, server, syntaxes) has its own watch
> task that rebuilds on file changes.

> [!NOTE]
> Linting and testing commands are called automatically by Husky Git hooks and CI. You can run them manually if needed.

## Versioning policy

This project follows [Semantic Versioning (SemVer)][semver] with specific requirements for VS Code extensions.
See [VS Code pre-release extensions documentation][vscode-prerelease] for more details.

### VS Code extension versioning requirements

> [!IMPORTANT]
> VS Code Marketplace and Open VSX **only support `major.minor.patch` format**. Pre-release tags like `1.0.0-alpha` or
> `1.0.0-beta` are **NOT supported** and will be rejected by the stores.

### Pre-release versioning strategy

To support pre-release versions while maintaining compatibility, we use an **odd/even minor version scheme**:

- **Release versions**: `major.EVEN.patch` → e.g., `2.0.0`, `2.0.1`, `2.2.0`
- **Pre-release versions**: `major.ODD.patch` → e.g., `2.1.0`, `2.1.1`, `2.3.0`

**Version progression example:**

```text
2.0.0 → 2.1.0 (start pre-release)  → 2.1.1 (pre-release update)  → 2.2.0 (promote to release)
```

> [!WARNING]
> VS Code auto-updates to the highest version. Always ensure pre-release versions are higher than release versions to
> prevent downgrading pre-release users.

## Useful links

Explore the following links for more information on development:

- [TMLanguage](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VSCode API](https://code.visualstudio.com/api/references/vscode-api)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Online test page for TextMate grammars][nova-light-show]

[bamboo-specs-dir]: ./bamboo-specs
[client-dir]: ./client
[contribute]: https://adguard.com/contribute.html
[eslint]: https://eslint.org/
[husky]: https://typicode.github.io/husky
[markdownlint]: https://github.com/DavidAnson/markdownlint
[nova-light-show]: https://novalightshow.netlify.app/
[semver]: https://semver.org/
[server-dir]: ./server
[shared-dir]: ./shared
[syntaxes-dir]: ./syntaxes
[test-dir]: ./test
[test-static-aglint-dir]: ./test/static/aglint
[test-static-rules-dir]: ./test/static/rules
[tools-dir]: ./tools
[vitest]: https://vitest.dev/
[vscode-extensions-file]: ./.vscode/extensions.json
[vscode-ls-extension-guide]: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
[vscode-prerelease]: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions
[vscode-problem-matcher-docs]: https://code.visualstudio.com/docs/editor/tasks#_processing-task-output-with-problem-matchers
[vscode-tasks-file]: ./.vscode/tasks.json
[vscode]: https://code.visualstudio.com/
