using Arbeidstilsynet.Brevgenerator.Client.Implementation;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

/// <summary>
/// Deterministic <see cref="IRetryTimer"/> that records requested delays instead of sleeping in real time.
/// </summary>
internal sealed class FakeRetryTimer : IRetryTimer
{
    private readonly List<TimeSpan> _delays = [];

    internal IReadOnlyList<TimeSpan> Delays => _delays;

    public DateTimeOffset UtcNow { get; set; } = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    internal TimeSpan Jitter { get; set; } = TimeSpan.FromMilliseconds(250);

    /// <summary>
    /// Optional hook invoked after the delay has been recorded, before it completes.
    /// </summary>
    internal Func<CancellationToken, Task>? OnDelay { get; set; }

    public TimeSpan NextJitter() => Jitter;

    public async Task Delay(TimeSpan delay, CancellationToken cancellationToken)
    {
        _delays.Add(delay);
        cancellationToken.ThrowIfCancellationRequested();

        if (OnDelay is not null)
        {
            await OnDelay(cancellationToken);
        }

        cancellationToken.ThrowIfCancellationRequested();
    }
}
