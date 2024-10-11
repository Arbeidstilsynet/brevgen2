using Amazon;
using AT.Brevgenerator.Klient;
using AT.Brevgenerator.Klient.Model;
using Microsoft.Extensions.DependencyInjection;

namespace BrevgeneratorClientCli;

class Program
{
    static async Task Main(string[] args)
    {
        // dotnet run "https://brevgenerator2-api-grunde.arbeidstilsynet.no" "/brevgenerator2/grunde/api_key_id" verifi

        if (args.Length < 3)
        {
            Console.WriteLine("Usage: BrevgeneratorClientCli <API_URL> <API_KEY_ID_SSM> <AWS_PROFILE_NAME>");
            return;
        }

        (var apiUrl, var apiKeyIdSSM, var awsProfileName) = (args[0], args[1], args[2]);

        // eksempel med bruk av dependency injection
        var brevgeneratorConfig = new BrevgeneratorConfig(apiUrl, apiKeyIdSSM, RegionEndpoint.EUWest1);
        // var credentials = SsoCredentials.Load(awsProfileName);
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton(brevgeneratorConfig);
        // serviceCollection.AddSingleton(credentials);
        serviceCollection.AddSingleton<IBrevgeneratorKlient, BrevgeneratorKlient>();
        serviceCollection.AddSingleton<IApiKeyRetriever, ApiKeyRetriever>();
        var serviceProvider = serviceCollection.BuildServiceProvider();
        var client1 = serviceProvider.GetRequiredService<IBrevgeneratorKlient>();

        // eksempel med direkte bruk av constructor
        Environment.SetEnvironmentVariable("BREVGENERATOR_API_URL", args[0]);
        Environment.SetEnvironmentVariable("BREVGENERATOR_API_KEY_ID_SSM", args[1]);
        Environment.SetEnvironmentVariable("AWS_REGION", "eu-west-1");
        var brevGenConfig = new BrevgeneratorConfig(
            ApiUrl: Environment.GetEnvironmentVariable("BREVGENERATOR_API_URL")!,
            ParameterStoreApiKeyIdName: Environment.GetEnvironmentVariable("BREVGENERATOR_API_KEY_ID_SSM")!,
            RegionEndpoint: RegionEndpoint.GetBySystemName(Environment.GetEnvironmentVariable("AWS_REGION"))
        );
        var client2 = new BrevgeneratorKlient(brevGenConfig, new ApiKeyRetriever(brevGenConfig));

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
            .WithConversionOptions(
                new()
                {
                    AsHtml = true,
                    PdfOptions = new() { DisplayHeaderFooter = true }
                }
            )
            .Build();

        Console.WriteLine("Sending request with client1");
        var result = await client1.GenererBrev(payload);
        Console.WriteLine($"Response:\n{result}");
        Console.WriteLine("Sending request with client2");
        await client2.GenererBrev(payload);
    }
}
