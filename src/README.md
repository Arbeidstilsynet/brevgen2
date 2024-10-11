# Brevgenerator tjeneste (legacy)

Denne tjenesten lager brev med flettedata og sender det tilbake

## Getting started

Lag din egen `samconfig.toml`-fil inne i src/-mappa

```yml
version = 0.1

[default.deploy.parameters]
stack_name = "felles-brevgenerator-{dittnavn}-all-cf"
s3_prefix = "felles-brevgenerator-{dittnavn}-all-cf"
s3_bucket = "infra-sandbox-deploy-bucket"
region = "eu-west-1"
confirm_changeset = "false"
capabilities = [
"CAPABILITY_IAM",
"CAPABILITY_NAMED_IAM"
]
parameter_overrides = [
'env={dittnavn}',
]
```

- Id'en til apiet blir lagret i SSM-parameter: `/felles/${dittnavn}/brevgenerator/api/id` hvis det er ditt eget miljø.

## Sikkerhet

Man trenger ikke noe autorisasjon for å bruke denne tjenesten. Brevgeneratoren må ha lesetilgang til bøtte hvor brevmaler ligger. Navnet til bøtta liggger i SSM-parameter `/buckets/brevmaler/name`

## Hvordan bruke brevgeneratoren

1. Hent base-url fra SSM-parameter `/vpc/shared-vpc/endpoint/execute-api/url`
2. Hent api id-en fra SSM-parameter `/felles/brevgenerator/api/id`
3. Kall endepunktet `{base-url}/{env}/genererbrev` med inputen:

```javascript
{
    method: "POST",
    headers: {
        "x-apigw-api-id": "<verdien fra: /felles/brevgenerator/api/id>"
    },
    body: {
        brevmal: "<key til brevmal i s3-bøtta /buckets/brevmaler/name>",
        flettedata: [
            {
                "navn": "<flettefeltnavn>",
                "verdi": "<flettefeltverdi>"
            },
            ...
        ],
        qrkode: {
            lenke: "<url lenke>",
            styling: {
                xPos: <int>
                yPos: <int>
                bredde: <int>
                lengde: <int>
            }
        }
    }
}
```

Qrkoden er valgfritt og blir laget basert på url lenken man sender sender inn,  `lenke` er påkrevd når man velger å ha med.

Stylingen har default verdi: 0
