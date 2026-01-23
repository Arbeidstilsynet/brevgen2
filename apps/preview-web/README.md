# preview-web

Editor for dynamisk markdown med forhåndsvisning av ulike format.
Live: <https://brevgenerator.arbeidstilsynet.no>

## Autentisering

OIDC med [Next-Auth](https://next-auth.js.org/providers/azure-ad). Brukere må ha tildelt rollen `Brevgenerator.User` i enterprise application `Brevgenerator2 <DEV/PROD>` for å få logge inn.

Se [api readme for oppsett i Entra](../api/README.md#konfigurasjon-av-app-i-entra).

## Integrasjoner

| Integrasjon           | Auth                            | Formål                        |
| --------------------- | ------------------------------- | ----------------------------- |
| Brevgenerator2 API    | Bearer JWT                      | Generering av PDF             |
| Azure DevOps REST API | PAT Code:Read                   | Henting av brevmaler fra repo |
| GCP Cloud Storage     | Application Default Credentials | Lagring av WIP brevmaler      |
| Apertium API          | Ingen                           | Tekstoversetting              |

## Miljøvariabler

Se [Next.js environment variable load order](https://nextjs.org/docs/app/guides/environment-variables#environment-variable-load-order.)

For å kjøre lokalt uten autentisering er det nok med medfølgende `.env.development` fil.

For å kjøre lokalt med autentisering mot integrasjoner, opprett ny fil `.env.local` med følgende miljøvariabler:

```sh
# Aktivrer next-auth
DANGEROUS_DISABLE_AUTH=false

# next-auth config
NEXTAUTH_URL=http://localhost:3000/api/auth
# can generate with `openssl rand -base64 32`
AUTH_SECRET=local-dev-secret


# For å kunne bruke API for PDF-generering
PDF_API_URL=http://localhost:4000

# Velg hvilken auth å bruke for spørringer til PDF-API: bearer | none
PDF_AUTH_MODE=bearer

# Client credentials for bearer-modus (f.eks. NAIS / Entra ID)
AZURE_TENANT_ID=da4bf886-a8a6-450d-a806-c347b8eb8d80 # default, Arbeidstilsynet
# Se Brevgenerator2 DEV/PROD i Azure app registrations
AZURE_APPLICATION_ID=...
AZURE_CLIENT_SECRET=... # Ligger i Keeper


# For å kunne hente maler fra repo
AZURE_DEVOPS_PAT=yourPAT # trenger Code:Read

# For bruk av Workspace med WIP-maler
GCP_BUCKET_NAME=dev-at-brevgenerator2-workspace
```

## Docker

For å kunne bygge Dockerfile for prod må den ha tilgang til de andre pakkene i monorepoet.
Det krever at `docker build` kjøres fra roten av monorepo: `docker build . -t brevgen2-web -f apps/preview-web/Dockerfile`

> NB: for å kunne bygge i Windows 10/11 må developer mode være påskrudd for at [preconstruct](https://github.com/preconstruct/preconstruct) skal kunne opprette symlinks.
>
> `System -> For developers -> Developer Mode -> On`
>
> Dette har vært et issue med Next og pnpm i flere år: <https://github.com/vercel/next.js/issues/40760#issuecomment-2156242160>

Build:

```sh
# cd to felles-brevgenerator root
docker build . -t brevgen2-web -f apps/preview-web/Dockerfile
```

Run:

```sh
docker run -p 3000:3000 brevgen2-web
```
