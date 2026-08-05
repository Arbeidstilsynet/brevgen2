FROM node:26-trixie-slim@sha256:deae974a69e140f44f434ab29cb519fb5f8fe250fd364b8ca446bd0761acdc6a AS base

# The build output is platform independent (bundled JS + static assets), so pin the builder to the
# native build platform. Cross-platform builds then only emulate the much cheaper runner stage.
FROM --platform=$BUILDPLATFORM base AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Node no longer bundles Corepack (removed by default since Node 25), so install it explicitly.
# renovate: datasource=npm depName=corepack
ARG COREPACK_VERSION="0.35.0"
RUN npm install -g corepack@${COREPACK_VERSION} && corepack enable

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# don't copy code yet for better caching
COPY apps/api/package.json ./apps/api/
COPY packages/dynamic-markdown/package.json ./packages/dynamic-markdown/
COPY packages/document-templates/package.json ./packages/document-templates/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config-typescript/package.json ./packages/config-typescript/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm_config_verify_deps_before_run=false pnpm --filter api build


FROM base AS runner
# For available Chromium versions in the distro, see https://repology.org/project/chromium/versions
# Chromium versions changes should be matched with Puppeteer version from https://pptr.dev/supported-browsers
ARG CHROMIUM_VERSION="151.*"

### Versions managed by Renovate
### https://docs.renovatebot.com/presets-customManagers/#custommanagersdockerfileversions
### https://docs.renovatebot.com/modules/datasource/repology/
# renovate: datasource=repology depName=debian_13/fontconfig versioning=loose
ENV FONTCONFIG_VERSION="2.15.0-2.3"

# Install specific Chromium version and other dependencies from the base image's (Debian trixie) default repos
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    chromium-common=${CHROMIUM_VERSION} \
    chromium=${CHROMIUM_VERSION} \
    fontconfig=${FONTCONFIG_VERSION} \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy custom fonts
COPY apps/api/fonts/*.ttf /usr/share/fonts/truetype/custom/

# Download Noto Color Emoji font (COLRv1, vector-based, Chromium-compatible)
# License: SIL Open Font License 1.1 — see /usr/share/fonts/truetype/custom/LICENSE-NotoEmoji
# renovate: datasource=github-tags depName=googlefonts/noto-emoji
ARG NOTO_EMOJI_VERSION="v2.051"
ADD "https://github.com/googlefonts/noto-emoji/raw/${NOTO_EMOJI_VERSION}/fonts/Noto-COLRv1.ttf" /usr/share/fonts/truetype/custom/Noto-COLRv1.ttf
ADD "https://github.com/googlefonts/noto-emoji/raw/${NOTO_EMOJI_VERSION}/fonts/LICENSE" /usr/share/fonts/truetype/custom/LICENSE-NotoEmoji

RUN fc-cache -fv

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
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


EXPOSE 4000

CMD ["node", "dist/server.mjs"]
