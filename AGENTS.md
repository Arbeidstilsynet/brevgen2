# AGENTS.md

## Pull requests

PR titles MUST follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.

- **Types**: `feat`, `fix`, `refactor`, `chore`, `ci`, `docs`, `test`, `perf`, `build`. Use `feat` for new behaviour, `fix` for bug fixes, and `refactor` for changes that restructure code without changing behaviour.
- **Scope** is optional but encouraged. Use the affected package or area. Example scopes (not limited to): `api`, `web`, `document-templates`, `shared-types`, `docker`, `otel`, `nais/web`, `ci`, `scripts`. Inspect recent non-Renovate commits on `main` (`git log main`, ignoring `deps`/Renovate bumps) for more examples.
- Keep the description in the imperative mood and lower case, e.g. `refactor(document-templates): migrate templates onto the registry`.

## Running commands

Use pnpm via Corepack. Set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` when invoking pnpm to avoid its interactive provisioning prompt.

## Build, lint, typecheck, and test

Root-level scripts run via Turborepo across all workspaces:

```sh
pnpm build        # turbo build
pnpm lint         # turbo lint (oxlint per package)
pnpm typecheck    # turbo typecheck (tsc --noEmit per package)
pnpm test         # turbo test (vitest per package)
pnpm format       # oxfmt (whole repo)
pnpm format:check
pnpm circular     # madge circular-dependency check
```

Scope a command to one workspace with `--filter`, for example `pnpm test --filter api` or `pnpm typecheck --filter @at/dynamic-markdown`. Exclude the .NET client with `--filter=!nuget-client`.

Run a single test file or name inside its workspace:

```sh
cd apps/api && pnpm exec vitest run lib/handler.test.ts
cd apps/api && pnpm exec vitest run -t "some test name"
```

- `apps/api` unit tests: `pnpm test`; integration tests: `pnpm test:integration` at the root or from `apps/api`.
- Load tests: `pnpm test:load` / `pnpm test:load:analyze` in `apps/api` (not part of CI).
- The .NET client (`nuget-client/`) is built and tested by `Arbeidstilsynet/action-dotnet-build` in CI, not through pnpm/Turborepo.

Run pre-commit hooks with `prek install` and `prek run --all-files` (or `pnpm prek`).

## Architecture

Brevgenerator2 centralises PDF generation: consumers author content as **Dynamic Markdown** (`.mdat`), and the service renders it into branded documents (PDF or HTML) wrapped in a **document template** (letterhead/footer/styling). It is a pnpm/Turborepo TypeScript monorepo (`apps/*`, `packages/*`) plus a separate .NET solution (`nuget-client/`) for the API client.

Rendering pipeline (see `apps/api/README.md` and `packages/dynamic-markdown/README.md`):

```
Dynamic Markdown (+ variables) --parseDynamicMd--> Markdown --marked--> HTML --puppeteer--> PDF
```

- **`packages/dynamic-markdown`** expands `{{ variable }}` interpolation, nested variables, and `{{ if cond :: ... }}` inline logic into plain Markdown.
- **`packages/document-templates`** contains the letterhead/footer/CSS wrappers. A template implements `Template` (`lib/template.ts`) with `argsSchema`, `getMd()`, and `getPdfConfig()`. Register a new template in `lib/registry.ts` and extend `DocumentTemplateOption` in `@repo/shared-types`. The `custom` name is intentionally not registered: callers supply its complete PDF config.
- **`packages/shared-types`** provides zod schemas and inferred types shared by the API and web; it is the API schema source of truth and generates the OpenAPI specification.
- **`apps/api`** is the Fastify service. It validates requests, expands Dynamic Markdown, resolves the document template, merges PDF configuration, and renders via `lib/core/md-to-pdf.ts` (Marked, sanitize-html, and Puppeteer). It uses Azure Entra ID client-credentials JWT authentication, `p-limit` generation throttling, and Lambda-friendly Chromium. Set `DANGEROUS_DISABLE_AUTH=true` only for local development and tests.
- **`apps/preview-web`** is the Next.js editor/preview application. It fetches content templates from Azure DevOps or GitHub, stores work-in-progress templates as Workspaces in GCP Cloud Storage, and calls the API for previews. It uses NextAuth/Azure AD; users need the `Brevgenerator.User` app role.
- **`nuget-client/`** is the separately built `Arbeidstilsynet.Brevgenerator.Client` C# API client, with its own formatting and CI job.

Workspace imports use `workspace:*` / `workspace:^` and source-level TypeScript exports. Docker builds for `apps/api` and `apps/preview-web` must run from the monorepo root.

## Repository conventions

- Adding a document template requires its implementation under `packages/document-templates/lib/templates/<name>/`, an args schema in `@repo/shared-types`, registry registration, and a `DocumentTemplateOption` extension.
- Linting uses oxlint, formatting uses oxfmt, and C# formatting under `nuget-client/` uses csharpier.
- CI runs the TypeScript build/test/typecheck job only when `apps/`, `packages/`, or root package/lockfiles change. It runs the .NET job only when `nuget-client/` changes.

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues in `Arbeidstilsynet/brevgen2` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage label vocabulary (defaults, unchanged). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` glossary at the repo root covers the whole monorepo. See `docs/agents/domain.md`.
