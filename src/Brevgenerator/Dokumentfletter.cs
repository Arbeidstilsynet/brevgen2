using Amazon.Lambda.Core;
using Aspose.Words;
using Aspose.Words.Drawing;
using Aspose.Words.Fonts;
using QRCoder;

namespace Brevgenerator;

public class Dokumentfletter
{
    private readonly MemoryStream _dokumentmal;
    private readonly List<string> _flettefeltIDokument;
    private readonly FontSettings _fontSettings;

    public Dokumentfletter(FontSettings fontSettings, Stream dokumentmal)
    {
        _dokumentmal = new MemoryStream();
        dokumentmal.CopyTo(_dokumentmal);

        LambdaLogger.Log($"Setter Aspose word lisens");
        AsposeWordsLisensAdmin.SettAsposeWordLisens();

        _fontSettings = fontSettings;
        _flettefeltIDokument = FinnFlettefeltIDokument().ToList();
    }

    public string LagPdfDokument(Dictionary<string, string> flettedata, QrCodeDTO? qrCodeDTO)
    {
        var fletteDokument = new Document(_dokumentmal);

        LambdaLogger.Log($"Start LagPdfDokument()");
        var flettDokumentStream = FlettDokumentTilStream(flettedata, qrCodeDTO);
        LambdaLogger.Log($"Dokument flettet til Stream");

        if (AsposeWordsLisensAdmin.PdfDocumentErLisensiert(fletteDokument))
        {
            return LagBase64EncodetString(flettDokumentStream);
        }

        //Forsøker å sette lisens på nytt
        SettAsposelisens();

        flettDokumentStream = FlettDokumentTilStream(flettedata, qrCodeDTO);
        if (!AsposeWordsLisensAdmin.PdfDocumentErLisensiert(fletteDokument))
        {
            throw new ArgumentException("Dokument har 'Evaluation Only' tekst selv om Aspose.Words lisens er satt.");
        }

        return LagBase64EncodetString(flettDokumentStream);
    }

    private MemoryStream FlettDokumentTilStream(Dictionary<string, string> flettedata, QrCodeDTO? qrCodeDTO)
    {
        var fletteDokument = new Document(_dokumentmal);

        if (!string.IsNullOrEmpty(qrCodeDTO?.Lenke))
        {
            var qrKode = LagQrKodeBitmap(qrCodeDTO.Lenke);
            var styling = qrCodeDTO.Styling ?? new();
            LeggInnQrKode(fletteDokument, qrKode, styling);
        }
        var dataelementer = HentDataelementerFraJson(_flettefeltIDokument, flettedata);

        var flettetDokument = FlettDokument(fletteDokument, _flettefeltIDokument, dataelementer);
        return flettetDokument;
    }

    private static object[] HentDataelementerFraJson(List<string> flettefelt, Dictionary<string, string> flettedata)
    {
        var manglendeFlettedata = flettefelt.Where(f => !flettedata.ContainsKey(f));
        if (manglendeFlettedata.Any())
        {
            throw new ArgumentException($"Flettedata mangler følgende flettefelt: {string.Join(",", manglendeFlettedata)}");
        }
        return flettefelt.Select(f => (object)flettedata[f]).ToArray();
    }

    private static void LeggInnQrKode(Document fletteDokument, byte[] qrKode, QrCodeStyling styling)
    {
        var builder = new DocumentBuilder(fletteDokument);
        var p = builder.InsertImage(qrKode,
               RelativeHorizontalPosition.Margin,
               styling!.XPos,
               RelativeVerticalPosition.Margin,
               styling.YPos,
               styling.Bredde,
               styling.Lengde,
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
        var fletteDokument = new Document(_dokumentmal);
        return fletteDokument.MailMerge.GetFieldNames();
    }

    private MemoryStream FlettDokument(Document fletteDokument, List<string> flettefelt, object[] dataelementer)
    {
        fletteDokument.FontSettings = _fontSettings;
        fletteDokument.MailMerge.Execute(flettefelt.ToArray(), dataelementer);

        var outStream = new MemoryStream();
        fletteDokument.Save(outStream, SaveFormat.Pdf);

        return outStream;
    }

    private static void SettAsposelisens()
    {
        if (!AsposeWordsLisensAdmin.ErLisensSatt())
        {
            AsposeWordsLisensAdmin.SettAsposeWordLisens();
            if (!AsposeWordsLisensAdmin.ErLisensSatt())
            {
                throw new ArgumentException("Fikk ikke satt Aspose.Words lisens.");
            }
        }
    }

    public static byte[] LagQrKodeBitmap(string url)
    {
        using QRCodeGenerator qrGenerator = new();
        using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using BitmapByteQRCode qrCode = new(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}

public record FlettedataFelt(string Navn, string Verdi);
