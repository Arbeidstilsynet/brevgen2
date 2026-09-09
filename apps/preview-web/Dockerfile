FROM ghcr.io/pnpm/pnpm:12@sha256:4fcb6db39468ecafef34f3e866730df106f7639ba4512e42885d80f868ccb257 AS base

# The build output is platform independent (bundled JS + static assets), so pin the builder to the
# native build platform. Cross-platform builds then only emulate the much cheaper runner stage.
FROM --platform=$BUILDPLATFORM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1

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
FROM node:26-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS runner

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
