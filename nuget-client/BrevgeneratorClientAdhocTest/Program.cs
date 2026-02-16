using System.Text.Json;
using Arbeidstilsynet.Brevgenerator.Client;
using Arbeidstilsynet.Brevgenerator.Client.Model;
using Microsoft.Extensions.DependencyInjection;

namespace BrevgeneratorClientCli;

static class Program
{
    static async Task Main(string[] args)
    {
        // dotnet run "http://localhost:4000"

        if (args.Length < 1)
        {
            Console.WriteLine("Usage: BrevgeneratorClientCli <API_URL>]");
            return;
        }

        var apiUrl = args[0];

        // ---------- Klient 1 via DI ----------
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton(new BrevgeneratorConfig(apiUrl));
        serviceCollection.AddSingleton<IBrevgeneratorKlient>(sp => new BrevgeneratorKlient(
            sp.GetRequiredService<BrevgeneratorConfig>(),
            BrevgeneratorKlient.AuthMode.ApiKey,
            apiKeyFactory: async () => "foo"
        ));
        var serviceProvider = serviceCollection.BuildServiceProvider();
        var client1 = serviceProvider.GetRequiredService<IBrevgeneratorKlient>();

        // ---------- Klient 2 direkte konstruksjon ----------
        // var client2 = new BrevgeneratorKlient(
        //     new BrevgeneratorConfig(apiUrl),
        //     BrevgeneratorKlient.AuthMode.ApiKey,
        //     apiKeyFactory: async () => "foo"
        // );

        var payload = GenererBrevArgsBuilder
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
