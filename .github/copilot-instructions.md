# Copilot instructions for brevgen2

Brevgenerator2 centralises PDF generation: consumers author content as **Dynamic Markdown**
(`.mdat`), and the service renders it into branded documents (PDF or HTML) wrapped in a
**document template** (letterhead/footer/styling). Read `CONTEXT.md` at the repo root for the
full domain glossary before naming concepts (Document, Content template, Document template,
Variable, Consumer, Signature variant, Workspace, ...) — don't invent synonyms it explicitly avoids.

This is a pnpm/Turborepo TypeScript monorepo (`apps/*`, `packages/*`) plus a separate .NET
solution (`nuget-client/`) for the API client.

## Running commands

Use pnpm via Corepack. Always set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` so Corepack doesn't hang
waiting for an interactive confirmation prompt:

```sh
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install
```

## Build, lint, typecheck, test

Root-level scripts run via Turborepo across all workspaces (cached, parallelized):

```sh
pnpm build        # turbo build
pnpm lint         # turbo lint (oxlint per package)
pnpm typecheck    # turbo typecheck (tsc --noEmit per package)
pnpm test         # turbo test (vitest per package)
pnpm format       # oxfmt (whole repo)
pnpm format:check
pnpm circular     # madge circular-dependency check
```

Scope any of these to one workspace with `--filter`, e.g. `pnpm test --filter api`,
`pnpm typecheck --filter @at/dynamic-markdown`. Excluding the .NET client: `--filter=!nuget-client`.

Run a single test file or test name directly with vitest inside the relevant package (each app/
package has its own `vitest.config.ts`):

```sh
cd apps/api && pnpm exec vitest run lib/handler.test.ts
cd apps/api && pnpm exec vitest run -t "some test name"
```

- `apps/api` unit tests: `pnpm test` (vitest, targets `lib`). Integration tests (spin up the API
  via Testcontainers): from repo root run `pnpm test:integration` (filters to `api`), or from `apps/api` run `pnpm test:integration`
  (`apps/api/integration-tests`).
- Load tests: `pnpm test:load` / `pnpm test:load:analyze` in `apps/api` (not part of CI).
- `.NET` client (`nuget-client/`): built/tested via `Arbeidstilsynet/action-dotnet-build` in CI, not
  through pnpm/turbo.

Pre-commit hooks (formatting, lint, etc.) run via [prek](https://prek.j178.dev/):
`prek install`, `prek run --all-files` (also `pnpm prek`).

## Architecture

Rendering pipeline (see `apps/api/README.md` and `packages/dynamic-markdown/README.md`):

```
Dynamic Markdown (+ variables) --parseDynamicMd--> Markdown --marked--> HTML --puppeteer--> PDF
```

- **`packages/dynamic-markdown`** — core parser: expands `{{ variable }}` interpolation (including
  nested variables whose values themselves contain Dynamic Markdown) and `{{ if cond :: ... }}`
  inline logic, producing plain Markdown.
- **`packages/document-templates`** — the letterhead/footer/CSS wrappers. Each template
  (`default`, `direktorat`, `blank`, defined under `lib/templates/`) implements the `Template`
  interface (`lib/template.ts`): `argsSchema` (zod), `getMd()` (assembles final markdown around
  the body), `getPdfConfig()` (css + puppeteer/pdf-lib options incl. footer HTML). New templates
  are registered in `lib/registry.ts::templates` and resolved by name via `resolveTemplate()`.
  The `custom` template name is intentionally *not* registered — callers supply their own full
  PDF config directly instead of using a registry template.
- **`packages/shared-types`** — zod schemas + inferred types shared by API and web (request/
  response shapes, template args, `DocumentTemplateOption`). This is the API's schema source of
  truth (also used to generate the OpenAPI/Swagger spec).
- **`apps/api`** — Fastify service. Request flow: `handler.ts::handlerGenerateDocument` validates
  the request against `generateDocumentRequestSchema`, calls `parseDynamicMd`, then
  `generateDocument.ts` resolves the document template, merges the template's PDF config with the
  caller's `options` (shallow-merging `pdf_options`, optionally concatenating `css` when
  `merge_css` is set), and hands off to `lib/core/md-to-pdf.ts` (Marked -> sanitize-html ->
  Puppeteer, with a Lambda-friendly Chromium via `@sparticuz/chromium`). Auth is Azure Entra ID
  client-credentials JWT validation (`auth.ts`, `jwks-rsa`, `@fastify/jwt`); set
  `DANGEROUS_DISABLE_AUTH=true` only for local/dev/test. Generation is throttled via `p-limit`
  (`MAX_PARALLEL_GENERATION`) to bound CPU spikes from concurrent Puppeteer renders.
- **`apps/preview-web`** — Next.js editor/preview app. Fetches content templates from Azure DevOps
  or GitHub repos (`actions/azdo.ts`, `actions/github.ts`, `actions/git-provider/`), persists
  work-in-progress templates ("Workspaces") to GCP Cloud Storage (`actions/gcp-bucket.ts`), and
  calls the API (`actions/pdf.ts`) for previews. Auth via NextAuth/Azure AD; users need the
  `Brevgenerator.User` app role.
- **`nuget-client/`** — separate .NET solution (`BrevgeneratorClient`, tests, ArchUnit tests, an
  ad-hoc CLI) providing a typed C# client for the API, published as
  `Arbeidstilsynet.Brevgenerator.Client`. Has its own `.pre-commit-config.yaml` and CI job; not
  wired into the pnpm/turbo pipeline.

Cross-package imports use workspace protocol (`workspace:*` / `workspace:^`) and TS path/`exports`
maps straight to source (`./lib/index.ts`) — no separate build step needed between packages during
dev; `apps/api` and `apps/preview-web` Docker builds must run from the monorepo root so they can
see sibling packages.

## Conventions

- **PR titles** must follow Conventional Commits: `type(scope): description` (types: `feat`,
  `fix`, `refactor`, `chore`, `ci`, `docs`, `test`, `perf`, `build`; scope = affected
  package/area, e.g. `api`, `web`, `document-templates`, `shared-types`, `docker`, `otel`,
  `nais/web`, `ci`, `scripts`). Description in imperative mood, lower case. Enforced by CI
  (`amannn/action-semantic-pull-request`).
- Adding a new document template: implement `Template` in `packages/document-templates/lib/
  templates/<name>/`, add its args schema to `@repo/shared-types`, register it in `registry.ts`,
  and extend `DocumentTemplateOption`.
- Linting is `oxlint` per package (root config `.oxlintrc.jsonc`, overridable per package);
  formatting is `oxfmt` (`.oxfmtrc.json`). C# formatting under `nuget-client/` uses csharpier
  (`.csharpierrc`).
- CI (`.github/workflows/ci.yaml`) only runs the TS build/test/typecheck job when
  `apps/`, `packages/`, or root package/lockfiles change, and only runs the `nuget-client` job
  when `nuget-client/` changes — mirror that scoping when reasoning about what a change affects.

## Agent-specific docs

- `AGENTS.md` — PR title rules, Corepack download-prompt workaround, and pointers to
  `docs/agents/issue-tracker.md` (GitHub issues via `gh`), `docs/agents/triage-labels.md`, and
  `docs/agents/domain.md` (how to use `CONTEXT.md`/ADRs when exploring the domain).
