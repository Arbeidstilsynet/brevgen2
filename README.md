# felles-brevgenerator

Den nye brevgeneratoren er konfigurert som et integrert monorepo med sentralisert konfigurasjon og mulighet til å importere mellom prosjektene.

## Prosjekter

- apps
  - [api](apps/api) - Mikrotjeneste for å konvertere dynamisk markdown til PDF
  - [preview-web](apps/preview-web) - Web-editor med forhåndsvisning og Git-integrasjon
- packages
  - [dynamic-markdown](packages/dynamic-markdown) - kjernebibliotek
  - [document-templates](packages/document-templates/) - letterhead/footer/styling for genererte dokumenter
  - [config-typescript](packages/config-typescript/) - felles tsconfigs
  - [shared-types](packages/shared-types/) - felles typer, inkludert schema for API
  - [nuget-client](packages/nuget-client) - C#-klient for å bruke API - publisert som `AT.Brevgenerator.Klient`
- adhoc
  - [BrevgeneratorKlientLocalTest](adhoc/BrevgeneratorKlientLocalTest) - CLI for å teste nuget-client

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

`compose.override.yaml` inkluderer [mock av S3](https://github.com/adobe/S3Mock)

```sh
$/: docker compose up -d
```

### OpenAPI/Swagger

Etter du har startet `api` kan du bruke SwaggerUI på `http://localhost:4000/docs`

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

## Gammel løsning

[Legacy brevgenerator](src/README.md)
