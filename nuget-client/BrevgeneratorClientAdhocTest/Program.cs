using System.Text.Json;
using Arbeidstilsynet.Brevgenerator.Client;
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace BrevgeneratorClientCli;

public class MyTokenProvider : ITokenProvider
{
    public async Task<string> GetToken()
    {
        // Hent token fra f.eks. Entra ID
        return await Task.FromResult("my-token");
    }
}

static class Program
{
    static async Task Main(string[] args)
    {
        // dotnet run "http://localhost:4000"

        var builder = Host.CreateApplicationBuilder(
            new HostApplicationBuilderSettings
            {
                Args = args,
                EnvironmentName = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? Environments.Development,
            }
        );
        var hostEnvironment = builder.Environment;
        Console.WriteLine($"Environment: {hostEnvironment.EnvironmentName}");

        // ---------- Klient 1 via DI ----------
        var services = new ServiceCollection();
        services.AddBrevgeneratorClient<MyTokenProvider>(
            hostEnvironment,
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken }
        );

        var serviceProvider = services.BuildServiceProvider();
        var client1 = serviceProvider.GetRequiredService<IBrevgeneratorClient>();

        // ---------- Klient 2 direkte konstruksjon ----------
        var baseUrlClient2 = args.Length > 0 ? args[0] : null;
        var client2 = DependencyInjectionExtensions.CreateBrevgeneratorClient(
            hostEnvironment,
            tokenFunc: async () => "my-token",
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = baseUrlClient2 }
        );

        var payload = IGenererBrevArgsBuilder
            .Create()
            .AddMarkdown(
                "# Sample Markdown content\n## {{ exampleVariable }}",
                new() { { "exampleVariable", "value" }, { "nully", null } }
            )
            // .WithBlankTemplate()
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
            .WithDirektoratTemplate(
                Language.Bokmål,
                DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                ["Ola Nordmann", "Direktør"]
            )
            .WithDirektoratTemplateFields(
                new()
                {
                    // Dato = "2026-10-01",
                    // Saksnummer = "2026/1234",
                    // SaksbehandlerNavn = "Kari Nordmann",
                    // ErUnntattOffentlighet = true,
                    // UnntattOffentlighetHjemmel = "jf. offl. § 14",
                    // Mottaker = new()
                    // {
                    //     Navn = "Bedrift AS",
                    //     Adresse = "Gateveien 1",
                    //     Postnr = "0123",
                    //     Poststed = "Oslo",
                    // },
                }
            )
            .WithMetadata(documentTitle: "My document", author: "The Author")
            .WithConversionOptions(
                new()
                {
                    AsHtml = true,
                    PdfOptions = new() { DisplayHeaderFooter = true },
                }
            )
            .Build();

        Console.WriteLine($"Payload:\n{JsonSerializer.Serialize(payload)}");
        Console.WriteLine("Sending request with client1");
        var result1 = await client1.GenererBrev(payload);
        Console.WriteLine($"Response:\n{result1}");
        // Console.WriteLine("Sending request with client2");
        // var result2 = await client2.GenererBrev(payload);
        // Console.WriteLine($"Response:\n{result2}");

        if (payload.Options.AsHtml == true)
        {
            await File.WriteAllTextAsync("output.html", result1);
        }
        else
        {
            var pdfBytes = Convert.FromBase64String(result1);
            await File.WriteAllBytesAsync("output.pdf", pdfBytes);
        }
    }
}
