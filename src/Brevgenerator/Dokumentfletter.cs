using System.Text.Json;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using Aspose.Words;
using Aspose.Words.Drawing;
using Aspose.Words.Fonts;
using QRCoder;

namespace Brevgenerator;

public class Dokumentfletter
{
    private const string FONTSFOLDER = "fonts";
    private JsonDocument _fletteData;
    private Document _fletteDokument;
    private readonly MemoryStream _dokumentmal;
    private readonly IAmazonS3 _s3Client;
    private readonly string _dokumentmalBucket;
    public QrCodeStyling? QrKodeStyling { get; set; }

    public Dokumentfletter(IAmazonS3 s3Client, string dokumentmalBucket, Stream dokumentmal)
    {
        _s3Client = s3Client;
        _dokumentmalBucket = dokumentmalBucket;
        _dokumentmal = new MemoryStream();
        dokumentmal.CopyTo(_dokumentmal);
        LambdaLogger.Log($"Setter Aspose word lisens");
        AsposeWordsLisensAdmin.SettAsposeWordLisens();
    }

    public async Task<string> LagPdfDokument(string flettedata, QrCodeDTO qrCodeDTO)
    {
        var qrKode = LagQrKodeBitmap(qrCodeDTO.Lenke!);
        return await LagPdfDokument(flettedata, qrKode);
    }

    public async Task<string> LagPdfDokument(string flettedata, byte[]? qrKode = null)
    {
        _fletteData = JsonDocument.Parse(flettedata);

        LambdaLogger.Log($"Start LagPdfDokument()");
        var flettDokumentStream = await FlettDokumentTilStream(qrKode);
        LambdaLogger.Log($"Dokument flettet til Stream");

        if (AsposeWordsLisensAdmin.PdfDocumentErLisensiert(_fletteDokument))
        {
            return LagBase64EncodetString(flettDokumentStream);
        }

        //Forsøker å sette lisens på nytt
        SettAsposelisens();

        flettDokumentStream = await FlettDokumentTilStream(qrKode);
        if (!AsposeWordsLisensAdmin.PdfDocumentErLisensiert(_fletteDokument))
        {
            throw new Exception("Dokument har 'Evaluation Only' tekst selv om Aspose.Words lisens er satt.");
        }

        return LagBase64EncodetString(flettDokumentStream);
    }

    private async Task<MemoryStream> FlettDokumentTilStream(byte[]? qrKode)
    {
        _fletteDokument = new Document(_dokumentmal);
        if (qrKode != null && qrKode.Length > 0)
        {
            LeggInnQrKode(qrKode);
        }
        var flettefelt = FinnFlettefeltIDokument();
        var dataelementer = HentDataelementerFraJson(flettefelt);

        return await FlettDokument(flettefelt, dataelementer);
    }

    private void LeggInnQrKode(byte[] qrKode)
    {
        var builder = new DocumentBuilder(_fletteDokument);
        var p = builder.InsertImage(qrKode,
               RelativeHorizontalPosition.Margin,
               QrKodeStyling.XPos,
               RelativeVerticalPosition.Margin,
               QrKodeStyling.YPos,
               QrKodeStyling.Bredde,
               QrKodeStyling.Lengde,
               WrapType.Square);
        p.ZOrder = 4;
    }

    private static string LagBase64EncodetString(MemoryStream filStrøm)
    {
        var array = filStrøm.ToArray();
        return Convert.ToBase64String(array);
    }

    private string[] FinnFlettefeltIDokument()
    {
        return _fletteDokument.MailMerge.GetFieldNames();
    }

    private object[] HentDataelementerFraJson(string[] flettefelt)
    {
        var ser = JsonSerializer.Serialize(_fletteData);
        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(ser);
        LambdaLogger.Log($"Feltene som trenger data: {JsonSerializer.Serialize(flettefelt)}, skal populeres med {JsonSerializer.Serialize(dict.Keys)}"); return flettefelt.Select(f => _fletteData.RootElement.GetProperty(f).ToString()).ToArray<object>();
    }

    private async Task<MemoryStream> FlettDokument(string[] flettefelt, object[] dataelementer)
    {
        _fletteDokument.FontSettings = await GetFontSettings();
        _fletteDokument.MailMerge.Execute(flettefelt, dataelementer);

        var outStream = new MemoryStream();
        _fletteDokument.Save(outStream, SaveFormat.Pdf);

        return outStream;
    }

    private static void SettAsposelisens()
    {
        if (!AsposeWordsLisensAdmin.ErLisensSatt())
        {
            AsposeWordsLisensAdmin.SettAsposeWordLisens();
            if (!AsposeWordsLisensAdmin.ErLisensSatt())
            {
                throw new Exception("Fikk ikke satt Aspose.Words lisens.");
            }
        }
    }

    private async Task<FontSettings> GetFontSettings()
    {
        var fontSettings = new FontSettings();
        FontSourceBase[] fs = await GetS3FontSources(_s3Client, _dokumentmalBucket, FONTSFOLDER);
        fontSettings.SetFontsSources(fs);
        return fontSettings;
    }

    public static async Task<S3FontSource[]> GetS3FontSources(IAmazonS3 client, string dokumentmalBucket, string fontsFolder)
    {
        var request = new ListObjectsV2Request()
        {
            BucketName = dokumentmalBucket,
            Prefix = fontsFolder
        };

        var fontList = new List<S3FontSource>();
        ListObjectsV2Response response;
        do
        {
            response = await client.ListObjectsV2Async(request);

            foreach (var entry in response.S3Objects)
            {
                if (entry.Key.EndsWith("/"))
                {
                    continue;
                }

                fontList.Add(new S3FontSource(client, dokumentmalBucket, entry.Key));
            }

            request.ContinuationToken = response.NextContinuationToken;
        } while (response.IsTruncated);

        return fontList.ToArray();
    }

    public static byte[] LagQrKodeBitmap(string url)
    {
        using QRCodeGenerator qrGenerator = new();
        using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using BitmapByteQRCode qrCode = new(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}
