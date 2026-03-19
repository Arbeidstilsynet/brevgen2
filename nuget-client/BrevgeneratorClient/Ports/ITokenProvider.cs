namespace Arbeidstilsynet.Brevgenerator.Client.Ports;

/// <summary>
/// A token provider to be implemented by the consumer of this package.
/// </summary>
public interface ITokenProvider
{
    /// <summary>
    /// Returnerer enten en bearer token eller en api-key, basert på authMode
    /// </summary>
    /// <returns>valid bearer token eller api-key</returns>
    Task<string> GetToken();
}
