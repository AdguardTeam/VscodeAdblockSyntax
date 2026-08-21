# Contributing & Development Guide

Thank you for your interest in contributing to the VSCode Adblock Syntax
project! This guide aims to provide essential information about the project and
outlines steps to contribute effectively.

Contributors to AdGuard projects can receive **various** rewards; please check
[this page][contribute] for details.

For detailed setup instructions, build commands, testing, and the full
development workflow, see [DEVELOPMENT.md](DEVELOPMENT.md). For code guidelines
and architecture, see [AGENTS.md](AGENTS.md).

## Releasing

`package.json` intentionally has no `version` field — the release version is
derived from `CHANGELOG.md` and injected by CI before packaging the `.vsix`.
Releases are fully automated via GitHub Actions (VS Marketplace + Open VSX +
public mirror). See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete pipeline.

[contribute]: https://adguard.com/contribute.html
