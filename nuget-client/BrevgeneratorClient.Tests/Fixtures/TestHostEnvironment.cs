using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

internal sealed class TestHostEnvironment : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Test";
    public string ApplicationName { get; set; } = "BrevgeneratorClient.Tests";
    public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}
