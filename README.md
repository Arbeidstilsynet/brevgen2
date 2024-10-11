# felles-brevgenerator

Den nye brevgeneratoren er konfigurert som et integrert monorepo med sentralisert konfigurasjon og mulighet til å importere mellom prosjektene.

## Prosjekter

- apps
  - [api](apps/api) - Mikrotjeneste for å konvertere dynamisk markdown til PDF
    - [README](apps/api/README.md)
  - [preview-web](apps/preview-web) - Web-editor med forhåndsvisning og Git-integrasjon
    - [README](apps/preview-web/README.md)
- packages
  - [dynamic-markdown](packages/dynamic-markdown) - bibliotek
    - [README](apps/dynamic-markdown/README.md)
  - [document-templates](packages/document-templates/) - letterhead/footer/styling for genererte dokumenter
  - [config-typescript](packages/config-typescript/) - felles tsconfig
  - [nuget-client](packages/nuget-client) - C#-klient for å bruke API - publisert som `AT.Brevgenerator.Klient`
    - [tenkt å bygges sammen med resten](https://turbo.build/repo/docs/guides/multi-language), men det fungerer ikke akkurat nå

## Lokal kjøring

Se readme i prosjektene under apps

## Turborepo

Dette monorepoet bruker Turborepo, som hjelper med å kjøre samme kommando parallelt for mange prosjekter og automatisk bruker cache for prosjekter som ikke er endret.

Docs: [Turborepo](https://turbo.build/repo/docs)

For å få håndteringen av workspaces til å fungere best mulig bruker dette repoet `pnpm` til å installere pakker. Installer pnpm globalt på din maskin med `npm i -g pnpm`. Du kan fortsatt kjøre `npm run dev` o.l. i dette repoet, men installering av avhengighetene må gå via pnpm.

```sh
# installer avhengigheter
$ pnpm i

# legg til avhengighet for en pakke
apps/api$ pnpm add -D prettier

# bygg alle prosjekter
$ pnpm build

# kjør tester for alle prosjekter
$ pnpm test
```

## Gammel løsning

[Legacy brevgenerator](src/README.md)
