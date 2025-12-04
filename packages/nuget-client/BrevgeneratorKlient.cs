using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AT.Brevgenerator.Klient.Model;

namespace AT.Brevgenerator.Klient;

public class BrevgeneratorKlient : IBrevgeneratorKlient
{
    /// <summary>
    /// Hvilken autentisering som skal benyttes mot API.
    /// </summary>
    public enum AuthMode
    {
        /// <summary>
        /// Bruk Bearer token (Authorization: Bearer &lt;token&gt;).
        /// </summary>
        BearerToken,

        /// <summary>
        /// Bruk API key i headeren "x-api-key". Konsumenten må selv levere nøkkelen.
        /// </summary>
        ApiKey,
    }

    /// <summary>
    /// Header-navn brukt når AuthMode.ApiKey er valgt.
    /// </summary>
    public const string ApiKeyHeader = "x-api-key";

    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        Converters = { new EnumMemberJsonConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly AuthMode _authMode;
    private readonly Func<Task<string>>? _bearerTokenFactory;
    private readonly Func<Task<string>>? _apiKeyFactory;

    /// <summary>
    /// Konstruktør. Autentiseringsmodus må angis eksplisitt.
    /// </summary>
    /// <param name="config">Konfigurasjon</param>
    /// <param name="authMode">Autentiseringsmodus (BearerToken eller ApiKey)</param>
    /// <param name="bearerTokenFactory">Factory som returnerer bearer token dersom authMode=BearerToken</param>
    /// <param name="apiKeyFactory">Factory som returnerer API key dersom authMode=ApiKey</param>
    /// <param name="httpClientFactory">Valgfri HttpClientFactory</param>
    public BrevgeneratorKlient(
        BrevgeneratorConfig config,
        AuthMode authMode,
        Func<Task<string>>? bearerTokenFactory = null,
        Func<Task<string>>? apiKeyFactory = null,
        IHttpClientFactory? httpClientFactory = null
    )
    {
        _authMode = authMode;
        _bearerTokenFactory = bearerTokenFactory;
        _apiKeyFactory = apiKeyFactory;
        _httpClient = httpClientFactory?.CreateClient() ?? new HttpClient();
        _httpClient.BaseAddress = new Uri(config.ApiUrl);

        if (_authMode == AuthMode.BearerToken && _bearerTokenFactory == null)
        {
            throw new ArgumentException("bearerTokenFactory må settes når authMode=BearerToken");
        }
        if (_authMode == AuthMode.ApiKey && _apiKeyFactory == null)
        {
            throw new ArgumentException("apiKeyFactory må settes når authMode=ApiKey");
        }
    }

    /// <inheritdoc/>
    public async Task<string> GenererBrev(GenererBrevArgs payload)
    {
        await EnsureAuthHeader();

        var jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);
        Console.WriteLine($"BrevgeneratorKlient.GenererBrev payload: {jsonPayload}");
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("genererbrev", content);
        try
        {
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Request failed with status code {response.StatusCode}. Response body: {responseBody}");
            throw;
        }

        return await response.Content.ReadAsStringAsync();
    }

    private async Task EnsureAuthHeader()
    {
        switch (_authMode)
        {
            case AuthMode.BearerToken:
                if (_httpClient.DefaultRequestHeaders.Authorization == null)
                {
                    if (_bearerTokenFactory == null)
                    {
                        throw new InvalidOperationException(
                            "AuthMode.BearerToken valgt men bearerTokenFactory er ikke satt."
                        );
                    }
                    var token = await _bearerTokenFactory();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                }
                break;
            case AuthMode.ApiKey:
                if (!_httpClient.DefaultRequestHeaders.Contains(ApiKeyHeader))
                {
                    if (_apiKeyFactory == null)
                    {
                        throw new InvalidOperationException("AuthMode.ApiKey valgt men apiKeyFactory er ikke satt.");
                    }
                    var key = await _apiKeyFactory();
                    _httpClient.DefaultRequestHeaders.Add(ApiKeyHeader, key);
                }
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(_authMode), _authMode, null);
        }
    }
}
