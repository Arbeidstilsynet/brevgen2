# `AT.Brevgenerator.Klient`

NuGet-pakke i C# for å konsumere Brevgenerator-API.

Modeller for payload ligger i `AT.Brevgenerator.Klient.Model`

Autentisering må angis eksplisitt av konsumenten. Klienten støtter to moduser:

- BearerToken – async factory som returnerer et gyldig bearer token (f.eks. Entra ID client credentials). Eneste støttet av nåværende deployet API.
- ApiKey – async factory som returnerer ApiKey, som sendes i headeren `x-api-key`. Ble brukt før.

## Hvordan publisere ny versjon av NuGet-pakken

1. Oppdater `Version` i [nuget-client.csproj](nuget-client.csproj) med passende nytt [semantisk versjonsnummer](https://semver.org/)
2. Skriv inn dine endringer i [CHANGELOG.md](CHANGELOG.md)
3. PR og merge til main-branch
4. Lag Git tag `nuget-x.y.z`
5. En ny pakke blir bygget og publisert i Azure Artifacts public feed, klar til bruk

## Hvordan installere NuGet-pakken

Legg til organisasjonens public feed "AT.Public.NuGet" i konsumerende prosjekt sin `nuget.config`

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <add
      key="AT.Public.NuGet"
      value="https://pkgs.dev.azure.com/Atil-utvikling/Public/_packaging/AT.Public.NuGet/nuget/v3/index.json"
      protocolVersion="3"
    />
  </packageSources>
</configuration>
```

## Eksempel på bruk

```csharp
var brevGenConfig = new BrevgeneratorConfig(Environment.GetEnvironmentVariable("BREVGENERATOR_API_URL")!);

// Bearer token-modus (f.eks. Entra ID client credentials)
var client = new BrevgeneratorKlient(
    brevGenConfig,
    BrevgeneratorKlient.AuthMode.BearerToken,
    bearerTokenFactory: async () => await HentAzureTokenAsync()
);

// ApiKey-modus (for AWS)
var client = new BrevgeneratorKlient(
    brevGenConfig,
    BrevgeneratorKlient.AuthMode.ApiKey,
    apiKeyFactory: () => Task.FromResult(Environment.GetEnvironmentVariable("BREVGENERATOR_API_KEY")!)
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
    .WithMetadata(documentTitle: "My document", author: "Look at me, I am the author now")
    .Build();

var result = await client.GenererBrev(payload);
```
