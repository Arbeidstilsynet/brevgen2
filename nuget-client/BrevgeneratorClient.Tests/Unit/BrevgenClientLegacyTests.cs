using System.Net;
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;
using Shouldly;
using Xunit;
using Xunit.Microsoft.DependencyInjection.Abstracts;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class BrevgenClientLegacyTests : TestBed<BrevgenAppFixture>
{
    public BrevgenClientLegacyTests(ITestOutputHelper testOutputHelper, BrevgenAppFixture fixture)
        : base(testOutputHelper, fixture) { }

    [Fact]
    public async Task GenererBrev_WhenCalledWithBearerTokenProvider_ReturnsOk()
    {
        using var sut = DependencyInjection.Extensions.CreateBrevgeneratorClient(
            new TestHostEnvironment(),
            () => Task.FromResult(DummyBearerTokenProvider.DummyToken),
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = _fixture.GetBaseUri() }
        );

        //arrange
        _fixture.Server.RespondWith(HttpStatusCode.OK, "generertBrevString");

        //act
        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        //assert
        result.ShouldBe("generertBrevString");
        BrevgenClientTests.ShouldBeSampleRequest(_fixture.Server.LastRequest);
    }
}
