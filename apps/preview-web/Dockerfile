FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS base


FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

# Node no longer bundles Corepack (removed by default since Node 25), so install it explicitly.
# renovate: datasource=npm depName=corepack
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ARG COREPACK_VERSION="0.35.0"
RUN npm install --ignore-scripts -g corepack@${COREPACK_VERSION} && corepack enable

WORKDIR /app
# # copy root workspace and lockfile
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages
# don't copy code for better caching
COPY apps/preview-web/package.json ./apps/preview-web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter preview-web...

COPY apps/preview-web ./apps/preview-web
RUN pnpm --filter preview-web build


# Production image, copy all the files and run next
FROM base AS runner

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

WORKDIR /app

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# https://nextjs.org/docs/app/api-reference/config/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/apps/preview-web/.next/standalone /app

# workaround for rar mappestruktur
COPY --from=builder --chown=nextjs:nodejs /app/apps/preview-web/.next/static ./apps/preview-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/preview-web/public ./apps/preview-web/public
WORKDIR /app/apps/preview-web

RUN apk add --no-cache curl

USER nextjs

EXPOSE 3000
ENV PORT=3000
HEALTHCHECK CMD curl --fail http://localhost:3000/api/health || exit 1

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
