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

Publish still uses long-lived marketplace PATs (`vsce` / `ovsx` do not use
Marketplace OIDC here). The PATs are **not** GitHub Actions secrets — CI
loads them from Vault via GitHub OIDC (JWT):

| Item | Value |
| --- | --- |
| Vault URL | `vars.VAULT_URL` (org variable) |
| Auth | `method: jwt`, `path: jwt` |
| Role | `ext-vscode-adblock-syntax` |
| Secret path | `secret/data/ci-secrets/ext-vscode-adblock-syntax` |
| Fields | `vsce_pat`, `ovsx_pat` (lowercase) |

- **`vsce_pat`** — Azure DevOps PAT with Marketplace publish scope for the
  `adguard` publisher (was Bamboo `vsceTokenPassword`).
- **`ovsx_pat`** — Open VSX personal access token (was Bamboo
  `openVsxTokenPassword`).

The publish job needs `permissions.id-token: write` so
`hashicorp/vault-action@v4` can mint the JWT. Octopass / Slack / mirror
credentials stay on the shared org workflows (see
[Gaps and Follow-ups](#gaps-and-follow-ups)).

## Infrastructure Dependencies

Stateless VS Code extension — no database, cache, or message queue.
Distribution is via VS Marketplace, Open VSX, and the public GitHub mirror.

## Integrations

| Integration | Purpose | Configuration |
| --- | --- | --- |
| **Vault (ci-secrets)** | Marketplace PATs at publish time | OIDC JWT → role `ext-vscode-adblock-syntax` |
| **VS Marketplace** | Extension distribution | Vault `vsce_pat` + `vsce publish --pat` |
| **Open VSX** | Extension distribution | Vault `ovsx_pat` + `ovsx publish` |
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

Out of scope for this repository PR / already handled outside it:

1. **Vault ci-secrets** — `ci-secrets/ext-vscode-adblock-syntax` with role
   `ext-vscode-adblock-syntax` and fields `vsce_pat` / `ovsx_pat` (done by
   infra). Confirm the JWT role is bound to this repo +
   `publish-release.yml` (or the expected `job_workflow_ref`) before the
   first release.
2. **Optional GitHub Environment** — e.g. `marketplace` with required
   reviewers in `terraform-github` (similar to the `npm` environment used by
   library packages). Not wired yet so the first publish is not blocked on a
   missing environment.
3. **Octopass grants** — ensure `ext-vscode-adblock-syntax` is on
   `common-mirroring`, `keepchangelog-release-flow`, and
   `public-release-create` in microservices `grants.yaml` (private +
   `AdguardTeam/VscodeAdblockSyntax`). See
   https://github.com/AdGuardSoftwareLimited/microservices/pull/243.
4. **disallow-issue-refs** — add `ext-vscode-adblock-syntax` to the org
   ruleset in `terraform-github` (mirrored repo must not use bare `#123` in
   commits). See
   https://github.com/AdGuardSoftwareLimited/terraform-github/pull/226.
5. **Shared actions gap** — there is no org-wide
   `deploy-to-vscode-marketplace` reusable workflow yet. Publish steps live
   in this repo until one exists.

[ext-shared-actions]: https://github.com/AdGuardSoftwareLimited/ext-shared-actions
[actions]: https://github.com/AdGuardSoftwareLimited/actions
