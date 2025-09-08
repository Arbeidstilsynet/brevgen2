# Brevgenerator2 API

## Local (Fastify dev server)

```sh
$/apps/api: pnpm dev
```

## Local (Docker)

```sh
# docker must run from root to add monorepo packages
$/: pnpm docker:api:build
$/: pnpm docker:api:run
$/: http POST http://localhost:4000/genererbrev Content-Type:application/json md="## Sample Markdown"  mdVariables:='{"variable1": "value1", "variable2": "value2"}' options:='{"dynamic": {"template": "default", "defaultTemplateArgs": {"language": "bm", "signatureVariant": "elektroniskGodkjent", "fields": {"dato": "24.12.2025", "saksnummer": "2025/999", "saksbehandlerNavn": "Bob Bobson", "virksomhet": {"navn": "A", "adresse": "B", "postnr": "C", "poststed": "D"}}}}}'
```

## Integrasjonstester

Starter API med [Testcontainers](https://testcontainers.com/) og gjør spørringer mot det.

`pnpm test:integration`

## Auth

### Container/Fastify

API-et forventer et Azure Entra ID (Azure AD) access token hentet via OAuth2 Client Credentials flow.

Se applikasjonene `Brevgenerator2 <DEV/PROD>` i EntraId.

[jwks-rsa](https://www.npmjs.com/package/jwks-rsa) brukes for caching og henting av public keys.
[@fastify/jwt](https://www.npmjs.com/package/@fastify/jwt) brukes for validering av token.

#### Konfigurasjon av app i Entra

Oppskrift:

- Opprett ny app: `App registrations -> New registration`
- I `Manifest`, sett `api.requestedAccessTokenVersion` til `2`
- I `Expose an API`, legg til `Application ID URI` med default forslag (`api://<appid>`)
- I `Certificates & secrets`, opprett en Client secret. Husk å legge den inn i Keeper
- Consumers kan nå bruke client credential flow for å skaffe en access token for API

Oppskrift for bruk av samme app med Authorization Code flow for brukerinnlogging:

- Gå til `Manage -> Authentication`, legg til web platform med redirect URLs (e.g. `http://localhost:3000/api/auth/callback/microsoft-entra-id`)
- Gå til `App roles` -> `Create app role`, legg til roller:

```txt
Display name: API.Access
Allowed member types: Applications
Value: API.Access
Description: Allows applications to access the Brevgenerator API via client credentials flow
```

```txt
Display name: Brevgenerator.User
Allowed member types: Users/Groups
Value: Brevgenerator.User
Description: Allows users to access the Brevgenerator web platform and all integrated services
```

- Gå til `API permissions`, legg til application permissions for appen til seg selv
- Gå til Enterprise Application
  - -> Manage -> Properties og sett `Assignment required? = Yes`

### AWS Lambda

API-et bruker AWS Gateway API Key ved deploy til lambda.

## Miljøvariabler

```sh
PORT=4000 # default
AZURE_TENANT_ID=da4bf886-a8a6-450d-a806-c347b8eb8d80 # default, Arbeidstilsynet
AZURE_APPLICATION_ID # Brevgenerator2 DEV: 079a726c-1419-4907-9aeb-e230f700e22a

# ONLY to be used in tests/locally to not require authorization header
# DANGEROUS_DISABLE_AUTH=true
```

### samconfig.toml

Bytt ut {env} med ditt navn. Ikke bruk dev/test o.l. for din egen stack.

```toml
version = 0.1
[default.deploy.parameters]
stack_name = "brevgenerator2-api-{env}"
s3_prefix = "brevgenerator2-api-{env}"
region = "eu-west-1"
resolve_s3 = true
capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
parameter_overrides = [
    "Env=\"{env}\"",
    "DomainName=\"brevgenerator2-api-{env}.arbeidstilsynet.no\"",
    "ChromiumLayerBucket=\"{env}-brevgenerator2-lambda-layers\"",
    "ChromiumVersion=\"138.0.2\"",

    # rolle fra felles-cfn-extensions for å opprette Route53 records i SharedServices
    "CrossAccountRoute53RoleArn=\"arn:aws:iam::250640723606:role/felles-cfn-extensions-prod-crossaccount-r53-role\"",
    # arbeidstilsynet.no
    "DomainHostedZoneId=\"Z073533223SF44MXB039V\"",
]
image_repositories = []
```

### Deploy

Før deploy må du kjøre script som forbereder S3-bøtte med lambda layer

```sh
$/apps/api: py upload-layer.py --bucket-name {dittnavn}-brevgenerator2-lambda-layers --chromium-version "138.0.2" --profile {CLI-profil, gjerne for ATDEV01}
$/apps/api: pnpm build && sam build && sam deploy
```

## md-to-pdf (lib)

Konverterer markdown til HTML med Marked, og så HTML til PDF med Puppeteer. Ment å brukes med [dynamic-markdown](../../packages/dynamic-markdown/README.md).

Basert på [simonhaenisch/md-to-pdf](https://github.com/simonhaenisch/md-to-pdf).

Tilpasninger:

- Sanitering av HTML før konvertering til PDF
- Støtte for å bruke en [versjon av Chromium](https://www.npmjs.com/package/@sparticuz/chromium) som er tilpasset for å kjøre i AWS Lambda
  - [HTML to PDF using Typescript & AWS Lambda (medium.com)](https://medium.com/@philblenk6/html-to-pdf-using-aws-lambda-a61abcdd50d4)
- Fjernet mye irellevant kode/funksjonalitet, som kjøring via CLI

NB: puppeteer-core sin versjon må passe med versjonen av chromium, se tabell: <https://pptr.dev/supported-browsers#supported-browser-version-list>

## Policy

Det er laget en policy for å gi aksess apikey-ssm-parameter og til api-gateway. Legg inn følgende i lambdaene som skal bruke brevgeneratoren:

`- !Sub arn:aws:iam::${AWS::AccountId}:policy/at/felles/brevgenerator/${Env}-brevgenerator-consumer-policy`

## Generering av brev

Dynamic Markdown -> Markdown -> HTML (Marked) -> PDF (Puppeteer)

### Eksempel

```ts
const testdata = {
  md: `# Vedtak om at dere blir tilbakekalt

${generateLoremIpsum(100)}

## Dette må dere gjøre
${generateLoremIpsum(200)}

{{ if kanKlage == true ::
## Dere kan klage innen {{ klageFrist }}
${generateLoremIpsum(100)}
}}
`,
  variables: {
    kanKlage: true,
    klageFrist: "10.10.2024",
  },
};

const parsedMd = parseDynamicMd(testdata.md, {
  variables: testdata.variables,
});
const pdf = await generatePdf(parsedMd, {
  document_title: "Hello, world",
  dynamic: {
    defaultTemplateArgs: {
      language: "bm",
      fields: {
        dato: "13.09.2024",
        saksnummer: "2024/1234",
        saksbehandlerNavn: "Ola Nordmann",
        virksomhet: {
          navn: "Nissene på jordet AS",
          adresse: "Akersgata 123",
          postnr: "0152",
          poststed: "Oslo",
        },
      },
      signatureVariant: "automatiskBehandlet",
    },
  },
});

// do something with pdf buffer
```
