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
    IHttpClientFactory httpClientFactory
) : IBrevgeneratorClient
{
    /// <summary>
    /// Header-navn brukt når AuthMode.ApiKey er valgt.
    /// </summary>
    public const string ApiKeyHeader = "x-api-key";

    private readonly HttpClient _httpClient = httpClientFactory.CreateClient(
        DependencyInjectionExtensions.BrevgeneratorHttpClientKey
    );
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        Converters = { new EnumMemberJsonConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <inheritdoc/>
    public async Task<string> GenererBrev(GenererBrevArgs payload)
    {
        var jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);
        var request = new HttpRequestMessage(HttpMethod.Post, "genererbrev")
        {
            Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json"),
        };
        await AddAuthHeader(request);
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
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
