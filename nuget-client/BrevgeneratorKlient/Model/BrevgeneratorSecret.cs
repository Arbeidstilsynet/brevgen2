using System.Text.Json.Serialization;

namespace Arbeidstilsynet.Brevgenerator.Klient.Model;

/// <summary>
/// Representerer strukturen til OAuth2 client credentials secret.
/// </summary>
public record BrevgeneratorSecret
{
    /// <summary>
    /// Client secret value
    /// </summary>
    [JsonPropertyName("client_secret")]
    public string ClientSecret { get; init; } = string.Empty;

    /// <summary>
    /// Client ID (Application ID) in Azure
    /// </summary>
    [JsonPropertyName("client_id")]
    public string ClientId { get; init; } = string.Empty;

    /// <summary>
    /// Tenant ID in Azure
    /// </summary>
    [JsonPropertyName("tenant_id")]
    public string TenantId { get; init; } = string.Empty;

    /// <summary>
    /// Scope for the token request. Defaults to api://{ClientId}/.default
    /// </summary>
    [JsonIgnore]
    public string Scope => $"api://{ClientId}/.default";
}
