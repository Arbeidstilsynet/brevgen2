using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;

/// <summary>
/// Konfigurasjon av brevgenerator.
/// </summary>
public record BrevgeneratorConfig
{
    private readonly int _maxRetryAttempts = 2;
    private readonly TimeSpan _maxRetryAfterDelay = TimeSpan.FromSeconds(30);

    public required AuthMode AuthMode { get; init; }

    /// <summary>
    /// Overstyr base URL for Brevgenerator API. Hvis ikke satt, vil klienten automatisk velge base URL basert på det nåværende miljøet per <see cref="IHostEnvironment.EnvironmentName"/>.
    /// </summary>
    public string? BaseUrl { get; init; }

    /// <summary>
    /// Maks antall automatiske nye forsøk etter det første forsøket, når APIet svarer <c>503 Service Unavailable</c>
    /// med en gyldig <c>Retry-After</c>-header. Standard er 2, altså maks 3 forsøk totalt.
    /// Sett til <c>0</c> for å skru av automatisk retry.
    /// </summary>
    /// <exception cref="ArgumentOutOfRangeException">Hvis verdien er negativ.</exception>
    public int MaxRetryAttempts
    {
        get => _maxRetryAttempts;
        init =>
            _maxRetryAttempts =
                value >= 0
                    ? value
                    : throw new ArgumentOutOfRangeException(nameof(MaxRetryAttempts), value, "Kan ikke være negativ.");
    }

    /// <summary>
    /// Største <c>Retry-After</c>-verdi klienten godtar. Standard er 30 sekunder.
    /// Ved lengre verdier blir 503-svaret returnert til kalleren i stedet for at ventetiden kortes ned.
    /// </summary>
    /// <exception cref="ArgumentOutOfRangeException">Hvis verdien er negativ.</exception>
    public TimeSpan MaxRetryAfterDelay
    {
        get => _maxRetryAfterDelay;
        init =>
            _maxRetryAfterDelay =
                value >= TimeSpan.Zero
                    ? value
                    : throw new ArgumentOutOfRangeException(
                        nameof(MaxRetryAfterDelay),
                        value,
                        "Kan ikke være negativ."
                    );
    }
}
