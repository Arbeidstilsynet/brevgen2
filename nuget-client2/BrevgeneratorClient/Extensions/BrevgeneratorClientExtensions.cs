using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Extensions;

/// <summary>
/// Extensions for BrevgeneratorClient
/// </summary>
public static class BrevgeneratorClientExtensions
{
    /// <summary>
    ///
    /// </summary>
    /// <param name="env">The current environment</param>
    /// <returns>Returns a base url matching the current environment</returns>
    public static Uri GetBrevgenBaseUri(this IHostEnvironment env)
    {
        if (env.IsProduction())
        {
            return new Uri("https://brevgenerator.arbeidstilsynet.no/", UriKind.Absolute);
        }
        return new Uri("https://brevgenerator.dev.arbeidstilsynet.no/", UriKind.Absolute);
    }
}
