<!-- markdownlint-disable -->
&nbsp;
<p align="center">
    <img alt="AGLint" src="https://cdn.adguard.com/website/github.com/AGLint/aglint_512x512.png" width="128px">
</p>
<h3 align="center">Adblock Language support for VSCode.</h3>
<p align="center">
    Supported syntaxes:
</p>
<p align="center">
    <a href="https://adguard.com/"><img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px"> AdGuard</a> |
    <a href="https://github.com/gorhill/uBlock"><img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px"> uBlock Origin</a> |
    <a href="https://getadblock.com"><img src="https://cdn.adguard.com/website/github.com/AGLint/ab_logo_128x128.png" width="14px"> AdBlock</a> |
    <a href="https://adblockplus.org/"><img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px"> Adblock Plus</a>
</p>

<p align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=adguard.adblock"><img src="https://img.shields.io/visual-studio-marketplace/v/adguard.adblock" alt="VSCode Marketplace Version" /></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=adguard.adblock"><img src="https://img.shields.io/visual-studio-marketplace/d/adguard.adblock" alt="VSCode Marketplace Downloads" /></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=adguard.adblock"><img src="https://img.shields.io/visual-studio-marketplace/r/adguard.adblock" alt="VSCode Marketplace Rating" /></a>
    <a href="https://github.com/AdguardTeam/VscodeAdblockSyntax/blob/master/LICENSE.md"><img src="https://img.shields.io/github/license/AdguardTeam/VscodeAdblockSyntax" alt="License" /></a>
    <a href="https://github.com/AdguardTeam/VscodeAdblockSyntax/issues"><img src="https://img.shields.io/github/issues/AdguardTeam/VscodeAdblockSyntax" alt="Open GitHub Issues" /></a>
    <a href="https://github.com/AdguardTeam/VscodeAdblockSyntax/pulls"><img src="https://img.shields.io/github/issues-pr/AdguardTeam/VscodeAdblockSyntax" alt="Open GitHub Pull Requests" /></a>
</p>
<!-- markdownlint-restore -->

Table of Contents:

- [Introduction](#introduction)
    - [Features](#features)
        - [Syntax highlighting](#syntax-highlighting)
        - [AGLint integration (linter)](#aglint-integration-linter)
        - [Configuration](#configuration)
        - [GitHub Linguist support](#github-linguist-support)
    - [Ideas \& Questions](#ideas--questions)
    - [Reporting Issues](#reporting-issues)
    - [Contributing](#contributing)
    - [License](#license)
    - [References](#references)

# Introduction

This extension adds support for AdGuard, uBlock Origin and Adblock Plus syntaxes to Visual Studio Code, so you can write
adblock rules in a convenient way. It also provides a linter to check your rules for errors.

**We recommend using this extension if you are working with adblock rules.** It is available on
[VSCode Marketplace][vscodemarket].

<a href="https://cdn.adtidy.org/website/github.com/VscodeAdblockSyntax/screenshot.png">
    <img src="https://cdn.adtidy.org/website/github.com/VscodeAdblockSyntax/screenshot.png"
         style="max-width: 600px" />
</a>

GitHub Linguist support is also available, so you can highlight your adblock rules in GitHub repositories. See
[GitHub Linguist support](#github-linguist-support) for more details. Quick example:

```adblock
! This is an example rule
example.org##.banner
||example.net/script.js$script,third-party,domain=example.com
```

## Features

In this section we will describe the main features of this extension.

### Syntax highlighting

Syntax highlighting is available for AdGuard, uBlock Origin and Adblock Plus syntaxes. Nowadays it is unimaginable to
work with code without highlighting, which helps you to distinguish different parts of the code and makes it easier
to read.

### AGLint integration (linter)

We integrated [AGLint][aglint] into this extension, that makes it able to check your rules for various issues, such as
invalid syntax, invalid domains, invalid / incompatible CSS selectors, unknown / incompatible scriptlets, bad practices,
etc. For more information about AGLint, please refer to its [repository][aglint].

AGLint integration is done in the following way:

1. Extension will search local AGLint installation (if it is installed) and use it for linting. First, it will search
   for local installation in the current workspace, and if it is not found, it will search for a global installation.
   This is an ideal behavior, because if you have a local installation, it guarantees that you will use the same version
   of AGLint, and the results will be the same.
2. If the extension doesn't find any installation, it will use the bundled version of AGLint, which is included in the
   extension itself. Usually, it is the latest version of AGLint. The advantage of this approach is that you don't need
   to install AGLint manually, and you can start using the extension immediately after installation.

> [!WARNING]
> Please note that the linter is under active development, so it may not work properly for some rules. If you
> find any issues, please report them [here][aglintissues]. We look forward to your feedback, your help is very
> important to us!

### Configuration

This extension provides the following configuration options:

<!--markdownlint-disable MD013-->
| Option | Description | Default value | Possible values |
| ------ | ----------- | ------------- | --------------- |
| `adblock.enableAglint` | Enable or disable AGLint integration. If disabled, only syntax highlighting and other language features will be available. | `true` | `true`, `false` |
| `adblock.useExternalAglintPackages` | If enabled, extension will search for AGLint installations in the system. If disabled, extension will use its own AGLint installation, which is included in the extension (integrated AGLint bundle). If you have AGLint installed in your system / project, it is recommended to enable this option in order to provide consistent results. | `true` | `true`, `false` |
| `adblock.packageManager` | Package manager to use for searching global AGLint installations. Set it to your preferred package manager. | `npm` | `npm`, `yarn`, `pnpm` |
<!--markdownlint-enable MD013-->

### GitHub Linguist support

GitHub supports adblock syntax officially via the [Linguist][linguist] library. Our extension provides a
[TMLanguage file][tmlanguagefile], which is used by Linguist to highlight adblock rules (VSCode highlight also based on
this file). This means that if you have a repository with adblock rules, GitHub can highlight your `.txt` files, if the
following conditions are met:

- If a `*.txt` file **begins** with an adblock agent (such as `[Adblock Plus 2.0]`, `[AdGuard]`, `[uBlock Origin]`,
  `[Adblock Plus 2.0; AdGuard]`, etc.), then it will be highlighted as an adblock file automatically. You can find the
  detection heuristics [here][linguistheur].
- In any other cases, you can override the language classification by adding the following lines to `.gitattributes`
  file:
  ```gitattributes
  # Override classification for *.txt files, so they are highlighted as adblock files.
  # - This example will match all *.txt files in the repository, but you can
  #   customize path(s) to match only specific files, such as /filters/*.txt
  #   or /filters/*.adblock. See https://git-scm.com/docs/gitattributes for more details.
  # - By default, Adblock language doesn't show up in the repository's language statistics,
  #   but adding linguist-detectable will resolve this, so it is recommended to add it.
  *.txt linguist-language=AdBlock linguist-detectable
  ```
  You can find more information about overriding language classification [here][linguistoverride].

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

If you have any questions or ideas for new features, please open an issue or a discussion. We will be happy to discuss
it with you.

## Reporting Issues

If you found a bug or have a feature request, please report it [here][issues]. Please make sure to include as much
information as possible, including screenshots or example rules.

Please note that the highlighter issues on GitHub will not be fixed immediately when we update the TMLanguage in this
repository. GitHub's highlighter is only updated after Linguist releases. This process happens roughly every quarter.
Before release, Linguist maintainers will update all integrated TMLanguage to the latest version. You can find more
information about Linguist's release process [here][linguistrelease].

## Contributing

If you want to contribute to this project, please read the [CONTRIBUTING][contributing] file.

## License

This extension is licensed under the MIT License. See the [LICENSE][license] file for details.

## References

Here are some useful links to help you write adblock rules. This list is not exhaustive, so if you know any other useful
resources, please let us know.

<!--markdownlint-disable MD013-->
- Syntax documentation:
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px"> [AdGuard: *How to create your own ad filters*][adg-filters]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px"> [uBlock Origin: *Static filter syntax*][ubo-filters]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px"> [Adblock Plus: *How to write filters*][abp-filters]
- Extended CSS documentation:
    - [MDN: *CSS selectors*][mdn-css-selectors]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px"> [AdGuard: *Extended CSS capabilities*][adg-ext-css]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px"> [uBlock Origin: *Procedural cosmetic filters*][ubo-procedural]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px"> [Adblock Plus: *Extended CSS selectors*][abp-ext-css]
- Scriptlets:
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px"> [AdGuard scriptlets][adg-scriptlets]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px"> [uBlock Origin scriptlets][ubo-scriptlets]
    - <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px"> [Adblock Plus snippets][abp-snippets]
- Third party libraries:
    - [CSSTree docs][css-tree-docs]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px"> [AdGuard's compatibility table][adg-compatibility-table]
<!--markdownlint-enable MD013-->

[abp-ext-css]: https://help.eyeo.com/adblockplus/how-to-write-filters#elemhide-emulation
[abp-filters]: https://help.eyeo.com/adblockplus/how-to-write-filters
[abp-snippets]: https://help.eyeo.com/adblockplus/snippet-filters-tutorial#snippets-ref
[adg-compatibility-table]: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/compatibility-table.md
[adg-ext-css]: https://github.com/AdguardTeam/ExtendedCss/blob/master/README.md
[adg-filters]: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
[adg-scriptlets]: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md#scriptlets
[aglint]: https://github.com/AdguardTeam/AGLint
[aglintissues]: https://github.com/AdguardTeam/AGLint/issues
[contributing]: https://github.com/AdguardTeam/VscodeAdblockSyntax/blob/master/CONTRIBUTING.md
[css-tree-docs]: https://github.com/csstree/csstree/tree/master/docs
[issues]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues
[license]: https://github.com/AdguardTeam/VscodeAdblockSyntax/blob/master/LICENSE.md
[linguist]: https://github.com/github/linguist
[linguistheur]: https://github.com/github/linguist/blob/c1c34e5260797b4d598f5ec76f19723bfc5a1894/lib/linguist/heuristics.yml#L708-L728
[linguistoverride]: https://github.com/github/linguist/blob/master/docs/overrides.md
[linguistrelease]: https://github.com/github/linguist/blob/master/docs/releasing.md
[mdn-css-selectors]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
[tmlanguagefile]: https://github.com/AdguardTeam/VscodeAdblockSyntax/blob/master/syntaxes/adblock.tmLanguage.json
[ubo-filters]: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
[ubo-procedural]: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
[ubo-scriptlets]: https://github.com/gorhill/uBlock/wiki/Resources-Library#available-general-purpose-scriptlets
[vscodemarket]: https://marketplace.visualstudio.com/items?itemName=adguard.adblock
