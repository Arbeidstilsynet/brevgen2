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

## OpenAPI/Swagger

The API provides interactive documentation and machine-readable API specifications:

- `GET /docs` - Interactive API documentation (Swagger UI) for exploring and testing endpoints
- `GET /docs/json` - OpenAPI 3.0 schema in JSON format, useful for generating client SDKs, importing into API tools (Postman, Insomnia), or CI/CD validation

When running locally with `DANGEROUS_DISABLE_AUTH=true`, you can test endpoints directly in Swagger UI without authentication.

## Integrasjonstester

Starter API med [Testcontainers](https://testcontainers.com/) og gjør spørringer mot det.

`pnpm test:integration`

## Auth

API-et forventer et Azure Entra ID (Azure AD) access token hentet via OAuth2 Client Credentials flow.

Se applikasjonene `Brevgenerator2 <DEV/PROD>` i EntraId.

[jwks-rsa](https://www.npmjs.com/package/jwks-rsa) brukes for caching og henting av public keys.
[@fastify/jwt](https://www.npmjs.com/package/@fastify/jwt) brukes for validering av token.

### Konfigurasjon av app i Entra

Oppskrift:

- Opprett ny app: `App registrations -> New registration`
- I `Manifest`, sett `api.requestedAccessTokenVersion` til `2`
- I `Expose an API`, legg til `Application ID URI` med default forslag (`api://<appid>`)
- I `Certificates & secrets`, opprett en Client secret. Husk å legge den inn i Keeper
- Consumers kan nå bruke client credential flow for å skaffe en access token for API

Oppskrift for bruk av samme app med Authorization Code flow for brukerinnlogging:

- Gå til `Manage -> Authentication`, legg til web platform med redirect URLs (e.g. `http://localhost:3000/api/auth/callback/azure-ad`)
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

## Miljøvariabler

```sh
PORT=4000 # default
AZURE_TENANT_ID=da4bf886-a8a6-450d-a806-c347b8eb8d80 # default, Arbeidstilsynet
AZURE_APPLICATION_ID # Brevgenerator2 DEV: 079a726c-1419-4907-9aeb-e230f700e22a

# ONLY to be used in tests/locally to not require authorization header
# DANGEROUS_DISABLE_AUTH=true
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
