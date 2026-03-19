using Arbeidstilsynet.Common.BrevgeneratorClient.Ports;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Implementation;

internal class InternalTokenProvider(Func<Task<string>> tokenFunc) : ITokenProvider
{
    public Task<string> GetToken()
    {
        return tokenFunc.Invoke();
    }
}
