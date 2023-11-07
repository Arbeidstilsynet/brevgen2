using System.Net;
using System.Reflection;
using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Amazon.S3;
using Amazon.S3.Model;
using Aspose.Words.Fonts;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace Brevgenerator;

public class Brevgenerator
{
    private const string FONTSFOLDER = "fonts";
    private const string DUMMY_FIL = "Brevgenerator.nb-testdokument.docx";

    private static readonly Dictionary<
        string,
        (Dokumentfletter Dokumentfletter, DateTime LastModified)
    > _dokumentflettere = new();
    private readonly string _brevmalBucket;
    private readonly IAmazonS3 _s3Client;
    private readonly FontSettings _fontSettings;

    private static readonly JsonSerializerOptions _serializerOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, };

    private readonly Dictionary<string, string> _headers =
        new()
        {
            { "Content-type", "application/pdf" },
            { "Access-Control-Allow-Origin", "*" },
            { "Access-Control-Allow-Methods", "OPTIONS,POST,GET" }
        };

    public Brevgenerator()
        : this(Environment.GetEnvironmentVariable("Brevmalbucket")!, new AmazonS3Client()) { }

    public Brevgenerator(string brevmalBucket, IAmazonS3 s3client)
    {
        _brevmalBucket = brevmalBucket;
        _s3Client = s3client;

        LambdaLogger.Log($"Henter fonter");
        _fontSettings = Task.Run(() => GetFontSettings()).Result;

        LambdaLogger.Log($"Lager dummy dokumentfletter");
        var file =
            Assembly.GetExecutingAssembly().GetManifestResourceStream(DUMMY_FIL)
            ?? throw new ArgumentException($"Kunne ikke hente dummy-fil {DUMMY_FIL}");
        var dokumentfletter = new Dokumentfletter(_fontSettings, file);
        dokumentfletter.LagPdfDokument(new(), null);

        LambdaLogger.Log($"Dummy dokumentfletter ferdig");
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        LambdaLogger.Log($"Input: {JsonSerializer.Serialize(request)}");
        (var ok, var errorMessage) = BadRequest(request);

        if (!ok)
        {
            return ReturnerFeil(errorMessage);
        }

        if (request.Path.Contains("varmopp"))
        {
            var varmOppRequest = JsonSerializer.Deserialize<VarmOppRequest>(request.Body, _serializerOptions)!;
            await HentBrevmal(varmOppRequest.Brevmal);
            return ReturnerOK($"Brevmal {varmOppRequest.Brevmal} initialiser");
        }
        else
        {
            var workerRequest = JsonSerializer.Deserialize<WorkerRequest>(request.Body, _serializerOptions)!;
            var dokumentfletter = await HentBrevmal(workerRequest.Brevmal);

            LambdaLogger.Log(
                $"Genererer dokument '{workerRequest.Brevmal}'. Flettedata: '{string.Join("; ", workerRequest.Flettedata?.Select(f => $"Navn: {f.Navn}, Verdi: '{f.Verdi}'") ?? new List<string>())}' "
            );
            var flettedataDict = LagFlettedataDictionary(workerRequest.Flettedata);
            var base64stringMedQr = dokumentfletter.LagPdfDokument(flettedataDict, workerRequest.Qrkode);

            return ReturnerOK(base64stringMedQr);
        }
    }

    private async Task<Dokumentfletter> HentBrevmal(string brevmal)
    {
        var file = await _s3Client.GetObjectAsync(_brevmalBucket, brevmal);

        if (!_dokumentflettere.ContainsKey(brevmal))
        {
            LambdaLogger.Log($"Brevmal var ikke cached, lager dokumentfletter for {brevmal}");
            LagDokumentfletter(brevmal, file);
        }
        else
        {
            if (_dokumentflettere[brevmal].LastModified < file.LastModified)
            {
                LambdaLogger.Log($"Cache var utdatert, lager dokumentfletter for {brevmal}");
                LagDokumentfletter(brevmal, file);
            }
            else
            {
                LambdaLogger.Log($"Cache hit dokumentfletter for {brevmal}");
            }
        }

        return _dokumentflettere[brevmal].Dokumentfletter;
    }

    private void LagDokumentfletter(string brevmal, GetObjectResponse file)
    {
        var dokfletter = new Dokumentfletter(_fontSettings, file.ResponseStream);
        _dokumentflettere.Add(brevmal, (dokfletter, DateTime.UtcNow));

        LambdaLogger.Log($"Dokumentfletter for {brevmal} ferdig");
    }

    private APIGatewayProxyResponse ReturnerOK(string base64string)
    {
        LambdaLogger.Log($"Returnerer OK");
        return new APIGatewayProxyResponse()
        {
            StatusCode = (int)HttpStatusCode.OK,
            Body = base64string,
            Headers = _headers
        };
    }

    private static APIGatewayProxyResponse ReturnerFeil(string? errorMessage)
    {
        LambdaLogger.Log($"Returnerer feil: {errorMessage}");
        return new APIGatewayProxyResponse() { Body = errorMessage, StatusCode = (int)HttpStatusCode.BadRequest };
    }

    private static (bool, string?) BadRequest(APIGatewayProxyRequest request)
    {
        if (request.Path.Contains("varmopp"))
        {
            VarmOppRequest varmOppRequest;
            try
            {
                varmOppRequest = JsonSerializer.Deserialize<VarmOppRequest>(request.Body, _serializerOptions)!;
            }
            catch (Exception ex)
            {
                return (false, $"Kunne ikke deserialisere body, feil melding: {ex.Message}");
            }

            if (varmOppRequest.Brevmal == null)
            {
                return (false, "Fikk ikke 'brevmal' i body");
            }
        }
        else
        {
            WorkerRequest deserRequest;
            try
            {
                deserRequest = JsonSerializer.Deserialize<WorkerRequest>(request.Body, _serializerOptions)!;
            }
            catch (Exception ex)
            {
                return (false, $"Kunne ikke deserialisere body, feil melding: {ex.Message}");
            }

            if (deserRequest.Brevmal == null)
            {
                return (false, "Fikk ikke 'brevmal' i body");
            }

            if (deserRequest.Qrkode != null && string.IsNullOrEmpty(deserRequest.Qrkode.Lenke))
            {
                return (false, "Trenger en lenke for å kunne lage qr kode");
            }
        }

        return (true, null);
    }

    private async Task<FontSettings> GetFontSettings()
    {
        var fontSettings = new FontSettings();
        FontSourceBase[] fs = await GetS3FontSources(_s3Client, _brevmalBucket, FONTSFOLDER);
        fontSettings.SetFontsSources(fs);
        return fontSettings;
    }

    public static async Task<S3FontSource[]> GetS3FontSources(
        IAmazonS3 client,
        string dokumentmalBucket,
        string fontsFolder
    )
    {
        var request = new ListObjectsV2Request() { BucketName = dokumentmalBucket, Prefix = fontsFolder };

        var fontList = new List<S3FontSource>();
        ListObjectsV2Response response;
        do
        {
            response = await client.ListObjectsV2Async(request);

            foreach (var key in response.S3Objects.Select(entry => entry.Key))
            {
                if (key.EndsWith('/'))
                {
                    continue;
                }

                fontList.Add(new S3FontSource(client, dokumentmalBucket, key));
            }

            request.ContinuationToken = response.NextContinuationToken;
        } while (response.IsTruncated);

        return fontList.ToArray();
    }

    public static Dictionary<string, string> LagFlettedataDictionary(List<FlettedataFelt>? flettedata)
    {
        return flettedata?.ToDictionary(f => f.Navn, f => f.Verdi) ?? new();
    }
}

public record WorkerRequest(string Brevmal, List<FlettedataFelt>? Flettedata, QrCodeDto? Qrkode);

public record VarmOppRequest(string Brevmal);

public record QrCodeDto(string? Lenke, QrCodeStyling Styling);

public record QrCodeStyling(int Bredde = 0, int Lengde = 0, int XPos = 0, int YPos = 0);
