# preview-web

Editor for dynamisk markdown med forhåndsvisning av ulike format.
Live: <https://brevgenerator.arbeidstilsynet.no>

## Integrasjoner

| Integrasjon           | Auth                           | Formål                        |
| --------------------- | ------------------------------ | ----------------------------- |
| Brevgenerator2 API    | API Key                        | Generering av PDF             |
| Azure DevOps REST API | PAT Code:Read                  | Henting av brevmaler fra repo |
| AWS SDK S3            | Default credentials (dev: SSO) | Lagring av WIP brevmaler      |
| Apertium API          | Ingen                          | Tekstoversetting              |

## Miljøvariabler

For å kjøre lokalt eller bruke `deploy-fargate.ps1`, opprett ny fil `.env` med følgende miljøvariabler:

```sh
# For å kunne bruke PDF-generering
PDF_API_URL=http://localhost:4000
PDF_API_KEY=apiKeyDuFinnerIAWS # nødvendig hvis api ikke er localhost

# For å kunne hente maler fra repo
AZURE_DEVOPS_PAT=yourPAT # trenger Code:Read

# For bruk av Workspace-overlay og maler i S3
AWS_BUCKET_NAME={env}-at-brevgenerator2-workspace
# Vanlige miljøvariabler for default credentials, kan bruke AWS_ACCESS_KEY_ID og AWS_SECRET_ACCESS_KEY
AWS_PROFILE=ssoProfile
AWS_REGION=eu-west-1
```

## Docker

For å kunne bygge Dockerfile for prod må den ha tilgang til de andre pakkene i monorepoet.
Det krever at `docker build` kjøres fra roten av monorepo: `docker build . -t brevgen2-web -f apps/preview-web/Dockerfile`

NB: for å kunne bygge i Windows 10/11 må developer mode være påskrudd for at [preconstruct](https://github.com/preconstruct/preconstruct) skal kunne opprette symlinks.

`System -> For developers -> Developer Mode -> On`

Dette har vært et issue med Next og pnpm i flere år: <https://github.com/vercel/next.js/issues/40760#issuecomment-2156242160>

Build:

```sh
# cd to felles-brevgenerator root
docker build . -t brevgen2-web -f apps/preview-web/Dockerfile
```

Run:

```sh
docker run -p 3000:3000 brevgen2-web
```

## Deploy container til Fargate

For å deploye må vi gjøre et par ting:

1. Opprett ECR-stack
2. Bygg container
3. Tag image og last opp til ECR
4. Opprett Fargate-stack

For å hjelpe med dette har vi et script:

1. Hvis du ikke har gjort det, opprett `samconfig.toml` i `ecr-infra` og `infra`
2. Lag `.env` med miljøvariablene ovenfor
3. Velg AWS-profil: `$env:AWS_PROFILE="dev"`
4. Kjør deploy-script: `./deploy-fargate.ps1 -envName myname`
