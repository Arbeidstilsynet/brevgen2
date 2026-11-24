FROM ghcr.io/pnpm/pnpm:12@sha256:349c846c6c9dab76b2f6fbf4b2df14d5a8c9b2a0fce92fc7e5c2eec3f437e801 AS base

# The build output is platform independent (bundled JS + static assets), so pin the builder to the
# native build platform. Cross-platform builds then only emulate the much cheaper runner stage.
FROM --platform=$BUILDPLATFORM base AS deps

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


FROM deps AS builder

COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter api build


FROM node:26-trixie-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5 AS runner

### Versions managed by Renovate
### https://docs.renovatebot.com/presets-customManagers/#custommanagersdockerfileversions
### https://docs.renovatebot.com/modules/datasource/repology/
# renovate: datasource=repology depName=debian_13/fontconfig versioning=deb
ARG FONTCONFIG_VERSION="2.15.0-2.3"

# Install the Chrome for Testing headless shell pinned by Puppeteer in the lockfile, plus its system
# dependencies from the base image's (Debian trixie) default repos. Mount deps rather than builder so
# source-only changes don't invalidate this layer.
RUN --mount=type=bind,from=deps,source=/app,target=/build \
    apt-get update \
    && apt-get install -y --no-install-recommends unzip fontconfig=${FONTCONFIG_VERSION} \
    && chrome=$(PUPPETEER_CACHE_DIR=/tmp/puppeteer /build/apps/api/node_modules/.bin/puppeteer \
    browsers install chrome-headless-shell --install-deps --format "{{path}}") \
    && mv "$(dirname "${chrome}")" /opt/chrome-headless-shell \
    && rm -rf /tmp/puppeteer \
    && apt-get purge -y unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

RUN fc-cache -fv

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/opt/chrome-headless-shell/chrome-headless-shell
ENV XDG_CONFIG_HOME=/tmp/.chromium
ENV XDG_CACHE_HOME=/tmp/.chromium

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
# for trivy scanning purposes (dependency-track)
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy static assets for @fastify/swagger-ui (which is external)
COPY --from=builder /app/apps/api/node_modules/@fastify/swagger-ui/static ./static
COPY --from=builder /app/apps/api/node_modules/@fastify/swagger-ui/static/logo.svg ./dist/static/logo.svg

# Match the UID and GID enforced by Nais when running this image elsewhere.
USER 1069:1069

EXPOSE 4000

CMD ["node", "dist/server.mjs"]
