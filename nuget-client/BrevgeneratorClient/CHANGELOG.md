# Versjonslogg

## 4.0.0

- Publiserer nå til `nuget.org` i stedet for Azure DevOps
- Omdøpt pakke fra `AT.Brevgenerator.Klient` til `Arbeidstilsynet.Brevgenerator.Client`
- Omdøpt namespace fra `AT.Brevgenerator.Klient` / `AT.Brevgenerator.Klient.Model` til `Arbeidstilsynet.Brevgenerator.Client` / `Arbeidstilsynet.Brevgenerator.Client.Models`
- Omdøpt `BrevgeneratorKlient` / `IBrevgeneratorKlient` til `BrevgeneratorClient` / `IBrevgeneratorClient`

## 3.3.0

- Lagt til støtte for `ErUnntattOffentlighet` og `UnntattOffentlighetHjemmel` i direktorat-template
- GenererBrevArgsBuilder sjekker nå at `UnntattOffentlighetHjemmel` er definert når `ErUnntattOffentlighet` er `true`

## 3.2.0

Støtte for ny dokument-mal "direktorat" med egen logo og andre felter. Konfigurer med nye metoder i builder `WithDirektoratTemplate` og `WithDirektoratTemplateFields`.

Til forskjell fra "default" template er ingen felter i `DirektoratTemplateFields` påkrevd.

## 3.1.6

- Fiks så `bearerTokenFactory` alltid kalles ved gjenbruk av samme httpClient
- Sett headers på selve request i stedet for å mutere `httpClient.DefaultRequestHeaders`
- Refactor av intern mappestruktur

## 3.1.5

- Fjern logging av payload og forenklet feilhåndtering

## 3.1.4

- Publiserer fra GitHub til public feed `AT.Public.NuGet`

## 3.1.3 - 2025-10-31

Fjernet `Path,Timeout,WaitForFonts` fra PuppeteerPDFOptions. Dette er en breaking change, men disse egenskapene var ikke ment å være tilgjengelige. API schema har blitt oppdatert og forsøk på å bruke disse vil bli stoppet av schema validation.

## 3.1.2 - 2025-10-09

Lagt til ClientId, TenantId og Scope i `BrevgeneratorSecret`

## 3.1.1 - 2025-10-09

Lagt til `AT.Brevgenerator.Klient.Model.BrevgeneratorSecret`

## 3.1.0 - 2025-10-09

Lagt til støtte for `DefaultTemplateFields.TidligereReferanse`

## 3.0.0 - 2025-08-29

Breaking changes:

- Fjernet automatisk uthenting av API Key fra AWS (ApiKeyRetriever og IApiKeyRetriever er fjernet).
- Fjernet AWS-avhengigheter (APIGateway, SimpleSystemsManagement) og forenklet `BrevgeneratorConfig` til kun `ApiUrl`.
- Region og ParameterStoreApiKeyIdName fjernet fra konfigurasjon.
- `AuthMode` må angis eksplisitt i konstruktør.

Nytt:

- Støtte for Bearer token (Entra ID client credentials e.l.) via `bearerTokenFactory`.

Migrering:

- Opprett konfig: `var config = new BrevgeneratorConfig(apiUrl);`
- Konstruer klient:

```cs
new BrevgeneratorKlient(
    config,
    BrevgeneratorKlient.AuthMode.BearerToken,
    bearerTokenFactory: async () => await GetToken()
);
```

eller

```cs
new BrevgeneratorKlient(
   config,
   BrevgeneratorKlient.AuthMode.ApiKey,
   apiKeyFactory: async () => await GetApiKey()
);
```

## 2.3.3 - 2025-04-08

Opprydding i model for å tilsvare API sitt schema:

- Satt de fleste felter i AT.Brevgenerator.Klient.Model.DefaultTemplateFields som required.
- Satt alle felter i AT.Brevgenerator.Klient.Model.Virksomhet som required.
- Forbedret håndtering av initialisering i builder.

## 2.3.2 - 2025-04-02

Fjernt nullability fra AT.Brevgenerator.Klient.Model.GeneratePdfOptions.Dynamic siden det er påkrevd av APIet

## 2.3.1 - 2025-03-28

Fjernet AT.Brevgenerator.Klient.Model.BasicConfig.BodyClass som ikke gjør noe

## 2.3.0 - 2025-03-27

Lagt til støtte for blank template

## 2.2.0 - 2025-01-22

Lagt til støtte for `null` som variabelverdi i forbindelse med truthy logikk

## 2.1.0 - 2025-01-14

Lagt til nye valgfrie felter i default template: DeresDato, DeresReferanse, ErUnntattOffentlighet

## 2.0.0 - 2024-11-29

Endret TargetFramework til net8.0

## 1.1.0 - 2024-10-29

La til signatureVariant Usignert

## 1.0.2 - 2024-10-18

Fiks få med signatureVariant i ArgsBuilder

## 1.0.1 - 2024-10-17

Fiks serialisering av enums

## 1.0.0 - 2024-10-09

Første versjon av pakken
