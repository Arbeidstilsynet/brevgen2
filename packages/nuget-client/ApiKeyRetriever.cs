using Amazon.SimpleSystemsManagement;
using Amazon.SimpleSystemsManagement.Model;
using Amazon.APIGateway;
using Amazon.APIGateway.Model;
using Amazon.Runtime;

namespace AT.Brevgenerator.Klient;

public class ApiKeyRetriever : IApiKeyRetriever
{
    private readonly string _parameterStoreName;
    private readonly IAmazonSimpleSystemsManagement _ssmClient;
    private readonly IAmazonAPIGateway _apiGatewayClient;

    public ApiKeyRetriever(BrevgeneratorConfig config, AWSCredentials credentials)
    {
        _parameterStoreName = config.ParameterStoreApiKeyIdName;
        _ssmClient = new AmazonSimpleSystemsManagementClient(credentials, config.RegionEndpoint);
        _apiGatewayClient = new AmazonAPIGatewayClient(credentials, config.RegionEndpoint);
    }

    public ApiKeyRetriever(BrevgeneratorConfig config)
    {
        _parameterStoreName = config.ParameterStoreApiKeyIdName;
        _ssmClient = new AmazonSimpleSystemsManagementClient(config.RegionEndpoint);
        _apiGatewayClient = new AmazonAPIGatewayClient(config.RegionEndpoint);
    }

    public ApiKeyRetriever(
        BrevgeneratorConfig config,
        IAmazonSimpleSystemsManagement ssmClient,
        IAmazonAPIGateway apiGatewayClient
    )
    {
        _parameterStoreName = config.ParameterStoreApiKeyIdName;
        _ssmClient = ssmClient;
        _apiGatewayClient = apiGatewayClient;
    }

    public async Task<string> RetrieveApiKeyAsync()
    {
        string apiKeyId = string.Empty;
        try
        {
            apiKeyId = await GetApiKeyIdFromParameterStore();
            var apiKey = await GetApiKeyFromApiGateway(apiKeyId);
            return apiKey;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving API Key (id: {apiKeyId}): {ex.Message}");
            throw;
        }
    }

    private async Task<string> GetApiKeyIdFromParameterStore()
    {
        var request = new GetParameterRequest { Name = _parameterStoreName, WithDecryption = false };

        var response = await _ssmClient.GetParameterAsync(request);
        return response.Parameter.Value;
    }

    private async Task<string> GetApiKeyFromApiGateway(string apiKeyId)
    {
        var request = new GetApiKeyRequest { ApiKey = apiKeyId, IncludeValue = true };

        var response = await _apiGatewayClient.GetApiKeyAsync(request);
        return response.Value;
    }
}
