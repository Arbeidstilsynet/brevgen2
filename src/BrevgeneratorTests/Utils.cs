using QRCoder;

namespace BrevgeneratorTests;

public class Utils
{
    public static byte[] LagQrKodeBitmap(string url)
    {
        using QRCodeGenerator qrGenerator = new();
        using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using BitmapByteQRCode qrCode = new(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}
