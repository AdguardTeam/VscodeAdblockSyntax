# VSCode Adblock Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning].

[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html

## [2.0.1] (prerelease) - 2025-11-28

### Added

- Support for multi-root workspaces [#112].
- `Remove this rule` quick fix option [#126].
- Support for applying various fixes offered by AGLint [#127].
- Support for detecting package manager automatically [#117].
- `enableAglintDebug` and `enableInMemoryAglintCache` (experimental, disabled by default) settings.

### Changed

- Updated extension for AGLint `v4.0.0`.
- Updated `husky` dependency to version `9.0.1` [#129].

### Removed

- Integrated version of AGLint. From now on, AGLint only works if it is installed separately.
  This provides more consistent behavior.
  This removed `useExternalAglintPackages` setting.
- `packageManager` setting. It is now detected automatically.

[2.0.1]: https://github.com/AdguardTeam/VscodeAdblockSyntax/compare/1.1.17...2.0.1
[#112]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/112
[#117]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/117
[#126]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/126
[#127]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/127
[#129]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/129

## 1.1.17 - 2024-05-05

### Added

- Support for a new `cli` platform [#149].

### Changed

- Updated integrated [AGLint] to v2.1.5.

[#149]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/149

## 1.1.16 - 2025-03-31

### Added

- Support for `NOT_VALIDATE` hint [#147].

### Changed

- Updated integrated [AGLint] to v2.1.4

[#147]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/147

## 1.1.15 - 2024-12-20

### Changed

- Updated integrated [AGLint] to v2.1.3.

## 1.1.14 - 2024-09-21

### Added

- Highlighting for `ext_chromium_mv3` platform name [#138].

### Changed

- Updated integrated [AGLint] to v2.1.1.

[#138]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/138

## 1.1.13 - 2024-09-20

### Changed

- Updated integrated [AGLint] to v2.1.0.

## 1.1.12 - 2024-09-04

### Changed

- Updated integrated [AGLint] to v2.0.10.

## 1.1.11 - 2024-08-23

### Added

- Support of `advanced` value for `!#safari_cb_affinity` directive [FiltersCompiler#226].

[FiltersCompiler#226]: https://github.com/AdguardTeam/FiltersCompiler/issues/226

## 1.1.10 - 2024-04-26

### Changed

- Updated integrated [AGLint] to v2.0.9.

## 1.1.8 - 2024-04-03

### Fixed

- Highlighting for `#@%#//scriptlet()` like rules [#132].

[#132]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/132

## 1.1.7 - 2024-01-10

### Added

- Support for quick fixes [#122].
- Minimum version check for external AGLint installations [#123].

### Changed

- Updated integrated [AGLint] to v2.0.8.

[#122]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/122
[#123]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/123

## 1.1.6 - 2024-01-04

### Fixed

- AGLint module import problem [#113].

[#113]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/113

## 1.1.5 - 2023-11-10

### Added

- Release for Open VSX [#91].

### Fixed

- Highlighting for uBO style comments [#102].
- Highlighting for `!#if`'s variables [#68].
- Highlighting for escaped commas in uBO scriptlets [#95].
- Highlighting for uBO and ABP exception scriptlet rules [#119].

[#68]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/68
[#91]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/91
[#95]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/95
[#102]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/102
[#119]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/119

## 1.1.3 - 2023-11-08

### Added

- Highlighting for `$permissions` modifier [#114].
- Highlighting for `$referrerpolicy` modifier [#93].
- Highlighting for `$beacon`, `$header` and `$doc` modifiers [#69].
- Highlighting for `!#else` directive [#115].
- Highlighting for `$url` cosmetic rule modifier [#92].

### Changed

- Updated integrated [AGLint] to v2.0.6.

### Fixed

- Highlighting for `$strict1p` and `$strict3p` modifiers [#69].

[#69]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/69
[#92]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/92
[#93]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/93
[#114]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/114
[#115]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/115

## 1.1.2 - 2023-09-07

### Changed

- Updated integrated [AGLint] to v2.0.5.

## 1.1.1 - 2023-08-30

### Changed

- Updated integrated [AGLint] to v2.0.4.


## 1.1.0 - 2023-08-14

### Added

- Support for detecting external AGLint installations [#90].
- Support for JS syntax embedding [#83].
- Information about the color scheme [#94].

### Changed

- JSON TM grammar is converted to YAML [#61].
- Improved contribution guidelines [#85].
- Various code and development improvements [#77], [#80], [#82], [#104], [#105], [#107], [#108].
- Update integrated [AGLint] to v2.0.1.

### Fixed

- Ignore files [#84].

[#61]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/61
[#77]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/77
[#80]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/80
[#82]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/82
[#83]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/83
[#84]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/84
[#90]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/90
[#94]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/94
[#104]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/104
[#105]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/105
[#107]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/107
[#108]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/108

## 1.0.1 - 2023-04-25

### Added

- Support for VSCode language server and client. This integrates
  [AGLint] v1.0.11 into this extension [#24].
- Support for folding [#59].

### Changed

- More detailed README.
- New logo.

### Fixed

- Media queries highlighting [#56].

[#24]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/24
[#56]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/56
[#59]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/59

## 0.0.28 - 2022-11-11

### Added

- Support for optional arguments in uBO scriptlets [#53].
- Support for `env_legacy` condition [#52].
- Support for permissive domain names [#10].

### Fixed

- `!##`-like comments [#54].
- Regex detection [#51].

[#10]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/10
[#51]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/51
[#52]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/52
[#53]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/53
[#54]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/54

## 0.0.27 - 2022-08-15

### Added

- Support for adblock agents [#49].

### Fixed

- Redundant modifier detection [#25].

[#25]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/25
[#49]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/49

## 0.0.26 - 2022-05-29

### Added

- Support for cosmetic rules modifiers [#47].

[#47]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/47

## 0.0.25 - 2021-11-11

### Added

- Support for `Ctrl + /` hotkey to toggle comments [#46].

[#46]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/46

## 0.0.23 - 2021-05-31

### Fixed

- `#if` directives marked invalid [#44].

[#44]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/44

## 0.0.22 - 2021-05-30

### Added

- Support for `$removeparam`, `$queryprune` [#41].
- Support for `$stealth` [#39].
- Support for multiple DNS filtering modifiers: `$client`, `$ctag`, `$dnsrewrite`, `$dnstype` [#38].
- Support for `!#safari_cb_affinity` directive [#43].

### Changed

- More `#if` directive special symbols.

### Fixed

- Empty script argument [#42].
- Single `#` comment [#37].

[#37]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/37
[#38]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/38
[#39]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/39
[#41]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/41
[#42]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/42
[#43]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/43

## 0.0.21 - 2020-10-05

### Added

- Support for `$denyallow` and `$redirect-rule` modifiers.

## 0.0.20 - 2020-10-05

### Added

- Support for `$ping` modifier [#33].
- Support for `$extension` modifier [#31].
- Support for modifiers aliases:
  `$all`, `$1p`, `$3p`, `$css`, `$frame`, `$ghide`, `$ehide`, `$shide`, `$specifichide` [#34].

### Fixed

- Scriptlet rules arguments [#35].

[#31]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/31
[#33]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/33
[#34]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/34
[#35]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/35

## 0.0.19 - 2019-05-26

### Added

- Helper modifiers support: `$xhr`, `$first-party`, `$inline-script`, `$inline-font` [#23].

### Fixed

- Handle `$cookie`, `$csp`, `$replace` without value [#29].
- Matching of content filtering rules without attribute selectors [#28].

[#23]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/23
[#28]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/28
[#29]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/29

## 0.0.18 - 2019-05-17

### Fixed

- Domains with `-` are marked as invalid [#27].

## 0.0.16 - 2019-05-16

### Changed

- Improved `$domain` modifier performance [#26].

### Added

- `$redirect` modifier support [#21].
- `$rewrite` modifier support [#22].

[#21]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/21
[#22]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/22
[#26]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/26
[#27]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/27

## 0.0.15 - 2019-04-06

### Added

- ABP snippets syntax support [#14].

### Fixed

- Regex highlighting issue [#18].

[#14]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/14
[#18]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/18

## 0.0.14 - 2019-04-06

### Added

- `$cookie` modifier support [#16].
- AdGuard scriptlet rules support [#20].
- uBO `##^` and `##+js` syntax support [#15].
- TLD domain restriction [#19].

[#15]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/15
[#16]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/16
[#19]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/19
[#20]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/20

## 0.0.12 - 2018-10-18

### Added

- Hints and pre-processor syntax.

## 0.0.11 - 2018-08-30

### Fixed

- CSS rules highlighting [#13].

[#13]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/13

## 0.0.9 - 2018-08-30

### Added

- Added new elemhide and CSS rules markers [#11].
- `$websocket`, `$webrtc`, `$xmlhttprequest`, `$app` [#9].

### Fixed

- Valid rules marked as invalid [#12].

[#9]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/9
[#11]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/11
[#12]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/12

## 0.0.8 - 2018-01-16

### Added

- `$replace` modifier support [#3].
- Basic regex rules highlighting [#8].

### Fixed

- Comments highlighting [#6].

[#3]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/3
[#6]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/6
[#8]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/8

## 0.0.6 - 2018-01-15

### Changed

- Improve extension's description & meta data.

## 0.0.5 - 2017-12-29

### Fixed

- `punycode` domains handling.

## 0.0.4 - 2017-12-29

### Fixed

- CSS selector regular expression.
- CSS rules detection.

## 0.0.2 - 2017-12-29

### Fixed

- Domain validation rules [#1].
- Elemhide/CSS rules detection [#1].

[#1]: https://github.com/AdguardTeam/VscodeAdblockSyntax/issues/1

## 0.0.1 - 2017-12-29

### Added

- Initial release

[AGLint]: https://github.com/AdguardTeam/AGLint/blob/master/CHANGELOG.md
