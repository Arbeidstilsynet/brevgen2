using System.Text.Json;
using Amazon;
using Amazon.APIGateway;
using Amazon.APIGateway.Model;
using Amazon.SimpleSystemsManagement;
using Amazon.SimpleSystemsManagement.Model;
using AT.Brevgenerator.Klient;
using AT.Brevgenerator.Klient.Model;
using Microsoft.Extensions.DependencyInjection;

namespace BrevgeneratorClientCli;

static class Program
{
    static async Task Main(string[] args)
    {
        // dotnet run "https://brevgenerator2-api-grunde.arbeidstilsynet.no" "/brevgenerator2/grunde/api_key_id" default

        if (args.Length < 2)
        {
            Console.WriteLine("Usage: BrevgeneratorClientCli <API_URL> <API_KEY_ID_SSM> [<AWS_PROFILE_NAME>]");
            return;
        }

        var apiUrl = args[0];
        var apiKeyIdSSM = args[1];
        var awsProfileName = args.Length > 2 ? args[2] : null;

        var credentials = string.IsNullOrEmpty(awsProfileName) ? null : SsoCredentials.Load(awsProfileName);

        // Opprett AWS-klienter (default credential chain / evt. profil via env / config)
        var ssmClient = credentials is not null
            ? new AmazonSimpleSystemsManagementClient(credentials, RegionEndpoint.EUWest1)
            : new AmazonSimpleSystemsManagementClient(RegionEndpoint.EUWest1);
        var apiGatewayClient = credentials is not null
            ? new AmazonAPIGatewayClient(credentials, RegionEndpoint.EUWest1)
            : new AmazonAPIGatewayClient(RegionEndpoint.EUWest1);

        // Lazy så nøkkelen hentes kun én gang og deles mellom begge klienter
        var apiKeyLazy = new Lazy<Task<string>>(() => RetrieveAwsApiKeyAsync(ssmClient, apiGatewayClient, apiKeyIdSSM));

        // ---------- Klient 1 via DI ----------
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton(new BrevgeneratorConfig(apiUrl));
        serviceCollection.AddSingleton<IBrevgeneratorKlient>(
            sp =>
                new BrevgeneratorKlient(
                    sp.GetRequiredService<BrevgeneratorConfig>(),
                    BrevgeneratorKlient.AuthMode.ApiKey,
                    apiKeyFactory: async () => await apiKeyLazy.Value
                )
        );
        var serviceProvider = serviceCollection.BuildServiceProvider();
        var client1 = serviceProvider.GetRequiredService<IBrevgeneratorKlient>();

        // ---------- Klient 2 direkte konstruksjon ----------
        var client2 = new BrevgeneratorKlient(
            new BrevgeneratorConfig(apiUrl),
            BrevgeneratorKlient.AuthMode.ApiKey,
            apiKeyFactory: async () => await apiKeyLazy.Value
        );

        var payload = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown(
                "# Sample Markdown content\n## {{ exampleVariable }}",
                new() { { "exampleVariable", "value" }, { "nully", null } }
            )
            .WithBlankTemplate()
            // .WithDefaultTemplate(Language.Nynorsk, SignatureVariant.ElektroniskGodkjent)
            // .WithDefaultTemplateFields(
            //     new()
            //     {
            //         Dato = "2024",
            //         SaksbehandlerNavn = "Lorem Ipsum",
            //         Saksnummer = "2024/1234",
            //         Virksomhet = new()
            //         {
            //             Adresse = "Hei",
            //             Navn = "Mr Ipsum",
            //             Postnr = "1234",
            //             Poststed = "Stedet"
            //         }
            //     }
            // )
            .WithMetadata(documentTitle: "My document", author: "Look at me, I am the author now")
            .WithConversionOptions(
                new()
                {
                    AsHtml = true,
                    PdfOptions = new() { DisplayHeaderFooter = true }
                }
            )
            .Build();

        Console.WriteLine($"Payload:\n{JsonSerializer.Serialize(payload)}");
        Console.WriteLine("Sending request with client1");
        var result1 = await client1.GenererBrev(payload);
        Console.WriteLine($"Response:\n{result1}");
        Console.WriteLine("Sending request with client2");
        var result2 = await client2.GenererBrev(payload);
        Console.WriteLine($"Response:\n{result2}");
    }

    public static async Task<string> RetrieveAwsApiKeyAsync(
        IAmazonSimpleSystemsManagement ssmClient,
        IAmazonAPIGateway apiGatewayClient,
        string parameterStoreName
    )
    {
        string apiKeyId = string.Empty;
        try
        {
            apiKeyId = await GetApiKeyIdFromParameterStore(ssmClient, parameterStoreName);
            var apiKey = await GetApiKeyFromApiGateway(apiGatewayClient, apiKeyId);
            return apiKey;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving API Key (id: {apiKeyId}): {ex.Message}");
            throw;
        }
    }

    private static async Task<string> GetApiKeyIdFromParameterStore(
        IAmazonSimpleSystemsManagement ssmClient,
        string parameterStoreName
    )
    {
        var request = new GetParameterRequest { Name = parameterStoreName, WithDecryption = false };

        var response = await ssmClient.GetParameterAsync(request);
        return response.Parameter.Value;
    }

    private static async Task<string> GetApiKeyFromApiGateway(IAmazonAPIGateway apiGatewayClient, string apiKeyId)
    {
        var request = new GetApiKeyRequest { ApiKey = apiKeyId, IncludeValue = true };

        var response = await apiGatewayClient.GetApiKeyAsync(request);
        return response.Value;
    }
}
