using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Brevgenerator.Client.Extensions;

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
    public static string GetBrevgenBaseUri(this IHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            return "http://localhost:4000";
        }
        else if (env.IsProduction())
        {
            return "https://brevgen2-api.arbeidstilsynet.no/";
        }
        else
        {
            return "https://brevgen2-api.dev.arbeidstilsynet.no/";
        }
    }
}
