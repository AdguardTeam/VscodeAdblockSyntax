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
  NPM, because the project is optimized for Yarn.
- Fork the repository on GitHub. You will need to have a GitHub account for
  this. If you already have a fork, make sure to update it with the latest
  changes from the main repository.
- Clone *your forked repository* to your local machine with
  `git clone <repository-url>`. It is important to clone your forked repository
  and not the main repository, because you will not be able to push your
  changes to the main repository, since you do not have the permissions to do
  so.
- Install dependencies with `yarn`. This will also install the dependencies for
  the client and server via `postinstall` scripts. After the installation is
  complete, it will also initializes [Husky][husky] Git hooks via the
  `prepare` script.
- Create a new branch with `git checkout -b <branch-name>`. Example:
  `git checkout -b feature/add-some-feature`. Please add `feature/` or `fix/`
  prefix to your branch name, and refer to the issue number if there is one.
  Example: `fix/42`.
- Open the project **root** folder in VSCode.
- Before you start developing, just try to run the extension in debug mode. To
  do this, simply press `F5` in VSCode. This will build the extension and open
  a new VSCode window with the extension installed (but it is not installed in
  the main VSCode window, which you use for development). The opened window is
  called *"Extension Development Host"*.
- Make your changes and test them in the debug VSCode window.
- Check code by running `yarn test-compile`, `yarn lint` and `yarn test`
  commands (Husky will run these commands automatically before each commit).
- Generate a `.vsix` file with `yarn generate-vsix` command. This will build
  the extension and generate a `.vsix` file in the project root folder. You can
  install this file as an extension in your VSCode. Please always test your
  changes by installing the `.vsix` file in a separate VSCode window before
  submitting a pull request.
- If everything is OK, commit your changes and push them to your forked
  repository. Example:
  - Add files to commit with `git add .`.
  - Commit files with `git commit -m "Add some feature"`.
  - Push changes to your forked repository with
    `git push origin feature/add-some-feature`.
- When you are ready to submit your changes, go to your forked repository on
  GitHub and create a pull request. Make sure to select the correct branch.
  Example: `feature/add-some-feature` branch in your forked repository to
  `master` branch in the main repository.
- After you open a pull request, GitHub Actions will run the tests on your
  changes. If the tests fail, you can see the error details in the "Checks"
  tab. If the tests pass, a green checkmark will appear in the "Checks" tab.
- Finally, wait for the maintainers to review your changes. If there are any
  issues, you can fix them by pushing new commits to your branch. If everything
  is OK, the maintainers will merge your pull request.

We would be happy to review your pull request and merge it if it is suitable for
the project.

*Note for maintainers:* Installation instructions for maintainers are the same
as for contributors, except that maintainers should clone the main repository
instead of forking it.

[git]: https://git-scm.com/
[husky]: https://typicode.github.io/husky
[nodejs]: https://nodejs.org/en/
[vscode]: https://code.visualstudio.com/
[yarn]: https://yarnpkg.com/

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
- `yarn test` - run tests with [Jest][jest].
- `yarn prepublish` - build the extension with [esbuild][esbuild] (both client
  and server) and minify the code.
- `yarn test-compile` - check if the code compiles with
  [TypeScript][typescript].

[esbuild]: https://esbuild.github.io/
[eslint]: https://eslint.org/
[jest]: https://jestjs.io/
[typescript]: https://www.typescriptlang.org/

## Releasing

This section describes the release process for the new versions of the VSCode
plugin. This process needs to be performed by maintainers only.

- Fill the `CHANGELOG.md` file with the changes made since the last release by
  following the [Keep a Changelog][keep-a-changelog] rules.
- Update the version number in the `package.json` file regarding the
  [semver][semver] rules.
- Commit changes as `Bump version to vX.X.X`.
- Create a new tag with the version number (e.g. `vX.X.X`) to trigger the
  release workflow. The release workflow will automatically publish the new
  version to the [VSCode Marketplace][vscode-marketplace].

[keep-a-changelog]: https://keepachangelog.com/en/1.0.0/
[semver]: https://semver.org/
[vscode-marketplace]: https://marketplace.visualstudio.com/items?itemName=adguard.adblock

## References

Here are some useful links for VSCode extension development:

- [TMLanguage](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VSCode API](https://code.visualstudio.com/api/references/vscode-api)
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Online test page for TextMate grammars](https://novalightshow.netlify.app/)
