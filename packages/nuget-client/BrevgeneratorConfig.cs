using Amazon;

namespace AT.Brevgenerator.Klient;

/// <summary>
/// Konfigurasjon av brevgenerator.
/// </summary>
/// <param name="ApiUrl">URL til Brevgenerator-API</param>
/// <param name="ParameterStoreApiKeyIdName">Parameter i SSM Parameter Store som inneholder ID for API Key</param>
/// <param name="RegionEndpoint">AWS-region</param>
public record BrevgeneratorConfig(string ApiUrl, string ParameterStoreApiKeyIdName, RegionEndpoint RegionEndpoint);
