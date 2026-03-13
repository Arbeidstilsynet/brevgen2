# Brevgenerator2

Brevgenerator2 standardiserer og forenkler PDF-generering ved å definere dokumentmaler sentralt men brevmal hos konsument i form av Markdown.

Dette er konfigurert som et integrert monorepo med sentralisert konfigurasjon og mulighet til å importere mellom prosjektene.

## Prosjekter

- apps
  - [api](apps/api) - Mikrotjeneste for å konvertere dynamisk markdown til PDF
  - [preview-web](apps/preview-web) - Web-editor med forhåndsvisning og Git-integrasjon
- packages
  - [dynamic-markdown](packages/dynamic-markdown) - kjernebibliotek
  - [document-templates](packages/document-templates/) - letterhead/footer/styling for genererte dokumenter
  - [config-typescript](packages/config-typescript/) - felles tsconfigs
  - [shared-types](packages/shared-types/) - felles typer, inkludert schema for API
- nuget-client
  - [BrevgeneratorClient](nuget-client/BrevgeneratorClient) - C#-klient for å bruke API - publisert som `Arbeidstilsynet.Brevgenerator.Client`
  - [BrevgeneratorClient.Tests](nuget-client/BrevgeneratorClient.Tests) - Tester for `Arbeidstilsynet.Brevgenerator.Client`
  - [BrevgeneratorClientAdhocTest](nuget-client/BrevgeneratorClientAdhocTest) - CLI for ad hoc testing

## Lokal kjøring

Se readmes i hvert prosjekt for detaljer.
Kortversjon:

### Dev (fast refresh for web)

```sh
$/: pnpm install
$/apps/api: pnpm dev
# se apps/preview-web/README.md for nødvendige miljøvariabler
$/apps/preview-web: pnpm dev
```

### Docker Compose (isolert miljø)

`compose.override.yaml` inkluderer [mock av Google Cloud Storage](https://github.com/oittaa/gcp-storage-emulator)

```sh
$/: docker compose up -d
```

### OpenAPI/Swagger

Etter du har startet `api` kan du bruke SwaggerUI på `http://localhost:4000/docs`

## Arkitektur

![diagram](./docs/diagrams/overview.svg)

## Pre-commit hooks

This repo uses [prek](https://prek.j178.dev/) for pre-commit hooks.
Hooks are configured in [.pre-commit-config.yaml](./.pre-commit-config.yaml).

To use prek, first [install Mise](https://mise.jdx.dev/getting-started.html#installing-mise-cli) and [activate Mise](https://mise.jdx.dev/getting-started.html#activate-mise).

```sh
# install git hooks in this repo
prek install

# optional: run hooks manually
prek run --all-files
```

## Turborepo

Dette monorepoet bruker Turborepo, som hjelper med å kjøre samme kommando parallelt for mange prosjekter og automatisk bruker cache for prosjekter som ikke er endret.

Docs: [Turborepo](https://turbo.build/repo/docs)

For å få håndteringen av workspaces til å fungere best mulig bruker dette repoet `pnpm` til å installere pakker. Installer pnpm globalt på din maskin med `npm i -g pnpm`. Du kan fortsatt kjøre `npm run dev` o.l. i dette repoet, men installering av avhengighetene må gå via pnpm.

```sh
# installer pnpm globalt på din maskin
$ npm i -g pnpm

# installer avhengigheter
$ pnpm i

# bygg alle prosjekter
$ pnpm build

# kjør tester for alle prosjekter
$ pnpm test
```
