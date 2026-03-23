using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;
using Microsoft.Extensions.Hosting.Internal;
using Shouldly;
using WireMock.Matchers;
using Xunit;
using Xunit.Microsoft.DependencyInjection.Abstracts;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class BrevgenClientLegacyTests : TestBed<BrevgenAppFixture>
{
    private readonly IBrevgeneratorClient _sut;

    public BrevgenClientLegacyTests(ITestOutputHelper testOutputHelper, BrevgenAppFixture fixture)
        : base(testOutputHelper, fixture)
    {
        _sut = DependencyInjection.Extensions.CreateBrevgeneratorClient(
            new HostingEnvironment { EnvironmentName = "Test" },
            () => Task.FromResult(DummyBearerTokenProvider.DummyToken),
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = _fixture.GetBaseUri() }
        );
    }

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
        var result = await _sut.GenererBrev(BrevgenClientTests.SampleRequest);

        //assert
        result.ShouldBeEquivalentTo("generertBrevString");
    }
}
