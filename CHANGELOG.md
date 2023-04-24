# VSCode Adblock Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][keepachangelog], and this project
adheres to [Semantic Versioning][semver].

[keepachangelog]: https://keepachangelog.com/en/1.0.0/
[semver]: https://semver.org/spec/v2.0.0.html

## [1.0.0] - 2023-04-25

### Added

- Added support for VSCode language server and client. This integrates
  [AGLint][aglint] into this extension. [#24](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/24)
- Added support for folding: [#59](https://github.com/AdguardTeam/VscodeAdblockSyntax/pull/59)

[aglint]: https://github.com/AdguardTeam/AGLint

### Changed

- More detailed README
- New logo

### Fixed

- Fix media queries highlighting: [#56](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/56)

## [0.0.28] - 2022-11-11

### Added

- Added support for optional arguments in uBO scriptlets: [#53](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/53)
- Added support for `env_legacy` condition: [#52](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/52)
- Added support for permissive domain names: [#10](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/10)

### Fixed

- Fix `!##`-like comments: [#54](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/54)
- Fix regex detection: [#51](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/51)

## [0.0.27] - 2022-08-15

### Added

- Added support for adblock agents: [#49](https://github.com/AdguardTeam/VscodeAdblockSyntax/pull/49)

### Fixed

- Fix redundant modifier detection: [#25](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/25)

## [0.0.26] - 2022-05-29

### Added

- Added support for cosmetic rules modifiers: [#47](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/47)

## [0.0.25] - 2021-11-11

### Added

- Added support for `Ctrl + /` hotkey to toggle comments: [#46](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/46)

## [0.0.23] - 2021-05-31

### Fixed

- Fixed an issue with `#if` directives marked invalid: [#44](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/44)

## [0.0.22] - 2021-05-30

### Added

- Added support for `$removeparam`, `$queryprune`: [#41](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/41)
- Added support for `$stealth`: [#39](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/39)
- Added support for multiple DNS filtering modifiers: `$client`, `$ctag`, `$dnsrewrite`, `$dnstype`: [#38](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/38)
- Added support for `safari_cb_affinity` hint: [#43](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/43)

### Changed

- Added more `#if` directive special symbols

### Fixed

- Fixed an issue with empty script argument: [#42](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/42)
- Fixed a bug with a single `#` comment: [#37](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/37)

## [0.0.21] - 2020-10-05

### Added

- Added support for `denyallow` and `redirect-rule` modifiers

## [0.0.20] - 2020-10-05

### Added

- Added ping modifier: [#33](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/33)
- Added extension modifier: [#31](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/31)
- Added more modifiers aliases: `all`, `1p`, `3p`, `css`, `frame`, `ghide`, `ehide`, `shide`, `specifichide`: [#34](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/34)

### Fixed

- Fixed scriptlet rules arguments: [#35](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/35)

## [0.0.19] - 2019-05-26

### Added

- Added helper modifiers support: `xhr`, `first-party`, `inline-script`, `inline-font`: [#23](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/23)

### Fixed

- Fixed: handle `cookie`, `csp`, `replace` without value: [#29](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/29)
- Fixed: matching of content filtering rules without attribute selectors: [#28](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/28)

## [0.0.18] - 2019-05-17

### Fixed

- Fixed: domains with `-` are marked as invalid: [#27](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/4227)

## [0.0.16] - 2019-05-16

### Changed

- Improved the `$domain` modifier performance: [#26](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/26)

### Added

- Added `$redirect` modifier support: [#21](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/21)
- Added `$rewrite` modifier support: [#22](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/22)

## [0.0.15] - 2019-04-06

### Added

- Added ABP snippets syntax support: [#14](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/14)

### Fixed

- Fixed regex highlighting issue: [#18](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/18)

## [0.0.14] - 2019-04-06

### Added

- Added $cookie modifier support: [#16](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/16)
- Added AdGuard scriptlet rules support: [#20](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/20)
- Added uBO `##^` and `##+js` syntax support: [#15](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/15)
- Added support for TLD domain restriction: [#19](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/19)

## [0.0.12] - 2018-10-18

### Added

- Added hints and pre-processor syntax

## [0.0.11] - 2018-08-30

### Fixed

- Fixed an issue with CSS rules highlighting: [#13](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/13)

## [0.0.9] - 2018-08-30

### Added

- Added new elemhide and CSS rules markers: [#11](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/11)
- Added $websocket, $webrtc, $xmlhttprequest, $app: [#9](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/9)

### Fixed

- Fixed an issue with valid rules marked as invalid: [#12](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/12)

## [0.0.8] - 2018-01-16

### Added

- Added $replace modifier support: [#3](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/3)
- Added basic regex rules hightighting: [#8](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/8)

### Fixed

- Fixed comments highlighting: [#6](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/6)

## [0.0.6] - 2018-01-15

### Changed

- Improve extension's description & meta data

## [0.0.5] - 2017-12-29

### Fixed

- Fixed punycode domains handling

## [0.0.4] - 2017-12-29

### Fixed

- Fixed CSS selector regular expression
- Fixed one more issue with CSS rules detection

## [0.0.2] - 2017-12-29

### Fixed

- Fixed domain validation rules: [#1](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/1)
- Fixed an issue with elemhide/css rules detection: [#1](https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/1)

## [0.0.1] - 2017-12-29

### Added

- Initial release
