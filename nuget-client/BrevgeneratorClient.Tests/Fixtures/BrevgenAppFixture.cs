using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit.Microsoft.DependencyInjection;
using Xunit.Microsoft.DependencyInjection.Abstracts;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

public class BrevgenAppFixture : TestBedFixture
{
    private readonly LoopbackHttpServer _server = new();

    internal LoopbackHttpServer Server => _server;

    public string GetBaseUri()
    {
        return _server.Url;
    }

    protected override void AddServices(IServiceCollection services, IConfiguration? configuration)
    {
        services.AddBrevgeneratorClient<DummyBearerTokenProvider>(
            new TestHostEnvironment(),
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = GetBaseUri() }
        );
    }

    protected override IEnumerable<TestAppSettings> GetTestAppSettings() => [];

    protected override ValueTask DisposeAsyncCore()
    {
        _server.Dispose();
        return ValueTask.CompletedTask;
    }
}
