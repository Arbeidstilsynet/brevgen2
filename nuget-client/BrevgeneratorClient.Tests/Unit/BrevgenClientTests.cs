using System.Text.Json;
using System.Text.Json.Serialization;
using Arbeidstilsynet.Brevgenerator.Client.Implementation;
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;
using Shouldly;
using WireMock.Matchers;
using Xunit;
using Xunit.Microsoft.DependencyInjection.Abstracts;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class BrevgenClientTests : TestBed<BrevgenAppFixture>
{
    private readonly IBrevgeneratorClient _sut;

    public BrevgenClientTests(ITestOutputHelper testOutputHelper, BrevgenAppFixture fixture)
        : base(testOutputHelper, fixture)
    {
        _sut = fixture.GetService<IBrevgeneratorClient>(testOutputHelper)!;
    }

    internal static GenererBrevArgs SampleRequest = new Model.GenererBrevArgs()
    {
        Md = "# Test {test}",
        MdVariables = new Dictionary<string, object?> { { "test", "test-var" } },
        Options = new Model.GeneratePdfOptions()
        {
            Author = "Arbeidstilsynet",
            Css = ".test { color: blue }",
            Dynamic = new DynamicMdPdfConfig
            {
                Template = TemplateType.Default,
                DefaultTemplateArgs = new DefaultTemplateArgs(
                    Language.Bokmål,
                    DefaultTemplateSignatureVariant.ElektroniskGodkjent,
                    new DefaultTemplateFields
                    {
                        Dato = new DateTime(2026, 01, 01).ToString("o"),
                        Saksnummer = "2026/0001",
                        SaksbehandlerNavn = "Tester",
                        Virksomhet = new Virksomhet
                        {
                            Navn = "Test AS",
                            Adresse = "Gate 1",
                            Postnr = "1234",
                            Poststed = "Et Sted",
                        },
                    }
                ),
                DirektoratTemplateArgs = new DirektoratTemplateArgs(Language.Nynorsk, new(), new(), null),
            },
            DocumentTitle = "test",
            AsHtml = true,
            PdfOptions = new Model.PuppeteerPDFOptions { Format = PaperFormat.A4 },
        },
    };

    [Fact]
    public async Task GenererBrev_WhenCalledWithBearerTokenProvider_ReturnsOk()
    {
        //arrange

        _fixture
            .Server.WhenRequest(r =>
                r.UsingPost()
                    .WithPath("/genererbrev")
                    .WithHeader("Authorization", $"Bearer {DummyBearerTokenProvider.DummyToken}")
                    .WithHeader("Content-Type", "application/json; charset=utf-8")
                    .WithBody(
                        new JsonMatcher(
                            """
                            {
                                "md": "# Test {test}",
                                "mdVariables": {
                                    "test": "test-var"
                                },
                                "options": {
                                    "dynamic": {
                                    "template": "default",
                                    "defaultTemplateArgs": {
                                        "language": "bm",
                                        "fields": {
                                        "dato": "2026-01-01T00:00:00.0000000",
                                        "saksnummer": "2026/0001",
                                        "saksbehandlerNavn": "Tester",
                                        "virksomhet": {
                                            "navn": "Test AS",
                                            "adresse": "Gate 1",
                                            "postnr": "1234",
                                            "poststed": "Et Sted"
                                        }
                                        },
                                        "signatureVariant": "elektroniskGodkjent"
                                    },
                                    "direktoratTemplateArgs": {
                                        "language": "nn",
                                        "signatureVariant": "usignert",
                                        "fields": {}
                                    }
                                    },
                                    "as_html": true,
                                    "author": "Arbeidstilsynet",
                                    "css": ".test { color: blue }",
                                    "document_title": "test",
                                    "pdf_options": {
                                    "format": "a4"
                                    }
                                }
                                }
                            """
                        )
                    )
            )
            .ThenRespondWith(r => r.WithStatusCode(System.Net.HttpStatusCode.OK).WithBody("generertBrevString"));

        //act
        var result = await _sut.GenererBrev(SampleRequest);

        //assert
        result.ShouldBeEquivalentTo("generertBrevString");
    }
}
