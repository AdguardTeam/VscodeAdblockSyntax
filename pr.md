#### **Type of Changes**

- [x] ✨ **New feature**
- [x] ♻️ **Refactoring**

#### **Description**

Migrates CI/CD for the VS Code extension (`adguard.adblock`) from Bamboo to GitHub Actions.

Removes `bamboo-specs/` and the legacy `check.yml`, and adds CI, prepare-release, publish-release, and mirror workflows on `team-extensions`. Unlike npm-library migrations, this does not use `ext-shared-actions/publish-release.yml` (npm + `.tgz`). Publish is repo-local: org blocks for tagging/mirroring/Slack, plus `vsce` / `ovsx` for the marketplaces.

Also adds a multi-stage Dockerfile that produces `vscode-adblock.vsix`, drops the committed `version` field and `increment` script (version is injected from `CHANGELOG.md`), normalizes the changelog to Keep a Changelog (`## [x.y.z]` headings for `tag-from-changelog`), and documents the pipeline in `DEPLOYMENT.md`.

Odd-minor versions still map to Marketplace / Open VSX pre-release (replacing Bamboo prerelease plans).

**TODO before first release (not in this PR):**
- Configure **VS Marketplace OIDC trusted publishing** for `AdGuardSoftwareLimited/ext-vscode-adblock-syntax` + `publish-release.yml` on the `adguard` publisher (`vsce publish --oidc`; no `VSCE_PAT`).
- Add **`OVSX_PAT`** GitHub org/repo secret for Open VSX (still PAT-only; no OIDC).

#### **Testing Instructions**

- Open a PR against `master` and confirm CI typechecks, lints, tests, builds, and uploads the `.vsix`.
- Locally: `pnpm lint`, `pnpm test`, `pnpm test:compile`, `pnpm build`.
- Docker: `docker build --platform linux/amd64 --target test-output .` and `docker build --platform linux/amd64 --target build-output --build-arg VERSION=0.0.0-dev --output ./artifacts .`
- Optional local package: `npm pkg set version=0.0.0-dev && pnpm package`.

#### **Browser Support**

- [x] All browsers

#### **Affected Areas**

- CI/CD — Bamboo and legacy public workflows removed; GitHub Actions for test/build, release prep, marketplace publish, and mirror to `AdguardTeam/VscodeAdblockSyntax`.
- Build system — multi-stage Dockerfile for validation and `.vsix` packaging; changelog-driven version injection; `@vscode/vsce` bumped for OIDC publish.
- Documentation — `DEPLOYMENT.md` added; AGENTS/DEVELOPMENT/CONTRIBUTING and changelog format updated for the new pipeline.

#### **Backward Compatibility**

- **Is this change backwards-compatible?** Yes

Extension runtime is unchanged. Published VSIX still carries the real version (injected by CI). Local packaging needs an explicit version or Docker `VERSION` arg.

#### **Screenshots**

N/A — no user-visible changes.

#### **Additional Notes**

- Release runs are serialized; self-hosted jobs use `team-extensions`.
- Marketplace auth is OIDC; Open VSX still needs `OVSX_PAT` (see TODO in Description).
- Octopass grants and `disallow-issue-refs` for this repo are handled separately (terraform-github / microservices).
- `@vscode/vsce` is on `3.9.3-5` for `--oidc` until a stable release includes it.
