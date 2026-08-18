# Multi-stage Dockerfile for the VS Code adblock extension monorepo.
# Dependencies are cached until package manifests / lockfile change.
# Each stage can be built independently via --target.

FROM adguard/node-ssh:22.22--0 AS base
SHELL ["/bin/bash", "-lc"]

WORKDIR /extension

# pnpm store directory — set once here, no need for pnpm config set in every RUN
ENV npm_config_store_dir=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json / workspace manifests / lockfile change
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY syntaxes/package.json ./syntaxes/
COPY tools/package.json ./tools/
COPY test/static/aglint/package.json ./test/static/aglint/

# --ignore-scripts: skips husky install (prepare script) which requires a git repo
RUN --mount=type=cache,target=/pnpm-store,id=vscode-adblock-pnpm \
    pnpm install \
        --frozen-lockfile \
        --ignore-scripts \
        --prefer-offline

# ============================================================================
# Stage: source
# Cached until source code changes
# ============================================================================
FROM deps AS source

COPY . /extension

# ============================================================================
# Stage: test-output
# Runs typecheck, lint, tests, and production build.
# Used as the CI validation target: `docker build --target test-output .`
# fails if any step fails.
# ============================================================================
FROM source AS test-output

ARG BUILD_RUN_ID=""

RUN --mount=type=cache,target=/pnpm-store,id=vscode-adblock-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    pnpm --filter @vscode-adblock-syntax/shared build && \
    pnpm test:compile && \
    pnpm lint:md && \
    pnpm lint:code && \
    pnpm test && \
    pnpm build

# ============================================================================
# Stage: build
# Builds the extension and packages a .vsix for publishing / release assets.
# ============================================================================
FROM source AS build

ARG BUILD_RUN_ID=""

# Optional package version for local builds. CI injects the release version
# into package.json before building the image; locally this arg is required
# because package.json has no version field and vsce needs one.
ARG VERSION=""

# When true, package with `vsce package --pre-release` (Marketplace pre-release).
ARG PRE_RELEASE="false"

RUN --mount=type=cache,target=/pnpm-store,id=vscode-adblock-pnpm \
    echo "${BUILD_RUN_ID}" > /tmp/.build-run-id && \
    if [ -n "${VERSION}" ]; then npm pkg set version="${VERSION}"; fi && \
    pnpm --filter @vscode-adblock-syntax/shared build && \
    pnpm test:compile && \
    pnpm lint:md && \
    pnpm lint:code && \
    pnpm test && \
    pnpm build && \
    if [ "${PRE_RELEASE}" = "true" ]; then \
        pnpm package:pre; \
    else \
        pnpm package; \
    fi && \
    mkdir -p /out/artifacts && \
    cp out/vscode-adblock.vsix /out/artifacts/ && \
    if [ -f syntaxes/out/adblock.plist ]; then \
        cp syntaxes/out/adblock.plist /out/artifacts/; \
    fi

FROM scratch AS build-output
COPY --from=build /out/artifacts/ /
