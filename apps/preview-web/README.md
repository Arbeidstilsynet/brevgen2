# preview-web

Editor for dynamisk markdown med forhåndsvisning av ulike format.
Live: <https://brevgenerator.arbeidstilsynet.no>

## Miljøvariabler

For å kjøre lokalt eller bruke `deploy-fargate.ps1`, opprett ny fil `.env` med følgende miljøvariabler:

```sh
PDF_API_URL=http://localhost:4000
PDF_API_KEY=apiKeyDuFinnerIAWS # nødvendig hvis api ikke er localhost
AZURE_DEVOPS_PAT=yourPAT # trenger Code:Read
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

1. Hvis du ikke har gjort det, opprett samconfig.toml i `ecr-infra` og `infra`
2. Lag .env med miljøvariablene ovenfor
3. Velg AWS-profil: `$env:AWS_PROFILE="verifi"`
4. Kjør deploy-script: `./deploy-fargate.ps1 -envName myname`
