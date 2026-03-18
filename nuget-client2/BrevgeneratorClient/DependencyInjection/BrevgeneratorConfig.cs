namespace Arbeidstilsynet.Common.BrevgeneratorClient.DependencyInjection;

/// <summary>
/// Konfigurasjon av brevgenerator.
/// </summary>
public record BrevgeneratorConfig
{
    public required AuthMode AuthMode { get; init; }

    public required string? BaseUrl { get; init; }
}
