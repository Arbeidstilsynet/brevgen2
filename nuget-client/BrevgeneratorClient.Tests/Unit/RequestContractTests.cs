using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class RequestContractTests
{
    [Fact]
    public async Task SerializedRequests_MatchSharedContractFixtures()
    {
        using var handler = new FakeHttpMessageHandler(() =>
            new(HttpStatusCode.OK) { Content = new StringContent("document") }
        );
        using var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://brevgenerator.test/") };
        var client = new Implementation.BrevgeneratorClient(
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken },
            new DummyBearerTokenProvider(),
            new FakeHttpClientFactory(httpClient),
            new FakeRetryTimer()
        );
        var serialized = new JsonObject();

        foreach (var (name, request) in Requests())
        {
            await client.GenererBrev(request, TestContext.Current.CancellationToken);
            serialized.Add(name, JsonNode.Parse(handler.Requests[^1].Body));
        }

        var updatePath = Environment.GetEnvironmentVariable("UPDATE_REQUEST_CONTRACT_FIXTURE");
        var fixturePath = updatePath ?? Path.Combine(AppContext.BaseDirectory, "Fixtures", "serialized-requests.json");
        if (updatePath is not null)
        {
            await File.WriteAllTextAsync(
                fixturePath,
                serialized.ToJsonString(new JsonSerializerOptions { WriteIndented = true }) + "\n",
                TestContext.Current.CancellationToken
            );
        }

        var expected = JsonNode.Parse(await File.ReadAllTextAsync(fixturePath, TestContext.Current.CancellationToken));
        Assert.True(
            JsonNode.DeepEquals(expected, serialized),
            "Serialized requests changed. Regenerate the shared fixture and run the API contract test before accepting it."
                + Environment.NewLine
                + serialized.ToJsonString()
        );
    }

    private static Dictionary<string, GenererBrevArgs> Requests() =>
        new()
        {
            ["default"] = BrevgenClientTests.SampleRequest,
            ["blank"] = IGenererBrevArgsBuilder.Create().AddMarkdown("# Blank", null).WithBlankTemplate().Build(),
            ["direktorat"] = IGenererBrevArgsBuilder
                .Create()
                .AddMarkdown(
                    "# Hei {{ name }}",
                    new Dictionary<string, object?>
                    {
                        ["name"] = "Ola",
                        ["count"] = 42,
                        ["enabled"] = true,
                        ["absent"] = null,
                    }
                )
                .WithDirektoratTemplate(
                    Language.Nynorsk,
                    DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                    ["Kari", "Direktor"]
                )
                .WithDirektoratTemplateFields(
                    new DirektoratTemplateFields
                    {
                        Dato = "28.10.2026",
                        Saksnummer = "2026/123",
                        SaksbehandlerNavn = "Kari",
                        Mottaker = new DirektoratMottaker
                        {
                            Navn = "Eksempel AS",
                            Adresse = "Gate 1",
                            Postnr = "0123",
                            Poststed = "Oslo",
                        },
                        ErUnntattOffentlighet = true,
                        UnntattOffentlighetHjemmel = "offl. 14",
                    }
                )
                .WithMetadata("Contract letter", "Arbeidstilsynet")
                .Build(),
            ["custom"] = IGenererBrevArgsBuilder
                .Create()
                .AddMarkdown("# Custom", null)
                .WithCustomTemplate()
                .WithConversionOptions(
                    new PdfConfig
                    {
                        AsHtml = false,
                        Css = "p { color: blue; }",
                        MergeCss = true,
                        PageMediaType = "print",
                        PdfOptions = new PuppeteerPDFOptions
                        {
                            Format = PaperFormat.A4,
                            Scale = 0.9,
                            Width = "210mm",
                            Height = 297,
                            PrintBackground = true,
                            DisplayHeaderFooter = true,
                            HeaderTemplate = "<span>Header</span>",
                            FooterTemplate = "<span class=\"pageNumber\"></span>",
                            Margin = new PDFMargin { Top = "20mm", Bottom = "20mm" },
                        },
                    }
                )
                .Build(),
        };

    private sealed class FakeHttpClientFactory(HttpClient httpClient) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => httpClient;
    }
}
