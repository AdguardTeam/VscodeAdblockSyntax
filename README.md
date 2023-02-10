&nbsp;
<p align="center">
    <img alt="AGLint" src="https://cdn.adguard.com/website/github.com/AGLint/aglint.svg" width="128px">
</p>
<h3 align="center">Adblock Language support for VSCode.</h3>
<p align="center">
    Supported syntaxes:
</p>
<p align="center">
    <a href="https://adguard.com/"><img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo.svg" width="14px"> AdGuard</a> |
    <a href="https://github.com/gorhill/uBlock"><img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo.svg" width="14px"> uBlock Origin</a> |
    <a href="https://adblockplus.org/"><img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo.svg" width="14px"> Adblock Plus</a>
</p>

Table of Contents:
- [Introduction](#introduction)
  - [Features](#features)
    - [Syntax highlighting](#syntax-highlighting)
    - [Adblock rule linter](#adblock-rule-linter)
    - [GitHub Linguist support](#github-linguist-support)
  - [Ideas \& Questions](#ideas--questions)
  - [Reporting Issues](#reporting-issues)
  - [Development](#development)
  - [License](#license)
  - [References](#references)

# Introduction

This extension adds support for AdGuard, uBlock Origin and Adblock Plus syntaxes in Visual Studio Code, so you can write adblock rules in a convenient way. It also provides a linter to check your rules for errors. 

**We recommend using this extension if you are working with adblock rules.** It is available on [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=adguard.adblock).

GitHub Linguist support is also available, so you can highlight your adblock rules in GitHub repositories. See [GitHub Linguist support](#github-linguist-support) for more details. Quick example:

```adblock
! This is an example rule
example.org##.banner
||example.net/script.js$script,third-party,domain=example.com
```

## Features

In this section we will describe the main features of this extension.

### Syntax highlighting

Syntax highlighting is available for AdGuard, uBlock Origin and Adblock Plus syntaxes. Nowadays it is unimaginable to work with code without highlighting, which helps you to distinguish different parts of the code and makes it easier to read.

### Adblock rule linter

We integrated [AGLint](https://github.com/AdguardTeam/AGLint) into this extension, that makes it able to check your rules for various issues, such as invalid syntax, invalid domains, invalid / incompatible CSS selectors, unknown / incompatible scriptlets, bad practices, etc. For more information about AGLint, please refer to its [repository](https://github.com/AdguardTeam/AGLint).

> :warning: Please note that the linter is under active development, so it may not work properly for some rules. If you find any issues, please report them [here](https://github.com/AdguardTeam/AGLint/issues). We look forward to your feedback, your help is very important to us!

### GitHub Linguist support

GitHub supports adblock syntax officially via the [Linguist](https://github.com/github/linguist) library. Our extension provides a [TMLanguage file](https://github.com/ameshkov/VscodeAdblockSyntax/blob/master/syntaxes/adblock.tmLanguage.json), which is used by Linguist to highlight adblock rules (VSCode highlight also based on this file). This means that if you have a repository with adblock rules, GitHub can highlight your `.txt` files, if the following conditions are met:
- If a `*.txt` file **begins** with an adblock agent (such as `[Adblock Plus 2.0]`, `[AdGuard]`, `[uBlock Origin]`, `[Adblock Plus 2.0; AdGuard]`, etc.), then it will be highlighted as an adblock file automatically. You can find the detection heuristics [here](https://github.com/github/linguist/blob/c1c34e5260797b4d598f5ec76f19723bfc5a1894/lib/linguist/heuristics.yml#L708-L728).
- In any other cases, you can override the language classification by adding the following lines to `.gitattributes` file:
  ```gitattributes
  # Override classification for *.txt files, so they are highlighted as adblock files.
  # - This example will match all *.txt files in the repository, but you can
  #   customize path(s) to match only specific files, such as /filters/*.txt
  #   or /filters/*.adblock. See https://git-scm.com/docs/gitattributes for more details.
  # - By default, Adblock language doesn't show up in the repository's language statistics,
  #   but adding linguist-detectable will resolve this, so it is recommended to add it.
  *.txt linguist-language=AdBlock linguist-detectable
  ```
  You can find more information about overriding language classification [here](https://github.com/github/linguist/blob/master/docs/overrides.md).

In addition, adblock code blocks can be inserted in markdown files and comments according to the following pattern:

<pre>
```adblock
! Example rule
example.org##.banner
```
</pre>

will be rendered as:

```adblock
! Example rule
example.org##.banner
```

## Ideas & Questions

If you have any questions or ideas for new features, please open an issue or a discussion. We will be happy to discuss it with you.

## Reporting Issues

If you found a bug or have a feature request, please report it [here](https://github.com/ameshkov/VscodeAdblockSyntax/issues). Please make sure to include as much information as possible, including screenshots or example rules.

Please note that the highlighter issues on GitHub will not be fixed immediately when we update the TMLanguage in this repository. GitHub's highlighter is only updated after Linguist releases. This process happens roughly every quarter. Before release, Linguist maintainers will update all integrated TMLanguage to the latest version. You can find more information about Linguist's release process [here](https://github.com/github/linguist/blob/master/docs/releasing.md).

## Development

Here is a quick guide on how to build and run the extension from source.

1. As prerequisites, you need to have the following tools installed on your machine:
   - [Node.js](https://nodejs.org/en/),
   - [Yarn](https://yarnpkg.com/),
   - [Git](https://git-scm.com/) and
   - [Visual Studio Code](https://code.visualstudio.com/).
2. Clone this repository from [ameshkov/VscodeAdblockSyntax](https://github.com/ameshkov/VscodeAdblockSyntax) by running `git clone`.
3. Install dependencies by running `yarn install` in the following directories:
   - repository root directory (common dependencies, build tools, etc.);
   - `client` directory (VSCode extension dependencies);
   - `server` directory (language server dependencies).
4. Open the repository root directory in Visual Studio Code.
5. Press `F5` to start the extension in debug mode. This builds the extension and opens a new VSCode window with the extension installed (but it is not installed in the main VSCode window, which you use for development).
6. If you want to build the extension, run `yarn compile` in the root directory of the repository. This will build things to the `client/out` and `server/out` directories.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

## References

Here are some useful links to help you write adblock rules. This list is not exhaustive, so if you know any other useful resources, please let us know.

- Basic documentations for each syntax:
  - ADG _How to create your own ad filters_: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
  - uBO _Static filter syntax_: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
  - ABP _How to write filters_: https://help.eyeo.com/adblockplus/how-to-write-filters
- Extended CSS:
  - MDN _CSS selectors_: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
  - ADG _Extended CSS capabilities_: https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md#extended-capabilities
  - uBO _Procedural cosmetic filters_: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
  - ABP _Extended CSS selectors_: https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation
- Scriptlets:
  - ADG scriptlets: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md#scriptlets
  - uBO scriptlets: https://github.com/gorhill/uBlock/wiki/Resources-Library#available-general-purpose-scriptlets
  - ABP snippets: https://help.eyeo.com/adblockplus/snippet-filters-tutorial#snippets-ref
- Third party libraries:
  - CSSTree: https://github.com/csstree/csstree/tree/master/docs
- AdGuard's compatibility tables:
  - https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/compatibility-table.md
