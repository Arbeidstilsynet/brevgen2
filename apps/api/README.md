# Brevgenerator2 API

## Autentisering

Bruker API Key til å autentisere.

## Local test (Docker)

```sh
$/apps/api: pnpm build
$/: docker build --platform linux/amd64 -f apps/api/Dockerfile -t brevgenerator2-api:test .
$/: docker run --rm --platform linux/amd64 -p 4000:8080 brevgenerator2-api:test
$/: http POST http://localhost:4000/2015-03-31/functions/function/invocations Content-Type:application/json md="## Sample Markdown"  mdVariables:='{"variable1": "value1", "variable2": "value2"}' generatePdfOptions:='{"dynamic": {"template": "default", "defaultTemplateFields": {"field1": "value1", "field2": "value2"}}}'
```

## AWS deploy

### samconfig.toml

Bytt ut {env} med ditt navn. Ikke bruk dev/test o.l. for din egen stack.

```toml
version = 0.1
[default.deploy.parameters]
stack_name = "felles-brevgenerator2-api-{env}"
s3_prefix = "felles-brevgenerator2-api-{env}"
region = "eu-west-1"
resolve_s3 = true
capabilities = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]
parameter_overrides = [
    "Env=\"{env}\"",
    "DomainName=\"brevgenerator2-api-{env}.arbeidstilsynet.no\"",
    "ChromiumLayerBucket=\"{env}-felles-brevgenerator2-lambda-layers\"",
    "ChromiumVersion=\"127.0.0\"",

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
$/apps/api: py upload-layer.py --bucket-name {dittnavn}-felles-brevgenerator2-lambda-layers --chromium-version "127.0.0" --profile {CLI-profil, gjerne for ATDEV01}
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
