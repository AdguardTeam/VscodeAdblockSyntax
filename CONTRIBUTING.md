# Contributing

You can contribute to the project by opening a pull request. People who
contribute to AdGuard projects can receive various rewards, see
[this page][contribute] for details.

Table of Contents:

- [Contributing](#contributing)
  - [Development \& Contribution](#development--contribution)
    - [Available commands](#available-commands)
  - [Releasing](#releasing)
  - [References](#references)

[contribute]: https://adguard.com/contribute.html

## Development & Contribution

Here is a short guide on how to set up the development environment and how to
submit your changes:

- Pre-requisites: [Node.js][nodejs] (v14 or higher), [Yarn][yarn] (v2 or
  higher), [Git][git], [VSCode][vscode]. It is important to use Yarn and not
  NPM,because the project is optimized for Yarn.
- Clone the repository with `git clone`.
- Install dependencies with `yarn` (this will also install the dependencies for
  the client and server via postinstall scripts).
- Create a new branch with `git checkout -b <branch-name>`. Example:
  `git checkout -b feature/add-some-feature`. Please add `feature/` or `fix/`
  prefix to your branch name, and refer to the issue number if there is one.
  Example: `fix/42`.
- After you have dependencies installed, you can open the repository in VSCode
  and start developing.
- Before you start developing, just try to run the extension in debug mode. To
  do this, simply press `F5` in VSCode. This will build the extension and open
  a new VSCode window with the extension installed (but it is not installed in
  the main VSCode window, which you use for development).
- Make your changes and test them in the debug VSCode window.
- Check code by running `yarn test-compile` and `yarn lint` commands.
- Generate a `.vsix` file with `yarn generate-vsix` command. This will build
  the extension and generate a `.vsix` file in the project root folder. You can
  install this file as an extension in your VSCode. Please always test your
  changes by installing the `.vsix` file in a separate VSCode window before
  submitting a pull request.
- If everything is OK, commit your changes and push them to your forked
  repository.
- Create a pull request to the main repository from your forked repository's
  branch.

We would be happy to review your pull request and merge it if it is suitable for
the project.

[nodejs]: https://nodejs.org/en/
[yarn]: https://yarnpkg.com/
[git]: https://git-scm.com/
[vscode]: https://code.visualstudio.com/

### Available commands

During development, you can use the following commands (listed in
`package.json`):

- `yarn clean` - remove the `out` folders.
- `yarn coverage` - print test coverage report.
- `yarn esbuild-watch` - build the extension with [esbuild][esbuild] (both
  client and server) and watch for changes.
- `yarn esbuild` - build the extension with [esbuild][esbuild] (both client and
  server).
- `yarn generate-vsix` - builds the extension and generates a `.vsix` file in
  the `dist` folder.
- `yarn lint` - lint the code with [ESLint][eslint].
- `yarn prepublish` - build the extension with [esbuild][esbuild] (both client
  and server) and minify the code.
- `yarn test-compile` - check if the code compiles with
  [TypeScript][typescript].

[esbuild]: https://esbuild.github.io/
[eslint]: https://eslint.org/
[typescript]: https://www.typescriptlang.org/

## Releasing

This section describes the release process for the new versions of the VSCode
plugin. This process needs to be performed by maintainers only.

- Fill the `CHANGELOG.md` file with the changes made since the last release by
  following the Keep a Changelog rules.
- Update the version number in the `package.json` file regarding the semver
  rules
- Commit changes as `Bump version to vX.X.X`.
- Create a new tag with the version number (e.g. `vX.X.X`) to trigger the
  release workflow. The release workflow will automatically publish the new
  version to the npm registry.

## References

Here are some useful links for VSCode extension development:

- [TMLanguage](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VSCode API](https://code.visualstudio.com/api/references/vscode-api)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
