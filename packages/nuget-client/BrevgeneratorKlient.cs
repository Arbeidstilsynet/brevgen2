using System.Text;
using System.Text.Json;
using AT.Brevgenerator.Klient.Model;
using System.Text.Json.Serialization;

namespace AT.Brevgenerator.Klient;

public class BrevgeneratorKlient : IBrevgeneratorKlient
{
    private readonly IApiKeyRetriever _apiKeyRetriever;
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions =
        new()
        {
            Converters = { new JsonStringEnumConverter() },
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

    /// <summary>
    /// Konstruktør som ikke bruker miljøvariabler automatisk.
    /// </summary>
    /// <param name="config">Konfigurasjon av klienten.</param>
    /// <param name="apiKeyRetriever">Mekanismen som henter API key for brevgeneratoren</param>
    public BrevgeneratorKlient(BrevgeneratorConfig config, IApiKeyRetriever apiKeyRetriever)
    {
        _apiKeyRetriever = apiKeyRetriever;
        _httpClient = new HttpClient { BaseAddress = new Uri(config.ApiUrl) };
    }

    /// <summary>
    /// Konstruktør som ikke bruker miljøvariabler automatisk.
    /// </summary>
    /// <param name="config">Konfigurasjon av klienten.</param>
    /// <param name="apiKeyRetriever">Mekanismen som henter API key for brevgeneratoren</param>
    /// <param name="httpClientFactory">HttpClientFactory</param>
    public BrevgeneratorKlient(
        BrevgeneratorConfig config,
        IApiKeyRetriever apiKeyRetriever,
        IHttpClientFactory httpClientFactory
    )
    {
        _apiKeyRetriever = apiKeyRetriever;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.BaseAddress = new Uri(config.ApiUrl);
    }

    /// <inheritdoc/>
    public async Task<string> GenererBrev(GenererBrevArgs payload)
    {
        await EnsureApiKeyInHeader();

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

    private async Task EnsureApiKeyInHeader()
    {
        if (_httpClient.DefaultRequestHeaders.Contains("x-api-key"))
        {
            return;
        }

        var apiKey = await _apiKeyRetriever.RetrieveApiKeyAsync();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
    }
}
