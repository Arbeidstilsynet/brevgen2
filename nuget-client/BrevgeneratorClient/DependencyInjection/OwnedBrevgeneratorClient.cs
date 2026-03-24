using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Microsoft.Extensions.DependencyInjection;

namespace Arbeidstilsynet.Brevgenerator.Client.DependencyInjection;

/// <summary>
/// Owns the internal service provider used to construct a direct Brevgenerator client.
/// </summary>
public sealed class OwnedBrevgeneratorClient : IBrevgeneratorClient, IDisposable, IAsyncDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly IBrevgeneratorClient _inner;

    internal OwnedBrevgeneratorClient(ServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _inner = serviceProvider.GetRequiredService<IBrevgeneratorClient>();
    }

    /// <inheritdoc />
    public Task<string> GenererBrev(GenererBrevArgs payload)
    {
        return _inner.GenererBrev(payload);
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _serviceProvider.Dispose();
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        return _serviceProvider.DisposeAsync();
    }
}
