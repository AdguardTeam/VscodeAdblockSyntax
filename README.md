<!-- markdownlint-disable -->
<div align="center">

<img alt="AGLint" src="https://cdn.adguard.com/website/github.com/AGLint/aglint_512x512.png" width="128px">

# Adblock Syntax for VSCode

**Complete adblock filter list support for VSCode**

> **Note:** This is a development tool for creating and editing adblock filter lists, not an ad blocker for VSCode.

[![VSCode Marketplace][badge-vscode]][marketplace]
[![Open VSX][badge-openvsx]][openvsx]
[![License][badge-license]][license]

<img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px" alt="AdGuard"> AdGuard・
<img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px" alt="uBlock Origin"> uBlock Origin・
<img src="https://cdn.adguard.com/website/github.com/AGLint/ab_logo_128x128.png" width="14px" alt="AdBlock"> AdBlock・
<img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px" alt="Adblock Plus"> Adblock Plus

[Install][marketplace] • [Documentation](#features) • [Report Issue][issues] • [Contributing][contributing]

</div>

---

<!-- markdownlint-restore -->

## ✨ Features

- 🎨 **Syntax highlighting** — Full support for AdGuard, uBlock Origin, and Adblock Plus filter syntax
- 🔍 **Real-time linting** — Powered by [AGLint][aglint] with instant validation and error detection
- 🛠️ **Auto-fixing** — Automatically fix issues with AGLint's suggestions and quick fixes
- 🌐 **Multi-platform validation** — Platform-specific compatibility warnings and syntax checks
- 🐙 **GitHub integration** — Syntax highlighting on GitHub via [Linguist][linguist]
- ⚙️ **Flexible configuration** — VSCode settings and AGLint config file (`.aglintrc`) support
- 🚀 **Auto-discovery** — Automatically finds AGLint in your workspace (local or global)

---

## 📷 Screenshot

<!--markdownlint-disable MD013-->
<a href="https://cdn.adtidy.org/website/github.com/VscodeAdblockSyntax/screenshot.png">
    <img src="https://cdn.adtidy.org/website/github.com/VscodeAdblockSyntax/screenshot.png"
        style="max-width: 550px"
        alt="Adblock Syntax in action"
    />
</a>
<!--markdownlint-enable MD013-->

---

## 📦 Installation

### Quick Install

1. Open VSCode
2. Press `Ctrl+P` / `Cmd+P`
3. Type: `ext install adguard.adblock`
4. Press `Enter`

### Manual Install

**VSCode Marketplace:**

1. Open [VSCode Marketplace][marketplace]
2. Click **Install**
3. VSCode will open automatically

**Open VSX (for VSCodium, etc.):**

1. Open [Open VSX Registry][openvsx]
2. Click **Download**
3. Install the `.vsix` file manually

### Verify Installation

1. Open any `.txt` file with adblock rules
2. Add a filter rule: `example.org##.banner`
3. You should see syntax highlighting

**Note:** AGLint linting requires [AGLint][aglint] to be installed in your workspace or globally.
See [AGLint Configuration](#-aglint-configuration) for setup details.

---

## ⚙️ Configuration

| Setting                               | Description                             | Default |
|---------------------------------------|-----------------------------------------|---------|
| `adblock.enableAglint`                | Enable AGLint linting                   | `true`  |
| `adblock.enableInMemoryAglintCache`   | Cache linting results for performance   | `false` |

**💡 Tip**: Control AGLint logging via VSCode's built-in log level:
Command Palette → **Developer: Set Log Level** → **AGLint**

---

## 📝 AGLint Configuration

AGLint requires a configuration file to enable linting.
The extension will automatically detect AGLint in your workspace.

### Quick Setup

Run in your project root:

```bash
npx aglint --init
```

This creates an interactive wizard to generate a configuration file.

### Configuration File

Supported file names (YAML recommended):

- `.aglintrc.yaml` / `.aglintrc.yml` (recommended)
- `.aglintrc.json` / `.aglintrc`
- `aglint.config.json` / `aglint.config.yaml`

### Example Configuration

```yaml
# .aglintrc.yaml
root: true
extends:
  - aglint:recommended
```

### Available Presets

- `aglint:recommended` — Recommended rules for most projects
- `aglint:all` — All available rules (strict)

For detailed configuration options, rule customization, and cascading configs,
see the [AGLint documentation][aglint-docs].

---

## 🐙 GitHub Support

GitHub uses this extension's [grammar file][grammar-file] via [Linguist][linguist] for syntax highlighting.

Your filter lists will be automatically highlighted on GitHub if they start with an agent comment
like `[Adblock Plus 2.0]` or `[AdGuard]`.

[grammar-file]: https://github.com/AdguardTeam/VscodeAdblockSyntax/blob/master/syntaxes/adblock.yaml-tmlanguage

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide][contributing] for details on how to get started.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE][license] file for details.

---

## 🔗 Resources

### 📚 Filter Syntax Documentation

<!--markdownlint-disable MD013-->
- <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px" alt="AdGuard"> [AdGuard Filter Syntax][adg-syntax]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px" alt="uBlock Origin"> [uBlock Origin Static Filters][ubo-syntax]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px" alt="Adblock Plus"> [Adblock Plus Filter Guide][abp-syntax]
<!--markdownlint-enable MD013-->

### 🎯 Scriptlets & Snippets

<!--markdownlint-disable MD013-->
- <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px" alt="AdGuard"> [AdGuard Scriptlets][adg-scriptlets]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px" alt="uBlock Origin"> [uBlock Origin Scriptlets][ubo-scriptlets]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px" alt="Adblock Plus"> [Adblock Plus Snippets][abp-snippets]
<!--markdownlint-enable MD013-->

### 🎨 Extended CSS

<!--markdownlint-disable MD013-->
- [MDN CSS Selectors][mdn-css]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/adg_logo_128x128.png" width="14px" alt="AdGuard"> [AdGuard Extended CSS][adg-extcss]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/ubo_logo_128x128.png" width="14px" alt="uBlock Origin"> [uBlock Origin Procedural Filters][ubo-procedural]
- <img src="https://cdn.adguard.com/website/github.com/AGLint/abp_logo_128x128.png" width="14px" alt="Adblock Plus"> [Adblock Plus Extended CSS][abp-extcss]
<!--markdownlint-enable MD013-->

### 🛠️ Tools

- [AGLint][aglint] - Adblock filter linter
- [Compatibility Tables][compat-tables] - Cross-platform feature support

---

<div align="center">

Made with ❤️ by [AdGuard][adguard]

[Report Issue][issues] • [Request Feature][feature-request] • [Ask Question][discussions]

</div>

<!-- Link Definitions -->
[adguard]: https://adguard.com
[aglint]: https://github.com/AdguardTeam/AGLint
[aglint-docs]: https://github.com/AdguardTeam/AGLint/tree/master/docs
[badge-license]: https://img.shields.io/github/license/AdguardTeam/VscodeAdblockSyntax
[badge-openvsx]: https://img.shields.io/open-vsx/v/adguard/adblock?label=Open%20VSX
[badge-vscode]: https://img.shields.io/visual-studio-marketplace/v/adguard.adblock?label=VSCode%20Marketplace
[contributing]: CONTRIBUTING.md
[discussions]: https://github.com/AdguardTeam/VscodeAdblockSyntax/discussions
[feature-request]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/new
[issues]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues
[license]: LICENSE.md
[linguist]: https://github.com/github/linguist
[marketplace]: https://marketplace.visualstudio.com/items?itemName=adguard.adblock
[openvsx]: https://open-vsx.org/extension/adguard/adblock

<!-- Resource Links -->
[abp-extcss]: https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters#elemhide-emulation
[abp-snippets]: https://help.adblockplus.org/hc/en-us/articles/1500002338501-Snippet-filters-tutorial
[abp-syntax]: https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters
[adg-extcss]: https://github.com/AdguardTeam/ExtendedCss
[adg-scriptlets]: https://github.com/AdguardTeam/Scriptlets/blob/master/wiki/about-scriptlets.md
[adg-syntax]: https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
[compat-tables]: https://github.com/AdguardTeam/tsurlfilter/tree/master/packages/agtree/src/compatibility-tables
[mdn-css]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
[ubo-procedural]: https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters
[ubo-scriptlets]: https://github.com/gorhill/uBlock/wiki/Resources-Library
[ubo-syntax]: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
