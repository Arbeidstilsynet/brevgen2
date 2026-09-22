FROM ghcr.io/pnpm/pnpm:12@sha256:0a4219f2ae582bce0e52073876c20e6387147f0809d8546744d87243797633ed AS base

# The build output is platform independent (bundled JS + static assets), so pin the builder to the
# native build platform. Cross-platform builds then only emulate the much cheaper runner stage.
FROM --platform=$BUILDPLATFORM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# don't copy code for better caching
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/preview-web/package.json ./apps/preview-web/
COPY packages/dynamic-markdown/package.json ./packages/dynamic-markdown/
COPY packages/document-templates/package.json ./packages/document-templates/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config-typescript/package.json ./packages/config-typescript/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter preview-web...

COPY apps/preview-web ./apps/preview-web
COPY packages/ ./packages
RUN pnpm --filter preview-web build


# Production image, copy all the files and run next
FROM node:26-alpine@sha256:dbaa92e5758cbbcf85d65d5403fdb530fe3442cbe8c6dbfb7ef23365450d5070 AS runner

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
