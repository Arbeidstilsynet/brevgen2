# AGENTS.md

## Pull requests

PR titles MUST follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.

- **Types**: `feat`, `fix`, `refactor`, `chore`, `ci`, `docs`, `test`, `perf`, `build`. Use `feat` for new behaviour, `fix` for bug fixes, and `refactor` for changes that restructure code without changing behaviour.
- **Scope** is optional but encouraged. Use the affected package or area. Example scopes (not limited to): `api`, `web`, `document-templates`, `shared-types`, `docker`, `otel`, `nais/web`, `ci`, `scripts`. Inspect recent non-Renovate commits on `main` (`git log main`, ignoring `deps`/Renovate bumps) for more examples.
- Keep the description in the imperative mood and lower case, e.g. `refactor(document-templates): migrate templates onto the registry`.

## Running commands

This repo uses pnpm via Corepack. When Corepack needs to provision the pinned pnpm version it will, by
default, print an interactive download prompt and wait for confirmation — this hangs non-interactive
agents. Always set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` when invoking pnpm so the download proceeds
without prompting. For example:

- PowerShell: `$env:COREPACK_ENABLE_DOWNLOAD_PROMPT=0; pnpm install`
- bash/zsh: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm test`

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues in `Arbeidstilsynet/brevgen2` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage label vocabulary (defaults, unchanged). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` glossary at the repo root covers the whole monorepo. See `docs/agents/domain.md`.
