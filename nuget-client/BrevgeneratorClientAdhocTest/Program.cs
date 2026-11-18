using System.Text.Json;
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

        var services = new ServiceCollection();
        services.AddBrevgeneratorClient<MyTokenProvider>(
            hostEnvironment,
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = args.FirstOrDefault() }
        );

        using var serviceProvider = services.BuildServiceProvider();
        var client = serviceProvider.GetRequiredService<IBrevgeneratorClient>();

        var payload = IGenererBrevArgsBuilder
            .Create()
            .AddMarkdown(
                "# Sample Markdown content\n## {{ exampleVariable }}",
                new() { { "exampleVariable", "value" }, { "nully", null } }
            )
            .WithDirektoratTemplate(
                Language.Nynorsk,
                DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                ["Ola Nordmann", "Direktør"]
            )
            .WithDirektoratTemplateFields(new())
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
        Console.WriteLine("Sending request");
        var result = await client.GenererBrev(payload);
        Console.WriteLine($"Response:\n{result}");

        if (payload.Options.AsHtml == true)
        {
            await File.WriteAllTextAsync("output.html", result);
        }
        else
        {
            var pdfBytes = Convert.FromBase64String(result);
            await File.WriteAllBytesAsync("output.pdf", pdfBytes);
        }
    }
}
