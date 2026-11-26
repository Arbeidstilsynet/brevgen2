FROM ghcr.io/pnpm/pnpm:12@sha256:4f92e7dc6a1f6c3475c5fc7c4fdd22818e61adb59c75bef9e87aa0a6bf7cd61f AS base

# The build output is platform independent (bundled JS + static assets), so pin the builder to the
# native build platform. Cross-platform builds then only emulate the much cheaper runner stage.
FROM --platform=$BUILDPLATFORM base AS builder

WORKDIR /app

# don't copy code yet for better caching
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/dynamic-markdown/package.json ./packages/dynamic-markdown/
COPY packages/document-templates/package.json ./packages/document-templates/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config-typescript/package.json ./packages/config-typescript/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter api build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    PUPPETEER_SKIP_DOWNLOAD=true pnpm --filter api deploy --prod /prod


FROM node:26-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS runner

### Versions managed by Renovate
### https://docs.renovatebot.com/presets-customManagers/#custommanagersdockerfileversions
### https://docs.renovatebot.com/modules/datasource/repology/
# For available Chromium versions in the distro, see https://repology.org/project/chromium/versions
# Chromium versions changes should be matched with Puppeteer version from https://pptr.dev/supported-browsers
# renovate: datasource=repology depName=alpine_3_24/chromium versioning=loose
ARG CHROMIUM_VERSION="158.0.8127.36-r0"
# renovate: datasource=repology depName=alpine_3_24/fontconfig versioning=loose
ARG FONTCONFIG_VERSION="2.17.1-r1"

# Install specific Chromium headless shell version and fontconfig from Alpine's repos,
# upgrading base packages to pick up security fixes.
RUN apk upgrade --no-cache \
    && apk add --no-cache \
    chromium-headless-shell="${CHROMIUM_VERSION}" \
    fontconfig="${FONTCONFIG_VERSION}"

# Copy custom fonts
COPY apps/api/fonts/*.ttf /usr/share/fonts/truetype/custom/

# Download Noto Color Emoji font (COLRv1, vector-based, Chromium-compatible)
# License: SIL Open Font License 1.1 — see /usr/share/fonts/truetype/custom/LICENSE-NotoEmoji
# renovate: datasource=github-tags depName=googlefonts/noto-emoji
ARG NOTO_EMOJI_VERSION="v2.051"
ADD --chmod=644 "https://github.com/googlefonts/noto-emoji/raw/${NOTO_EMOJI_VERSION}/fonts/Noto-COLRv1.ttf" \
    /usr/share/fonts/truetype/custom/Noto-COLRv1.ttf
ADD --chmod=644 "https://github.com/googlefonts/noto-emoji/raw/${NOTO_EMOJI_VERSION}/fonts/LICENSE" \
    /usr/share/fonts/truetype/custom/LICENSE-NotoEmoji

RUN fc-cache -fv \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

ENV NODE_ENV=production
# Point at the real binary rather than the /usr/bin symlink; launching via symlink breaks Puppeteer.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/lib/chromium/chromium-headless-shell
ENV XDG_CONFIG_HOME=/tmp/.chromium
ENV XDG_CACHE_HOME=/tmp/.chromium

WORKDIR /app

COPY --from=builder /prod ./

# Match the UID and GID enforced by Nais when running this image elsewhere.
USER 1069:1069

EXPOSE 4000

CMD ["node", "dist/server.mjs"]
