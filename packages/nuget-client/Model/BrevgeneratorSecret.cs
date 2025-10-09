using System.Text.Json.Serialization;

namespace AT.Brevgenerator.Klient.Model;

/// <summary>
/// Representerer strukturen til OAuth2 client credentials secret.
/// </summary>
public record BrevgeneratorSecret
{
    [JsonPropertyName("client_secret")]
    public string ClientSecret { get; init; } = string.Empty;
}
