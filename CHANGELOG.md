# Change Log

## 0.0.27

- Added support for adblock agents
- Fix redundant modifier detection: #25

## 0.0.26

- Added support for cosmetic rules modifiers: #47

## 0.0.25

- `Ctrl + /` to comment: #46

## 0.0.23

- Fixed an issue with `#if` directives marked invalid: #44

## 0.0.22

- Added support for `$removeparam`, `$queryprune`: #41
- Added support for `$stealth`: #39
- Multiple DNS filtering modifiers: `$client`, `$ctag`, `$dnsrewrite`, `$dnstype`: #38
- Added support for `safari_cb_affinity` hint: #43
- Fixed an issue with empty script argument: #42
- Fixed a bug with a single `#` comment: #37
- Added more `#if` directive special symbols

## 0.0.21

- Added `denyallow` and `redirect-rule` modifiers

## 0.0.20

- Fixed scriptlet rules arguments: #35
- Added ping modifier: #33
- Added extension modifier: #31
- Added more modifiers aliases: `all`, `1p`, `3p`, `css`, `frame`, `ghide`, `ehide`, `shide`, `specifichide`: #34

## 0.0.19

- Added helper modifiers support: `xhr`, `first-party`, `inline-script`, `inline-font`: #23
- Fixed: handle `cookie`, `csp`, `replace` without value: #29
- Fixed: matching of content filtering rules without attribute selectors: #28

## 0.0.18

- Fixed: domains with "-" are marked as invalid: #27

## 0.0.16

- Improved the $domain modifier performance: #26
- Added $redirect modifier support: #21
- Added $rewrite modifier support: #22

## 0.0.15

- Added ABP snippets syntax support: #14
- Fixed regex highlighting issue: #18

## 0.0.14

- Added $cookie modifier support: #16
- Added AdGuard scriptlet rules support: #20
- Added uBO ##^ and ##+js syntax support: #15
- Added support for TLD domain restriction: #19

## 0.0.12

- Added hints and pre-processor syntax

## 0.0.11

- Fixed an issue with CSS rules highlighting: #13

## 0.0.9

- Added new elemhide and CSS rules markers: #11
- Added $websocket, $webrtc, $xmlhttprequest, $app: #9
- Fixed an issue with valid rules marked as invalid: #12

## 0.0.8

- Added $replace modifier support: #3
- Fixed comments highlighting: #6
- Added basic regex rules hightighting: #8

## 0.0.6

- Improve extension's description & meta data

## 0.0.5

- Fixed punycode domains handling

## 0.0.4

- Fixed CSS selector regular expression
- Fixed one more issue with CSS rules detection

## 0.0.2

- Fixed domain validation rules: #1
- Fixed an issue with elemhide/css rules detection: #1

## 0.0.1

- Initial release
