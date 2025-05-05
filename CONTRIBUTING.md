<!-- omit in toc -->
# Contributing & Development Guide

Thank you for your interest in contributing to the VSCode Adblock Syntax project! This guide aims to provide essential
information about the project and outlines steps to contribute effectively.

Contributors to AdGuard projects can receive **various** rewards; please check [this page][contribute] for details.

Table of Contents:

- [Prerequisites](#prerequisites)
- [Initial setup](#initial-setup)
- [Project structure](#project-structure)
- [Running the extension in development mode](#running-the-extension-in-development-mode)
- [Creating a production build](#creating-a-production-build)
- [Updating integrated AGLint](#updating-integrated-aglint)
- [Updating syntax highlighting](#updating-syntax-highlighting)
- [Available commands](#available-commands)
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

The most important folders in the project are:

- [**client**][client-dir]: VSCode extension code which has access to all VS Code Namespace API.
- [**server**][server-dir]: Language analysis tool running in a separate process.
- [**syntaxes**][syntaxes-dir]: TextMate grammars for syntax highlighting.
- [**test**][test-dir]: Various tests for the extension.
    - [**grammar**][test-grammar-dir]: Unit tests for the TextMate grammar.
    - [**static**][test-static-dir]: Static test files for testing the extension in development mode.
        - [**aglint**][test-static-aglint-dir]: AGLint test project.
        - [**rules**][test-static-rules-dir]: Rules for testing the syntax highlighting visually.

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
> output correctly, VSCode relies on [problem matchers][vscode-problem-matcher-docs]. Since ESBuild is not supported by
> VSCode by default, you need to install the [ESBuild Problem Matchers][esbuild-problem-matcher-extension] extension to
> make able VSCode to parse its output.
> Without this extension, VSCode cannot recognize when ESBuild completes its build or encounters errors. This results in
> an endless run, preventing the opening of the Extension Development Host.

## Creating a production build

To create a production build of the extension:

1. Run `pnpm build:prod` command. This generates a production build and a `.vsix` file in the `out` folder.
1. To ensure the build is correct, install the generated `.vsix` file in VSCode. Open the command palette
   (`Ctrl + Shift + P`), select "Extensions: Install from VSIX...", and choose the `vscode-adblock.vsix` file.

## Updating integrated AGLint

> [!NOTE]
> This extension includes an integrated AGLint. It's a bundled version, avoiding the need for a separate AGLint
> installation. However, the extension can use an external AGLint version if installed by a package manager.

1. Update AGLint in the `server/package.json` file. Alternatively, link the local AGLint repository if it hasn't been
   released on NPM.
1. If there are breaking changes in the AGLint API, update the server code accordingly, changing the minimum supported
   AGLint version in `server/index.ts` (`MIN_AGLINT_VERSION` constant).
1. Test the extension with the new AGLint version by running it in debug mode (see
   [*Running the extension in development mode*](#running-the-extension-in-development-mode) section). In the
   *"Extension Development Host"* window, you should open the test project (see `test/static` folder) and check if the
   extension works as expected.
1. If needed, update the test project (e.g., update the config file, add new example rules).

## Updating syntax highlighting

1. Update the TM grammar in the `syntaxes/adblock.yaml-tmLanguage` file.
1. Create/modify example rules in the `test/static/rules` folder. Add link for GitHub issues to rules if related to some
   issue.
1. Create/modify unit tests in `test/grammar`. Ensure tests pass by running `pnpm test`.

> [!TIP]
> Open the `test/static` folder in the "Extension Development Host" window and you can check the syntax highlighting
> visually. This is useful when you want to check how the highlighting works with specific rules.

> [!NOTE]
> You can use the [Online test page for TextMate grammars][nova-light-show] to test the TM grammars.

## Available commands

During development, you can use the following commands (listed in `package.json`).

- `pnpm build:grammar` - Compiles the TextMate (TM) grammar into a PList format, since VSCode does not natively support
  YAML grammars.
- `pnpm build:prod` - Generates a production build of the extension, including a `.vsix` file in the `out` directory for
  VSCode installation.
- `pnpm build:txt` - Creates a `build.txt` file in the out directory containing the current version number, primarily
  for Continuous Integration (CI) purposes.
- `pnpm build:vsix` - Produces a `.vsix` file in the out directory, which is used to install the extension in VSCode.
- `pnpm clean` - Removes all generated files in the output directories, cleaning up the build results.
- `pnpm esbuild:aglint` - Base ESBuild command for building integrated AGLint with the common options.
- `pnpm esbuild:agtree` - Base ESBuild command for building integrated AGTree with the common options.
  Integrated AGTree comes with the integrated AGLint, this command just helps to bundle it to a separate file.
  This is needed because AGTree is also used by the server, and by bundling it to a separate file, we can avoid
  double-bundling AGTree.
- `pnpm esbuild:server` - Base ESBuild command for building the server with the common options.
- `pnpm esbuild:client` - Base ESBuild command for building the client with the common options.
- `pnpm extract-changelog` - Extract changes from the `CHANGELOG.md` for a specific version. Typically, this is used by
  CI.
- `pnpm increment` - Increment the patch version number of the extension in the `package.json` file. Typically, this is
  used by CI.
- `pnpm lint:md` - Lint the markdown files with [markdownlint][markdownlint].
- `pnpm lint:staged` - Run linters on staged files. Typically, this is used by Husky Git hooks.
- `pnpm lint:ts` - Lint the *ts* code with [ESLint][eslint].
- `pnpm lint` - Run all linters.
- `pnpm test:compile` - Check if the code compiles with [TypeScript][typescript].
- `pnpm test` - Run tests with [Jest][jest].
- `pnpm watch:aglint` - Watch for changes in the AGLint code and create a development build automatically.
- `pnpm watch:agtree` - Watch for changes in the AGTree code and create a development build automatically.
- `pnpm watch:client` - Watch for changes in the client code and create a development build automatically.
- `pnpm watch:grammar` - Watch for changes in the TM grammar and rebuild it automatically.
- `pnpm watch:server` - Watch for changes in the server code and create a development build automatically.

> [!NOTE]
> Watch commands (e.g., `pnpm watch:client`) are typically used by VSCode tasks (see
> [`.vscode/tasks.json`][vscode-tasks-file] file and
> [*Running the extension in development mode*](#running-the-extension-in-development-mode) section).
> In most cases, you don't need to run them manually.

> [!NOTE]
> Linting and testing commands are called automatically by Husky Git hooks and CI. You can run them manually if needed.

## Useful links

Explore the following links for more information on development:

- [TMLanguage](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VSCode API](https://code.visualstudio.com/api/references/vscode-api)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Online test page for TextMate grammars][nova-light-show]

[client-dir]: ./client
[contribute]: https://adguard.com/contribute.html
[esbuild-problem-matcher-extension]: https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers
[eslint]: https://eslint.org/
[husky]: https://typicode.github.io/husky
[jest]: https://jestjs.io/
[markdownlint]: https://github.com/DavidAnson/markdownlint
[nova-light-show]: https://novalightshow.netlify.app/
[server-dir]: ./server
[syntaxes-dir]: ./syntaxes
[test-dir]: ./test
[test-grammar-dir]: ./test/grammar
[test-static-aglint-dir]: ./test/static/aglint
[test-static-dir]: ./test/static
[test-static-rules-dir]: ./test/static/rules
[typescript]: https://www.typescriptlang.org/
[vscode-extensions-file]: ./.vscode/extensions.json
[vscode-ls-extension-guide]: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
[vscode-problem-matcher-docs]: https://code.visualstudio.com/docs/editor/tasks#_processing-task-output-with-problem-matchers
[vscode-tasks-file]: ./.vscode/tasks.json
[vscode]: https://code.visualstudio.com/
