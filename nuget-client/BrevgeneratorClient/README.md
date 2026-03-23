# `Arbeidstilsynet.Brevgenerator.Client`

NuGet-pakke i C# for å konsumere Brevgenerator-API.

Modeller for payload ligger i `Arbeidstilsynet.Brevgenerator.Client.Models`.

Autentisering må angis eksplisitt av konsumenten. Klienten støtter to moduser:

- **BearerToken** – async factory som returnerer et gyldig bearer token (f.eks. Entra ID client credentials). Eneste støttet av nåværende deployet API.
- **ApiKey** – async factory som returnerer ApiKey, som sendes i headeren `x-api-key`. Ble brukt før.

## Hvordan installere

```
dotnet add package Arbeidstilsynet.Brevgenerator.Client
```

## Bruk

Det finnes to måter å opprette klienten på:

### Alternativ 1: Dependency Injection med egen `ITokenProvider`

Implementer `ITokenProvider`-grensesnittet og registrer klienten i DI-containeren via `AddBrevgeneratorClient<T>`:

```csharp
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Ports;

// 1. Implementer ITokenProvider
public class MyTokenProvider : ITokenProvider
{
    public async Task<string> GetToken()
    {
        // Hent token fra f.eks. Entra ID
        return await HentAzureTokenAsync();
    }
}

// 2. Registrer i DI-containeren (f.eks. i Program.cs)
services.AddBrevgeneratorClient<MyTokenProvider>(
    hostEnvironment,
    new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = "https://brevgenerator.example.com" }
);

// 3. Injiser IBrevgeneratorClient der du trenger den
public class MyService(IBrevgeneratorClient brevClient)
{
    public async Task<string> GenererBrev(GenererBrevArgs args)
    {
        return await brevClient.GenererBrev(args);
    }
}
```

### Alternativ 2: Opprett klient direkte med en token-funksjon

Bruk `CreateBrevgeneratorClient` for å opprette klienten uten å sette opp en egen `ITokenProvider`-klasse. Nyttig i enklere oppsett eller legacy-kode:

```csharp
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;

var client = Extensions.CreateBrevgeneratorClient(
    hostEnvironment,
    tokenFunc: async () => await HentAzureTokenAsync(),
    new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = "https://brevgenerator.example.com" }
);

var result = await client.GenererBrev(payload);
```

### Bygge payload

```csharp
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;

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

## Konfigurasjon av Base-URL og `IHostEnvironment`

Klienten bruker `IHostEnvironment` for å automatisk velge riktig base-URL basert på miljøet:

| Miljø                        | URL                                            |
|------------------------------|------------------------------------------------|
| Development                  | `http://localhost:4000`                        |
| Production                   | `https://brevgen2-api.arbeidstilsynet.no/`     |
| Andre (f.eks. Test, Staging) | `https://brevgen2-api.dev.arbeidstilsynet.no/` |

**Dersom `BaseUrl` er satt i `BrevgeneratorConfig`, vil denne alltid bli brukt — uavhengig av miljø.** Miljøbasert URL-oppslag skjer kun når `BaseUrl` er `null` eller tom.

```csharp
// BaseUrl er satt → denne brukes alltid, IHostEnvironment ignoreres
new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = "https://min-egen-url.example.com" }

// BaseUrl er null → URL bestemmes av IHostEnvironment
new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = null }
```

## Hvordan publisere ny versjon

1. Oppdater `Version` i [nuget-client.csproj](nuget-client.csproj) med passende nytt [semantisk versjonsnummer](https://semver.org/)
2. Skriv inn dine endringer i [CHANGELOG.md](CHANGELOG.md)
3. PR og merge til main-branch
4. Lag Git tag `nuget-x.y.z`
5. En ny pakke blir bygget og publisert i nuget.org, klar til bruk
