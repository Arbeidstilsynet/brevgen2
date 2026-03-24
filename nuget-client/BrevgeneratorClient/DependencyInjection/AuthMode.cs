namespace Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;

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
