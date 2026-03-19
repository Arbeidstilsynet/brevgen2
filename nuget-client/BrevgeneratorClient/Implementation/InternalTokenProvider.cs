using Arbeidstilsynet.Brevgenerator.Client.Ports;

namespace Arbeidstilsynet.Brevgenerator.Client.Implementation;

internal class InternalTokenProvider(Func<Task<string>> tokenFunc) : ITokenProvider
{
    public Task<string> GetToken()
    {
        return tokenFunc.Invoke();
    }
}
