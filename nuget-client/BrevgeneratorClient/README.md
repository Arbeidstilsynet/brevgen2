# `Arbeidstilsynet.Brevgenerator.Client`

NuGet-pakke i C# for å konsumere Brevgenerator-API.

Modeller for payload ligger i `Arbeidstilsynet.Brevgenerator.Client.Model`

Autentisering må angis eksplisitt av konsumenten. Klienten støtter to moduser:

- BearerToken – async factory som returnerer et gyldig bearer token (f.eks. Entra ID client credentials). Eneste støttet av nåværende deployet API.
- ApiKey – async factory som returnerer ApiKey, som sendes i headeren `x-api-key`. Ble brukt før.

## Hvordan installere

`dotnet add package Arbeidstilsynet.Brevgenerator.Client`

## Eksempel på bruk

```csharp
using Arbeidstilsynet.Brevgenerator.Client;
using Arbeidstilsynet.Brevgenerator.Client.Model;

var brevGenConfig = new BrevgeneratorConfig(Environment.GetEnvironmentVariable("BREVGENERATOR_API_URL")!);

// Bearer token-modus (f.eks. Entra ID client credentials)
var client = new BrevgeneratorKlient(
    brevGenConfig,
    BrevgeneratorKlient.AuthMode.BearerToken,
    bearerTokenFactory: async () => await HentAzureTokenAsync()
);

var payload = GenererBrevArgsBuilder
    .Create()
    .AddMarkdown(
        "# Sample Markdown content\n## {{ exampleVariable }}",
        new() { { "exampleVariable", "value" } }
    )
    .WithDefaultTemplate(Language.Nynorsk, SignatureVariant.ElektroniskGodkjent)
    .WithDefaultTemplateFields(
        new()
        {
            Dato = "2024",
            SaksbehandlerNavn = "Lorem Ipsum",
            Saksnummer = "2024/1234",
            Virksomhet = new()
            {
                Adresse = "Hei",
                Navn = "Mr Ipsum",
                Postnr = "1234",
                Poststed = "Stedet"
            }
        }
    )
    .WithMetadata(documentTitle: "My document", author: "A. U. Thor")
    .Build();

var result = await client.GenererBrev(payload);
```

## Hvordan publisere ny versjon

1. Oppdater `Version` i [nuget-client.csproj](nuget-client.csproj) med passende nytt [semantisk versjonsnummer](https://semver.org/)
2. Skriv inn dine endringer i [CHANGELOG.md](CHANGELOG.md)
3. PR og merge til main-branch
4. Lag Git tag `nuget-x.y.z`
5. En ny pakke blir bygget og publisert i nuget.org, klar til bruk
