using System.Net;
using System.Reflection;
using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Amazon.S3;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace Brevgenerator;

public class Brevgenerator
{
    private static Dokumentfletter? _dokumentfletter;
    private readonly string _brevmalBucket;
    private readonly IAmazonS3 _s3Client;

    private const string DUMMY_FIL = "Brevgenerator.nb-testdokument.docx";

    private static bool _erVarm;

    private static readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public Dictionary<string, string> _headers = new()
    {
        { "Content-type", "application/pdf" },
        { "Access-Control-Allow-Origin", "*" },
        { "Access-Control-Allow-Methods", "OPTIONS,POST,GET" }
    };


    public Brevgenerator(string brevmalBucket, IAmazonS3 s3client)
    {
        _brevmalBucket = brevmalBucket;
        _s3Client = s3client;

        if (!_erVarm)
        {
            var file = Assembly.GetExecutingAssembly().GetManifestResourceStream(DUMMY_FIL);

            if (file is null)
            {
                throw new Exception("Kunne ikke hente dummy-filen");
            }

            _dokumentfletter = new Dokumentfletter(s3client, brevmalBucket, file);
            _dokumentfletter.LagPdfDokument(@"{}").Wait();
            _erVarm = true;
        }
    }

    public Brevgenerator() : this(
        Environment.GetEnvironmentVariable("Brevmalbucket")!,
        new AmazonS3Client()
    )
    { }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        context.Logger.Log($"Input: {JsonSerializer.Serialize(request)}");
        (var workerRequest, var errorMessage) = BadRequest(request);
        if (errorMessage != null)
        {
            return new APIGatewayProxyResponse()
            {
                Body = errorMessage,
                StatusCode = (int)HttpStatusCode.BadRequest
            };
        }
        try
        {
            var file = await _s3Client.GetObjectAsync(_brevmalBucket, workerRequest!.Brevmal);

            _dokumentfletter = new Dokumentfletter(_s3Client, _brevmalBucket, file.ResponseStream);

            var flettedata = Flettedata.FlettedataToDictString(workerRequest.Flettedata);

            if (workerRequest.Qrkode != null)
            {
                _dokumentfletter.QrKodeStyling = workerRequest.Qrkode.Styling ?? new();
                var base64stringMedQr = await _dokumentfletter.LagPdfDokument(flettedata, workerRequest.Qrkode);

                return new APIGatewayProxyResponse()
                {
                    StatusCode = (int)HttpStatusCode.OK,
                    Body = base64stringMedQr,
                    Headers = _headers
                };
            }

            var base64string = await _dokumentfletter.LagPdfDokument(flettedata);

            return new APIGatewayProxyResponse()
            {
                StatusCode = (int)HttpStatusCode.OK,
                Body = base64string,
                Headers = _headers
            };
        }
        catch (Exception ex)
        {
            context.Logger.Log($"Feilet: {ex.Message} og stacktrace: {ex.StackTrace}");
            return new APIGatewayProxyResponse()
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Body = ex.Message,
            };
        }
    }

    private static (WorkerRequest? workerRequest, string? errorMessage) BadRequest(APIGatewayProxyRequest request)
    {
        WorkerRequest deserRequest;
        try
        {
            deserRequest = JsonSerializer.Deserialize<WorkerRequest>(request.Body, _serializerOptions)!;
        }
        catch (Exception ex)
        {
            return (null, $"Kunne ikke deserialisere body, feil melding: {ex.Message}");
        }

        if (deserRequest.Brevmal == null)
        {
            return (null, "Fikk ikke 'brevmal' i body");
        }

        if (deserRequest.Qrkode != null && (deserRequest.Qrkode.Lenke == null || deserRequest.Qrkode.Lenke == string.Empty))
        {
            return (null, "Trenger enten en lenke for å kunne lage qr kode");
        }

        return (deserRequest, null);
    }

}

public record WorkerRequest(string Brevmal, List<FlettedataFelt>? Flettedata, QrCodeDTO? Qrkode);

public record QrCodeDTO(string? Lenke, QrCodeStyling Styling);

public record QrCodeStyling(int Bredde = 0, int Lengde = 0, int XPos = 0, int YPos = 0);
