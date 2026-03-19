using Arbeidstilsynet.Common.BrevgeneratorClient.Ports;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Tests.Fixture
{
    internal class DummyBearerTokenProvider : ITokenProvider
    {
        internal const string DummyToken = "test";

        public Task<string> GetToken()
        {
            return Task.FromResult(DummyToken);
        }
    }
}
