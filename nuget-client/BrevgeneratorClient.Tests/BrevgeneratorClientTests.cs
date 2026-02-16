using System.Net;
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class BrevgeneratorKlientTests
{
    private const string TestApiUrl = "https://api.example.com/";

    private static BrevgeneratorConfig CreateConfig() => new(TestApiUrl);

    [Fact]
    public void Constructor_WithBearerTokenMode_AndNoBearerTokenFactory_Throws()
    {
        var config = CreateConfig();
        var exception = Assert.Throws<ArgumentException>(() =>
            new BrevgeneratorClient(config, BrevgeneratorClient.AuthMode.BearerToken)
        );
        Assert.Contains("bearerTokenFactory", exception.Message);
    }

    [Fact]
    public void Constructor_WithApiKeyMode_AndNoApiKeyFactory_Throws()
    {
        var config = CreateConfig();
        var exception = Assert.Throws<ArgumentException>(() =>
            new BrevgeneratorClient(config, BrevgeneratorClient.AuthMode.ApiKey)
        );
        Assert.Contains("apiKeyFactory", exception.Message);
    }

    [Fact]
    public void Constructor_WithBearerTokenMode_AndFactory_Succeeds()
    {
        var config = CreateConfig();
        var client = new BrevgeneratorClient(
            config,
            BrevgeneratorClient.AuthMode.BearerToken,
            bearerTokenFactory: () => Task.FromResult("token")
        );
        Assert.NotNull(client);
    }

    [Fact]
    public void Constructor_WithApiKeyMode_AndFactory_Succeeds()
    {
        var config = CreateConfig();
        var client = new BrevgeneratorClient(
            config,
            BrevgeneratorClient.AuthMode.ApiKey,
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
        var client = new BrevgeneratorClient(
            config,
            BrevgeneratorClient.AuthMode.BearerToken,
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
                Assert.True(req.Headers.Contains(BrevgeneratorClient.ApiKeyHeader));
                capturedApiKey = req.Headers.GetValues(BrevgeneratorClient.ApiKeyHeader).First();
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
        var client = new BrevgeneratorClient(
            config,
            BrevgeneratorClient.AuthMode.ApiKey,
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
        var client = new BrevgeneratorClient(
            config,
            BrevgeneratorClient.AuthMode.BearerToken,
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
