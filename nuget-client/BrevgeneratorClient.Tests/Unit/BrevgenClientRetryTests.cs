using System.Net;
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Implementation;
using Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;
using Shouldly;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class BrevgenClientRetryTests
{
    private static readonly TimeSpan Jitter = TimeSpan.FromMilliseconds(250);

    [Fact]
    public async Task GenererBrev_WhenInitialRequestSucceeds_SendsSingleRequest()
    {
        var handler = new FakeHttpMessageHandler(Success);
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        result.ShouldBe("generertBrevString");
        handler.Requests.Count.ShouldBe(1);
        timer.Delays.ShouldBeEmpty();
    }

    [Fact]
    public async Task GenererBrev_WithoutCancellationToken_DelegatesToCancellationAwareOverload()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"), Success);
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        // Verifies the pre-existing overload still works end to end, including retry.
#pragma warning disable xUnit1051
        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest);
#pragma warning restore xUnit1051

        result.ShouldBe("generertBrevString");
        handler.Requests.Count.ShouldBe(2);
    }

    [Fact]
    public async Task GenererBrev_WhenOverloadedWithRetryAfterSeconds_WaitsServerDelayPlusPositiveJitter()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"), Success);
        var timer = new FakeRetryTimer { Jitter = Jitter };
        var sut = CreateSut(handler, timer);

        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        result.ShouldBe("generertBrevString");
        handler.Requests.Count.ShouldBe(2);
        var delay = timer.Delays.ShouldHaveSingleItem();
        delay.ShouldBeGreaterThan(TimeSpan.FromSeconds(5));
        delay.ShouldBe(TimeSpan.FromSeconds(5) + Jitter);
    }

    [Fact]
    public async Task GenererBrev_WhenOverloadedWithRetryAfterHttpDate_Retries()
    {
        var timer = new FakeRetryTimer { Jitter = Jitter };
        var retryAt = timer.UtcNow.AddSeconds(10);
        var handler = new FakeHttpMessageHandler(() => Overloaded(retryAt.ToString("R")), Success);
        var sut = CreateSut(handler, timer);

        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        result.ShouldBe("generertBrevString");
        handler.Requests.Count.ShouldBe(2);
        timer.Delays.ShouldHaveSingleItem().ShouldBe(TimeSpan.FromSeconds(10) + Jitter);
    }

    [Fact]
    public async Task GenererBrev_WhenOverloadPersists_StopsAfterThreeAttempts()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"));
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        var exception = await Should.ThrowAsync<HttpRequestException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken)
        );

        exception.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        handler.Requests.Count.ShouldBe(3);
        timer.Delays.Count.ShouldBe(2);
    }

    [Fact]
    public async Task GenererBrev_WhenMaxRetryAttemptsIsZero_SendsSingleRequest()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"));
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer, Config with { MaxRetryAttempts = 0 });

        await Should.ThrowAsync<HttpRequestException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken)
        );

        handler.Requests.Count.ShouldBe(1);
        timer.Delays.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(null)] // missing
    [InlineData("")] // empty
    [InlineData("straks")] // malformed
    [InlineData("-5")] // negative delta-seconds
    [InlineData("31")] // exceeds the configured maximum of 30 seconds
    [InlineData("Wed, 01 Jan 2026 11:59:00 GMT")] // expired HTTP-date
    [InlineData("Wed, 01 Jan 2026 12:00:31 GMT")] // HTTP-date exceeding the configured maximum
    [InlineData("i går")] // malformed HTTP-date
    public async Task GenererBrev_WhenOverloadLacksValidRetryGuidance_DoesNotRetry(string? retryAfter)
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded(retryAfter));
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        await Should.ThrowAsync<HttpRequestException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken)
        );

        handler.Requests.Count.ShouldBe(1);
        timer.Delays.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.BadGateway)]
    [InlineData(HttpStatusCode.GatewayTimeout)]
    public async Task GenererBrev_WhenResponseIsNotServiceUnavailable_DoesNotRetry(HttpStatusCode statusCode)
    {
        var handler = new FakeHttpMessageHandler(() =>
        {
            var response = new HttpResponseMessage(statusCode) { Content = new StringContent("feil") };
            response.Headers.TryAddWithoutValidation("Retry-After", "5");
            return response;
        });
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        await Should.ThrowAsync<HttpRequestException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken)
        );

        handler.Requests.Count.ShouldBe(1);
        timer.Delays.ShouldBeEmpty();
    }

    [Fact]
    public async Task GenererBrev_WhenRetryAfterMaximumIsRaised_RetriesLongerDelays()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("31"), Success);
        var timer = new FakeRetryTimer { Jitter = Jitter };
        var sut = CreateSut(handler, timer, Config with { MaxRetryAfterDelay = TimeSpan.FromSeconds(60) });

        var result = await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        result.ShouldBe("generertBrevString");
        timer.Delays.ShouldHaveSingleItem().ShouldBe(TimeSpan.FromSeconds(31) + Jitter);
    }

    [Fact]
    public async Task GenererBrev_OnEveryAttempt_SendsFreshRequestWithBodyAndAuthorizationHeader()
    {
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"), () => Overloaded("5"), Success);
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        await sut.GenererBrev(BrevgenClientTests.SampleRequest, TestContext.Current.CancellationToken);

        handler.Requests.Count.ShouldBe(3);
        foreach (var request in handler.Requests)
        {
            request.Method.ShouldBe(HttpMethod.Post);
            request.RequestUri.ShouldBe(new Uri("https://brevgenerator.test/genererbrev"));
            request.Authorization.ShouldBe($"Bearer {DummyBearerTokenProvider.DummyToken}");
            request.Body.ShouldNotBeNullOrWhiteSpace();
            request.Body.ShouldBe(handler.Requests[0].Body);
        }

        handler.RequestInstances.Distinct().Count().ShouldBe(3);
        handler.ContentInstances.Distinct().Count().ShouldBe(3);
    }

    [Fact]
    public async Task GenererBrev_WhenCancelledDuringRequest_Throws()
    {
        using var cts = new CancellationTokenSource();
        var handler = new FakeHttpMessageHandler(Success)
        {
            OnSend = async cancellationToken =>
            {
                await cts.CancelAsync();
                await Task.Delay(Timeout.Infinite, cancellationToken);
            },
        };
        var timer = new FakeRetryTimer();
        var sut = CreateSut(handler, timer);

        await Should.ThrowAsync<OperationCanceledException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, cts.Token)
        );

        handler.Requests.Count.ShouldBe(1);
    }

    [Fact]
    public async Task GenererBrev_WhenCancelledDuringRetryDelay_Throws()
    {
        using var cts = new CancellationTokenSource();
        var handler = new FakeHttpMessageHandler(() => Overloaded("5"), Success);
        var timer = new FakeRetryTimer { OnDelay = _ => cts.CancelAsync() };
        var sut = CreateSut(handler, timer);

        await Should.ThrowAsync<OperationCanceledException>(async () =>
            await sut.GenererBrev(BrevgenClientTests.SampleRequest, cts.Token)
        );

        handler.Requests.Count.ShouldBe(1);
        timer.Delays.ShouldHaveSingleItem();
    }

    [Fact]
    public void BrevgeneratorConfig_HasBoundedRetryDefaults()
    {
        var config = new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken };

        config.MaxRetryAttempts.ShouldBe(2);
        config.MaxRetryAfterDelay.ShouldBe(TimeSpan.FromSeconds(30));
    }

    [Fact]
    public void BrevgeneratorConfig_WhenRetryConfigurationIsNegative_Throws()
    {
        Should.Throw<ArgumentOutOfRangeException>(() =>
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, MaxRetryAttempts = -1 }
        );
        Should.Throw<ArgumentOutOfRangeException>(() =>
            new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, MaxRetryAfterDelay = TimeSpan.FromSeconds(-1) }
        );
    }

    [Fact]
    public void SystemRetryTimer_ProducesSmallPositiveJitter()
    {
        var timer = new SystemRetryTimer();

        for (var i = 0; i < 1000; i++)
        {
            var jitter = timer.NextJitter();
            jitter.ShouldBeGreaterThan(TimeSpan.Zero);
            jitter.ShouldBeLessThanOrEqualTo(TimeSpan.FromSeconds(1));
        }
    }

    private static readonly BrevgeneratorConfig Config = new()
    {
        AuthMode = AuthMode.BearerToken,
        BaseUrl = "https://brevgenerator.test/",
    };

    private static HttpResponseMessage Success() =>
        new(HttpStatusCode.OK) { Content = new StringContent("generertBrevString") };

    private static HttpResponseMessage Overloaded(string? retryAfter)
    {
        var response = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
        {
            Content = new StringContent("Service Unavailable"),
        };
        if (retryAfter is not null)
        {
            response.Headers.TryAddWithoutValidation("Retry-After", retryAfter);
        }
        return response;
    }

    private static Implementation.BrevgeneratorClient CreateSut(
        FakeHttpMessageHandler handler,
        IRetryTimer retryTimer,
        BrevgeneratorConfig? config = null
    )
    {
        config ??= Config;
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri(config.BaseUrl!) };
        return new Implementation.BrevgeneratorClient(
            config,
            new DummyBearerTokenProvider(),
            new FakeHttpClientFactory(httpClient),
            retryTimer
        );
    }

    private sealed class FakeHttpClientFactory(HttpClient httpClient) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => httpClient;
    }
}
