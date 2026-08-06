using System.Net;

namespace Arbeidstilsynet.Brevgenerator.Client.Implementation;

/// <summary>
/// Decides whether a response is an explicit, retryable service overload.
/// Only <see cref="HttpStatusCode.ServiceUnavailable"/> responses carrying valid
/// <c>Retry-After</c> guidance are retryable; everything else is surfaced to the caller.
/// </summary>
internal static class ServiceOverloadRetryPolicy
{
    /// <summary>
    /// Returns the delay the server asked us to wait, or <c>null</c> when the response must not be retried.
    /// </summary>
    /// <param name="response">The response to inspect.</param>
    /// <param name="now">Current time, used to interpret the HTTP-date form of <c>Retry-After</c>.</param>
    /// <param name="maxDelay">Largest delay we are willing to accept. Longer delays are never clamped, only rejected.</param>
    internal static TimeSpan? TryGetRetryDelay(HttpResponseMessage response, DateTimeOffset now, TimeSpan maxDelay)
    {
        if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
        {
            return null;
        }

        var retryAfter = response.Headers.RetryAfter;
        if (retryAfter is null)
        {
            return null;
        }

        TimeSpan delay;
        if (retryAfter.Delta is { } delta)
        {
            delay = delta;
        }
        else if (retryAfter.Date is { } date)
        {
            delay = date - now;
        }
        else
        {
            return null;
        }

        if (delay < TimeSpan.Zero || delay > maxDelay)
        {
            return null;
        }

        return delay;
    }
}
