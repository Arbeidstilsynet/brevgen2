# `AT.Brevgenerator.Klient`

NuGet-pakke i C# for å konsumere API. Henter automatisk ut API Key. Kjørende miljø må ha rettigheter til å hente ut API Keys.

Modeller for payload ligger i `AT.Brevgenerator.Klient.Model`

Klienten henter selv ut API Key for å benytte Bregenerator-APIet. For å hente API Key må den ha nødvendige rettigheter og få ID på en SSM-parameter som inneholder API Key ID. Brevgenerator-API-stacken oppretter denne parameteren: `/brevgenerator2/{env}/api_key_id`.

## Hvordan publisere ny versjon av NuGet-pakken

1. Skriv inn dine endringer i [CHANGELOG.md](CHANGELOG.md) med passende nytt [semantisk versjonsnummer](https://semver.org/)
2. PR og commit til main-branch i repo
3. Opprett git tag `nuget-x.y.z` i Azure DevOps
4. En ny pakke blir bygget og publisert i Azure Artifacts, klar til bruk

## Hvordan installere NuGet-pakken

Legg til organisasjonens feed "Atil-utvikling" i konsumerende prosjekt sin `nuget.config`

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <add key="Atil-utvikling" value="https://pkgs.dev.azure.com/Atil-utvikling/_packaging/Atil-utvikling/nuget/v3/index.json" />
  </packageSources>
</configuration>
```
