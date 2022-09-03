# Ad blocking rules syntax

Visual Studio Code extension that adds support for ad blocking filtering rules syntax. It is available on [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=adguard.adblock).

More information on the syntax:

* https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters
* https://adblockplus.org/en/filters

Known issues:

* https://github.com/ameshkov/VscodeAdblockSyntax/issues
* It is able to highlight some obvious mistakes, but it's not a full-scale linter

Demo:
```adblock
! This is an adblock rule
example.com#?#div:has(> section.ad)
```
