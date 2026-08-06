namespace Arbeidstilsynet.Brevgenerator.Client.Implementation;

/// <summary>
/// Retry timing: current time, jitter and waiting. Injected so the client does not depend directly
/// on the ambient clock, which also lets tests drive retries without sleeping in real time.
/// </summary>
internal interface IRetryTimer
{
    /// <summary>
    /// Current time, used to interpret the HTTP-date form of <c>Retry-After</c>.
    /// </summary>
    DateTimeOffset UtcNow { get; }

    /// <summary>
    /// A small, strictly positive delay added on top of the server-provided delay so that
    /// multiple consumers do not retry at the exact same moment.
    /// </summary>
    TimeSpan NextJitter();

    /// <summary>
    /// Waits for <paramref name="delay"/>, observing <paramref name="cancellationToken"/>.
    /// </summary>
    Task Delay(TimeSpan delay, CancellationToken cancellationToken);
}

internal sealed class SystemRetryTimer : IRetryTimer
{
    private const int MaxJitterMilliseconds = 250;

    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;

    public TimeSpan NextJitter() => TimeSpan.FromMilliseconds(Random.Shared.Next(1, MaxJitterMilliseconds + 1));

    public Task Delay(TimeSpan delay, CancellationToken cancellationToken) => Task.Delay(delay, cancellationToken);
}
