using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;

/// <summary>
/// Konfigurasjon av brevgenerator.
/// </summary>
public record BrevgeneratorConfig
{
    public required AuthMode AuthMode { get; init; }

    /// <summary>
    /// Overstyr base URL for Brevgenerator API. Hvis ikke satt, vil klienten automatisk velge base URL basert på det nåværende miljøet per <see cref="IHostEnvironment.EnvironmentName"/>.
    /// </summary>
    public string? BaseUrl { get; init; }
}
