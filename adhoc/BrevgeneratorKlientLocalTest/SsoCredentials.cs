using System.Diagnostics;
using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;

namespace BrevgeneratorClientCli;

public static class SsoCredentials
{
    public static AWSCredentials Load(string profile)
    {
        var chain = new CredentialProfileStoreChain();
        if (!chain.TryGetAWSCredentials(profile, out var credentials))
        {
            throw new Exception($"Failed to find the {profile} profile");
        }

        var ssoCredentials =
            credentials as SSOAWSCredentials ?? throw new Exception("Klarte ikke å hente SSO credentials");

        ssoCredentials.Options.ClientName = "brevgen2-adhoc-SSO-app";
        ssoCredentials.Options.SsoVerificationCallback = args =>
        {
            // Hvis du ikke er innlogget:
            // Åpner nettleser og ber om å logge inn med SSO, og godkjenne denne appen
            Process.Start(new ProcessStartInfo { FileName = args.VerificationUriComplete, UseShellExecute = true });
        };

        return ssoCredentials;
    }
}
