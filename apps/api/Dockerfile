ARG CHROMIUM_VERSION="139.*"

FROM node:22-slim@sha256:88f44fbb06cc98e1451e4e015c122f84030ec55c603f753ed97b889db0bb8d4d AS base
FROM base AS builder

RUN npm i -g corepack@latest && corepack enable

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# temp custom build script for docker, replace with normal build after removing lambda support
RUN pnpm --filter api build:docker


FROM base AS runner
ARG CHROMIUM_VERSION

### Versions managed by Renovate
### https://dev.azure.com/Atil-utvikling/Produkter%20og%20tjenester/_git/infra-renovate?anchor=custom-managers
# renovate: datasource=repology depName=debian_12/fontconfig versioning=loose
ENV FONTCONFIG_VERSION="2.14.1-4"
# renovate: datasource=repology depName=debian_12_backports/curl versioning=loose
ENV CURL_VERSION="8.14.1-2~bpo12+1"

# Install specific Chromium version and other dependencies
RUN echo "deb http://security.debian.org/debian-security bookworm-security main" > /etc/apt/sources.list.d/security.list \
    && echo "deb http://deb.debian.org/debian bookworm-backports main" > /etc/apt/sources.list.d/backports.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends chromium-common=${CHROMIUM_VERSION} chromium=${CHROMIUM_VERSION} \
    && apt-get install -y --no-install-recommends fontconfig=${FONTCONFIG_VERSION} \
    && apt-get install -y --no-install-recommends -t bookworm-backports curl=${CURL_VERSION} \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create directory for custom fonts
RUN mkdir -p /usr/share/fonts/truetype/custom
COPY apps/api/fonts/*.ttf /usr/share/fonts/truetype/custom/
RUN fc-cache -fv

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV XDG_CONFIG_HOME=/tmp/.chromium
ENV XDG_CACHE_HOME=/tmp/.chromium

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/apps/api/package.json ./
# WORKAROUND: Copy packages to ensure workspace references work
COPY --from=builder /app/packages ./packages

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "server.cjs"]
