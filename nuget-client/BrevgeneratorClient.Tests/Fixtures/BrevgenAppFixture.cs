using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting.Internal;
using WireMock.Server;
using WireMock.Settings;
using Xunit.Microsoft.DependencyInjection;
using Xunit.Microsoft.DependencyInjection.Abstracts;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

public class BrevgenAppFixture : TestBedFixture
{
    private readonly WireMockServer _server;

    internal WireMockServer Server => _server;

    public BrevgenAppFixture()
    {
        _server = WireMockServer.Start();
    }

    public void ResetMappings()
    {
        _server.ResetMappings();
    }

    public string GetBaseUri()
    {
        return _server.Urls[0];
    }

    protected override void AddServices(IServiceCollection services, IConfiguration? configuration)
    {
        services.AddBrevgeneratorClient<DummyBearerTokenProvider>(
            new HostingEnvironment { EnvironmentName = "Test" },
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = GetBaseUri() }
        );
    }

    protected override IEnumerable<TestAppSettings> GetTestAppSettings() => [];

    protected override ValueTask DisposeAsyncCore()
    {
        _server.Stop();
        _server.Dispose();
        return ValueTask.CompletedTask;
    }
}
