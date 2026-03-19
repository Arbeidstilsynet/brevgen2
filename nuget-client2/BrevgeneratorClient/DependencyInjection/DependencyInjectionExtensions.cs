using Arbeidstilsynet.Common.BrevgeneratorClient.Extensions;
using Arbeidstilsynet.Common.BrevgeneratorClient.Ports;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.DependencyInjection;

/// <summary>
/// Extensions for Dependency Injection.
/// </summary>
public static class DependencyInjectionExtensions
{
    internal const string BrevgeneratorHttpClientKey = "BrevgeneratorHttpClient";

    /// <summary>
    /// Registers an implementation av <see cref="IBrevgeneratorClient"/> in <paramref name="services"/>.
    /// </summary>
    /// <param name="services"><see cref="IServiceCollection"/> to register the service in.</param>
    /// <param name="hostEnvironment">the current host environment</param>
    /// <param name="brevgeneratorConfig">an optional brevgeneratorConfig</param>
    /// <returns><see cref="IServiceCollection"/> for chaining.</returns>
    public static IServiceCollection AddBrevgeneratorClient<T>(
        this IServiceCollection services,
        IHostEnvironment hostEnvironment,
        BrevgeneratorConfig? brevgeneratorConfig = null
    )
        where T : class, ITokenProvider
    {
        brevgeneratorConfig ??= new BrevgeneratorConfig { AuthMode = AuthMode.BearerToken, BaseUrl = null };
        services.AddSingleton(brevgeneratorConfig);
        services.AddSingleton<IBrevgeneratorClient, Implementation.BrevgeneratorClient>();
        services.AddSingleton<ITokenProvider, T>();
        services.AddHttpClient(
            BrevgeneratorHttpClientKey,
            configureClient =>
                configureClient.BaseAddress = new Uri(
                    string.IsNullOrEmpty(brevgeneratorConfig.BaseUrl)
                        ? hostEnvironment.GetBrevgenBaseUri()
                        : brevgeneratorConfig.BaseUrl
                )
        );
        return services;
    }
}
