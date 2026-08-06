using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;
using Arbeidstilsynet.Brevgenerator.Client.Extensions;
using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;

namespace Arbeidstilsynet.Brevgenerator.Client.Implementation;

internal class BrevgeneratorClient(
    BrevgeneratorConfig config,
    ITokenProvider tokenProvider,
    IHttpClientFactory httpClientFactory,
    IRetryTimer retryTimer
) : IBrevgeneratorClient
{
    /// <summary>
    /// Header-navn brukt når AuthMode.ApiKey er valgt.
    /// </summary>
    public const string ApiKeyHeader = "x-api-key";

    private const string GenererBrevPath = "genererbrev";

    private readonly HttpClient _httpClient = httpClientFactory.CreateClient(
        DependencyInjection.Extensions.BrevgeneratorHttpClientKey
    );
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        Converters = { new EnumMemberJsonConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <inheritdoc/>
    public Task<string> GenererBrev(GenererBrevArgs payload) => GenererBrev(payload, CancellationToken.None);

    /// <inheritdoc/>
    public async Task<string> GenererBrev(GenererBrevArgs payload, CancellationToken cancellationToken)
    {
        var jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);
        var maxAttempts = config.MaxRetryAttempts + 1;

        for (var attempt = 1; ; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Each attempt needs its own request and content: a sent request instance cannot be reused.
            using var request = new HttpRequestMessage(HttpMethod.Post, GenererBrevPath)
            {
                Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json"),
            };
            await AddAuthHeader(request);

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (attempt < maxAttempts)
            {
                var retryAfter = ServiceOverloadRetryPolicy.TryGetRetryDelay(
                    response,
                    retryTimer.UtcNow,
                    config.MaxRetryAfterDelay
                );

                if (retryAfter is { } delay)
                {
                    await retryTimer.Delay(delay + retryTimer.NextJitter(), cancellationToken);
                    continue;
                }
            }

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
    }

    private async Task AddAuthHeader(HttpRequestMessage request)
    {
        var token = await tokenProvider.GetToken();
        switch (config.AuthMode)
        {
            case AuthMode.BearerToken:
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                break;
            case AuthMode.ApiKey:
                request.Headers.Add(ApiKeyHeader, token);
                break;
            default:
                throw new InvalidOperationException($"Ukjent autentiseringsmodus: {config.AuthMode}");
        }
    }
}
