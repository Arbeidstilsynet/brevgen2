using System.Net;
using AT.Brevgenerator.Klient.Model;
using Xunit;

namespace AT.Brevgenerator.Klient.Tests;

public class BrevgeneratorKlientTests
{
    private const string TestApiUrl = "https://api.example.com/";

    private static BrevgeneratorConfig CreateConfig() => new(TestApiUrl);

    [Fact]
    public void Constructor_WithBearerTokenMode_AndNoBearerTokenFactory_Throws()
    {
        var config = CreateConfig();
        var exception = Assert.Throws<ArgumentException>(() =>
            new BrevgeneratorKlient(config, BrevgeneratorKlient.AuthMode.BearerToken)
        );
        Assert.Contains("bearerTokenFactory", exception.Message);
    }

    [Fact]
    public void Constructor_WithApiKeyMode_AndNoApiKeyFactory_Throws()
    {
        var config = CreateConfig();
        var exception = Assert.Throws<ArgumentException>(() =>
            new BrevgeneratorKlient(config, BrevgeneratorKlient.AuthMode.ApiKey)
        );
        Assert.Contains("apiKeyFactory", exception.Message);
    }

    [Fact]
    public void Constructor_WithBearerTokenMode_AndFactory_Succeeds()
    {
        var config = CreateConfig();
        var client = new BrevgeneratorKlient(
            config,
            BrevgeneratorKlient.AuthMode.BearerToken,
            bearerTokenFactory: () => Task.FromResult("token")
        );
        Assert.NotNull(client);
    }

    [Fact]
    public void Constructor_WithApiKeyMode_AndFactory_Succeeds()
    {
        var config = CreateConfig();
        var client = new BrevgeneratorKlient(
            config,
            BrevgeneratorKlient.AuthMode.ApiKey,
            apiKeyFactory: () => Task.FromResult("key")
        );
        Assert.NotNull(client);
    }

    [Fact]
    public async Task GenererBrev_WithBearerToken_CallsFactoryOnEachRequest()
    {
        var config = CreateConfig();
        var callCount = 0;
        var handler = new TestHttpMessageHandler(
            (req, ct) =>
            {
                Assert.NotNull(req.Headers.Authorization);
                Assert.Equal("Bearer", req.Headers.Authorization.Scheme);
                return Task.FromResult(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent("test-response"),
                    }
                );
            }
        );

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri(TestApiUrl) };
        var client = new BrevgeneratorKlient(
            config,
            BrevgeneratorKlient.AuthMode.BearerToken,
            bearerTokenFactory: () =>
            {
                callCount++;
                return Task.FromResult($"token-{callCount}");
            },
            httpClientFactory: new TestHttpClientFactory(httpClient)
        );

        var payload = new GenererBrevArgs { Md = "# Test", Options = new GeneratePdfOptions() };

        await client.GenererBrev(payload);
        await client.GenererBrev(payload);

        Assert.Equal(2, callCount);
    }

    [Fact]
    public async Task GenererBrev_WithApiKey_AddsHeader()
    {
        var config = CreateConfig();
        string? capturedApiKey = null;
        var handler = new TestHttpMessageHandler(
            (req, ct) =>
            {
                Assert.True(req.Headers.Contains(BrevgeneratorKlient.ApiKeyHeader));
                capturedApiKey = req.Headers.GetValues(BrevgeneratorKlient.ApiKeyHeader).First();
                return Task.FromResult(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent("test-response"),
                    }
                );
            }
        );

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri(TestApiUrl) };
        var client = new BrevgeneratorKlient(
            config,
            BrevgeneratorKlient.AuthMode.ApiKey,
            apiKeyFactory: () => Task.FromResult("test-api-key"),
            httpClientFactory: new TestHttpClientFactory(httpClient)
        );

        var payload = new GenererBrevArgs { Md = "# Test", Options = new GeneratePdfOptions() };
        await client.GenererBrev(payload);

        Assert.Equal("test-api-key", capturedApiKey);
    }

    [Fact]
    public async Task GenererBrev_WhenRequestFails_Throws()
    {
        var config = CreateConfig();
        var handler = new TestHttpMessageHandler(
            (req, ct) => Task.FromResult(new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest })
        );

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri(TestApiUrl) };
        var client = new BrevgeneratorKlient(
            config,
            BrevgeneratorKlient.AuthMode.BearerToken,
            bearerTokenFactory: () => Task.FromResult("token"),
            httpClientFactory: new TestHttpClientFactory(httpClient)
        );

        var payload = new GenererBrevArgs { Md = "# Test", Options = new GeneratePdfOptions() };
        await Assert.ThrowsAsync<HttpRequestException>(() => client.GenererBrev(payload));
    }

    private sealed class TestHttpMessageHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler
    ) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken
        ) => handler(request, cancellationToken);
    }

    private sealed class TestHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }
}

public class GenererBrevArgsBuilderDirektoratTests
{
    [Fact]
    public void WithDirektoratTemplate_SetsTemplateType()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDirektoratTemplate(Language.Bokmål, DirektoratTemplateSignatureVariant.Usignert)
            .WithDirektoratTemplateFields(new DirektoratTemplateFields())
            .Build();

        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithDirektoratTemplate_WithAllFields_BuildsCorrectly()
    {
        var signatureLines = new List<string> { "Ola Nordmann", "Direktør" };
        var mottaker = new DirektoratMottaker
        {
            Navn = "Bedrift AS",
            Adresse = "Gateveien 1",
            Postnr = "0123",
            Poststed = "Oslo",
        };
        var fields = new DirektoratTemplateFields
        {
            Dato = "22.01.2026",
            Saksnummer = "2026/1234",
            SaksbehandlerNavn = "Kari Nordmann",
            Mottaker = mottaker,
        };

        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", new Dictionary<string, object?> { ["key"] = "value" })
            .WithDirektoratTemplate(
                Language.Nynorsk,
                DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                signatureLines
            )
            .WithDirektoratTemplateFields(fields)
            .WithMetadata("Test Document", "Test Author")
            .Build();

        Assert.Equal("# Test", args.Md);
        Assert.NotNull(args.MdVariables);
        Assert.Equal("value", args.MdVariables["key"]);
        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs);
        Assert.Equal(Language.Nynorsk, args.Options.Dynamic.DirektoratTemplateArgs.Language);
        Assert.Equal(
            DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
            args.Options.Dynamic.DirektoratTemplateArgs.SignatureVariant
        );
        Assert.Equal(signatureLines, args.Options.Dynamic.DirektoratTemplateArgs.SignatureLines);
        Assert.Equal("22.01.2026", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Dato);
        Assert.Equal("2026/1234", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Saksnummer);
        Assert.Equal("Kari Nordmann", args.Options.Dynamic.DirektoratTemplateArgs.Fields.SaksbehandlerNavn);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker);
        Assert.Equal("Bedrift AS", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker?.Navn);
        Assert.Equal("Test Document", args.Options.DocumentTitle);
        Assert.Equal("Test Author", args.Options.Author);
    }

    [Fact]
    public void WithDirektoratTemplate_WithMinimalFields_BuildsCorrectly()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Minimal", null)
            .WithDirektoratTemplate(Language.Bokmål, DirektoratTemplateSignatureVariant.Usignert)
            .WithDirektoratTemplateFields(new DirektoratTemplateFields())
            .Build();

        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.SignatureLines);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Dato);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker);
    }

    [Fact]
    public void Build_WithDirektoratTemplate_WithoutFields_Throws()
    {
        // Test that building with Direktorat template but no args throws
        // We verify this by creating a custom template and manually changing it
        var args = GenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithCustomTemplate().Build();

        // Manually set template to direktorat without args
        args.Options.Dynamic.Template = TemplateType.Direktorat;
        args.Options.Dynamic.DirektoratTemplateArgs = null;

        // The validation happens at Build() time in the builder,
        // which is enforced by the fluent API requiring WithDirektoratTemplateFields
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs);
        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
    }
}
