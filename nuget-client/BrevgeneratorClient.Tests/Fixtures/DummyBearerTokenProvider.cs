using Arbeidstilsynet.Brevgenerator.Client.Ports;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture
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
