# Deployment — adguard.adblock (VS Code extension)

- [Deployment Summary](#deployment-summary)
- [Release Pipeline](#release-pipeline)
- [CI/CD](#cicd)
- [Environment Variables and Secrets](#environment-variables-and-secrets)
- [Infrastructure Dependencies](#infrastructure-dependencies)
- [Integrations](#integrations)
- [Error Reporting](#error-reporting)
- [Docker Build](#docker-build)
- [Gaps and Follow-ups](#gaps-and-follow-ups)

## Deployment Summary

| Parameter | Value |
| --- | --- |
| **Marketplace id** | `adguard.adblock` |
| **Artifact** | `vscode-adblock.vsix` |
| **Public mirror** | `AdguardTeam/VscodeAdblockSyntax` |
| **Publish targets** | VS Marketplace, Open VSX |
| **Slack channel** | `#adguard-extension-vcs` |
| **Runner label** | `team-extensions` |

## Release Pipeline

This is a **VS Code extension**, not an npm package. The shared
[ext-shared-actions][ext-shared-actions] `publish-release.yml` (npm OIDC +
`.tgz`) is **not** used. The repo-local
[`.github/workflows/publish-release.yml`](.github/workflows/publish-release.yml)
reuses org building blocks and adds a local vsce/ovsx publish step.

In short:

1. A maintainer runs `prepare-release.yml` manually with a target tag
   (e.g. `v2.2.0` or `v2.1.5`) to open a release-bump PR that finalizes
   `CHANGELOG.md`.
2. Merging the release-bump PR triggers `publish-release.yml`, which:
   - tags the release commit from `CHANGELOG.md` (`tag-from-changelog`);
   - builds, tests, and packages the `.vsix` in Docker;
   - publishes to **VS Marketplace** (`vsce publish`) and **Open VSX**
     (`ovsx publish`);
   - mirrors the tag to `AdguardTeam/VscodeAdblockSyntax` and creates a
     GitHub Release with the `.vsix` attached (`mirror-and-release`);
   - notifies Slack (`#adguard-extension-vcs`).

### Pre-releases

VS Marketplace / Open VSX accept only `major.minor.patch` (no `-alpha` /
`-beta` suffixes). This project keeps the **odd/even minor** scheme:

- even minor (`2.0.x`, `2.2.x`) — stable release;
- odd minor (`2.1.x`, `2.3.x`) — Marketplace / Open VSX **pre-release**
  channel (`vsce`/`ovsx --pre-release`), GitHub Release marked prerelease.

This replaces the separate Bamboo build-prerelease / deploy-prerelease plans.
Keep pre-release versions numerically higher than the latest stable so the
editor does not downgrade pre-release users.

## CI/CD

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | PRs and pushes to `master` | Lint, test, build; upload `.vsix` |
| `prepare-release.yml` | Manual (`workflow_dispatch`) | Open release-bump PR for changelog |
| `publish-release.yml` | Release PR merged or re-run | Tag, build, publish, mirror, Slack |
| `mirror.yml` | Push to `master` | Mirror to `AdguardTeam/VscodeAdblockSyntax` |

Self-hosted jobs run on the `team-extensions` runner label. Org reusable
workflows come from [AdGuardSoftwareLimited/actions][actions].

**Concurrency**: `ci.yml` uses
`ci-ext-vscode-adblock-syntax-${{ github.ref }}` with
`cancel-in-progress: true`. `publish-release.yml` uses `publish-release`
with `cancel-in-progress: false` to serialize releases.

## Environment Variables and Secrets

Runtime extension code needs no CI-specific environment variables.

- **VS Marketplace — OIDC** (`vsce publish --oidc`): no long-lived secret.
  Needs a Marketplace **trusted publishing** policy for this repo +
  `publish-release.yml`, and job `permissions: id-token: write`.
- **Open VSX — `OVSX_PAT` secret**: PAT still required (no OIDC yet). Store as
  org/repo secret (or Vault → GH).

Octopass / Slack / mirror credentials are provided by the shared org
workflows and do not need per-project configuration once grants are in
place (see [Gaps and Follow-ups](#gaps-and-follow-ups)).

### Marketplace OIDC setup (one-time)

1. On [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
   publisher settings for `adguard`, add a **trusted publishing** policy for
   `AdGuardSoftwareLimited/ext-vscode-adblock-syntax` and the
   `publish-release.yml` workflow.
2. Ensure the publish job has `id-token: write` (already set in the workflow).
3. First publish must run from GitHub Actions (OIDC is not available locally).

`@vscode/vsce` is pinned to `3.9.3-5+` because that is the first line that
ships `--oidc`. Revisit when a stable `3.9.3` (or newer) lands.

## Infrastructure Dependencies

Stateless VS Code extension — no database, cache, or message queue.
Distribution is via VS Marketplace, Open VSX, and the public GitHub mirror.

## Integrations

| Integration | Purpose | Configuration |
| --- | --- | --- |
| **VS Marketplace** | Extension distribution | OIDC trusted publishing (`vsce --oidc`) |
| **Open VSX** | Extension distribution | `OVSX_PAT` + `ovsx publish` |
| **GitHub mirror** | Public mirror + Release | Octopass OIDC via shared workflows |
| **Slack** | Release notifications | `#adguard-extension-vcs` |

## Error Reporting

This project does **not** use an error reporting service (Sentry, Bugsnag,
or equivalent). Failures surface in CI logs and marketplace publish errors.

## Docker Build

The `Dockerfile` uses multi-stage builds based on `adguard/node-ssh:22.22--0`:

| Stage | Purpose | Key Steps |
| --- | --- | --- |
| `base` | Shared foundation | Node.js 22, pnpm from base image |
| `deps` | Dependency cache | Workspace manifests + frozen install |
| `source` | Full source | Copies project files over `deps` |
| `test-output` | CI validation | Typecheck, lint, test, production build |
| `build-output` | Artifact creation | Validation + `pnpm package` / `package:pre` |

The pnpm store cache is mounted at `/pnpm-store` with id `vscode-adblock-pnpm`.

### Local Build Commands

```bash
# Run CI validation (typecheck + lint + test + build)
docker build --target test-output .

# Produce the release artifact
docker build --platform linux/amd64 --target build-output \
   --build-arg VERSION=0.0.0-dev --output ./artifacts .
# → ./artifacts/vscode-adblock.vsix
```

`package.json` intentionally has no `version` field — CI injects the release
version before packaging, and `vsce` requires one. Pass a placeholder via the
`VERSION` build arg for local packaging. Set `PRE_RELEASE=true` to package with
`vsce --pre-release`.

## Gaps and Follow-ups

Out of scope for this repository PR, but required before the first GitHub
Actions release:

1. **Marketplace trusted publishing** — configure OIDC trust for this repo +
   `publish-release.yml` on the `adguard` publisher (no `VSCE_PAT`).
2. **Open VSX secret** — configure `OVSX_PAT` (org/repo secret or Vault → GH).
3. **Optional GitHub Environment** — e.g. `marketplace` with required
   reviewers in `terraform-github` (similar to the `npm` environment used by
   library packages). Not wired yet so the first publish is not blocked on a
   missing environment.
4. **Octopass grants** — ensure `ext-vscode-adblock-syntax` is on
   `common-mirroring`, `keepchangelog-release-flow`, and
   `public-release-create` in microservices `grants.yaml` (private +
   `AdguardTeam/VscodeAdblockSyntax`).
5. **disallow-issue-refs** — add `ext-vscode-adblock-syntax` to the org
   ruleset in `terraform-github` (mirrored repo must not use bare `#123` in
   commits).
6. **Shared actions gap** — there is no org-wide
   `deploy-to-vscode-marketplace` reusable workflow yet. Publish steps live
   in this repo until one exists.
7. **vsce stable OIDC** — drop the `@vscode/vsce` prerelease pin once a
   stable release includes `--oidc`.

[ext-shared-actions]: https://github.com/AdGuardSoftwareLimited/ext-shared-actions
[actions]: https://github.com/AdGuardSoftwareLimited/actions
