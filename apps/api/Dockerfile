FROM node:24-slim@sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc AS base
FROM base AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# don't copy code yet for better caching
COPY apps/api/package.json ./apps/api/
COPY packages/dynamic-markdown/package.json ./packages/dynamic-markdown/
COPY packages/document-templates/package.json ./packages/document-templates/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm_config_verify_deps_before_run=false pnpm --filter api build


FROM base AS runner
# For available Chromium versions in the distro, see https://repology.org/project/chromium/versions
# Chromium versions changes should be matched with Puppeteer version from https://pptr.dev/supported-browsers
ARG CHROMIUM_VERSION="149.*"

### Versions managed by Renovate
### https://docs.renovatebot.com/presets-customManagers/#custommanagersdockerfileversions
### https://docs.renovatebot.com/modules/datasource/repology/
# renovate: datasource=repology depName=debian_12/fontconfig versioning=loose
ENV FONTCONFIG_VERSION="2.14.1-4"
# renovate: datasource=repology depName=debian_12_backports/curl versioning=loose
ENV CURL_VERSION="8.14.1-2+deb13u2~bpo13+1"

# Install specific Chromium version and other dependencies
RUN echo "deb http://security.debian.org/debian-security bookworm-security main" > /etc/apt/sources.list.d/security.list \
    && echo "deb http://deb.debian.org/debian bookworm-backports main" > /etc/apt/sources.list.d/backports.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends chromium-common=${CHROMIUM_VERSION} chromium=${CHROMIUM_VERSION} \
    && apt-get install -y --no-install-recommends fontconfig=${FONTCONFIG_VERSION} \
    && apt-get install -y --no-install-recommends -t bookworm-backports curl=${CURL_VERSION} \
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

HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/server.mjs"]
