namespace AT.Brevgenerator.Klient;

public interface IApiKeyRetriever
{
    Task<string> RetrieveApiKeyAsync();
}
