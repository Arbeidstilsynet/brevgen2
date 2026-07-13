FROM node:25-trixie-slim@sha256:ffc78385a788964bb3cbab5e434ff79a10bdc25b8ae6db03fe5fe6cb14053c09 AS base
FROM base AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

RUN npm install -g corepack
RUN corepack enable

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# don't copy code yet for better caching
COPY apps/api/package.json ./apps/api/
COPY packages/dynamic-markdown/package.json ./packages/dynamic-markdown/
COPY packages/document-templates/package.json ./packages/document-templates/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm_config_verify_deps_before_run=false pnpm --filter api build


FROM base AS runner

# Install Chromium and other dependencies from the base image's (Debian trixie) default repos
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium-common chromium \
    && apt-get install -y --no-install-recommends fontconfig \
    && apt-get install -y --no-install-recommends curl \
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
