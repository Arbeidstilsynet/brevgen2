using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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

public abstract class AsyncTest : IAsyncLifetime
{
    public virtual Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    public async Task InitializeAsync()
    {
        await Init();
    }

    public abstract Task Init();
}
