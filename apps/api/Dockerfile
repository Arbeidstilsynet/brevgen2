ARG CHROMIUM_VERSION="134.*"

FROM node:22-slim@sha256:6bba748696297138f802735367bc78fea5cfe3b85019c74d2a930bc6c6b2fac4 as base
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

# Install specific Chromium version
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium-common=${CHROMIUM_VERSION} chromium=${CHROMIUM_VERSION} fonts-noto-color-emoji fontconfig curl \
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
