using System.Net;
using System.Net.Sockets;
using System.Text;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

internal sealed record ReceivedRequest(
    string Method,
    string? Path,
    string? Authorization,
    string? ContentType,
    string Body
);

/// <summary>
/// Minimal loopback HTTP server that records the last request and replies with a configurable response.
/// Used instead of a mock-server package so client tests go through the real HTTP stack.
/// </summary>
internal sealed class LoopbackHttpServer : IDisposable
{
    private readonly HttpListener _listener = new();
    private ReceivedRequest? _lastRequest;
    private (HttpStatusCode Status, string Body) _response = (HttpStatusCode.OK, string.Empty);

    public LoopbackHttpServer()
    {
        Url = $"http://localhost:{GetFreePort()}/";
        _listener.Prefixes.Add(Url);
        _listener.Start();
        _ = Task.Run(AcceptLoopAsync);
    }

    public string Url { get; }

    public ReceivedRequest? LastRequest => Volatile.Read(ref _lastRequest);

    public void RespondWith(HttpStatusCode status, string body)
    {
        _response = (status, body);
        Volatile.Write(ref _lastRequest, null);
    }

    public void Dispose()
    {
        _listener.Close();
    }

    private async Task AcceptLoopAsync()
    {
        while (_listener.IsListening)
        {
            HttpListenerContext context;
            try
            {
                context = await _listener.GetContextAsync();
            }
            catch (Exception e) when (e is HttpListenerException or ObjectDisposedException)
            {
                return;
            }

            using var reader = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding);
            var body = await reader.ReadToEndAsync();
            Volatile.Write(
                ref _lastRequest,
                new ReceivedRequest(
                    context.Request.HttpMethod,
                    context.Request.Url?.AbsolutePath,
                    context.Request.Headers["Authorization"],
                    context.Request.ContentType,
                    body
                )
            );

            var (status, responseBody) = _response;
            context.Response.StatusCode = (int)status;
            await context.Response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes(responseBody));
            context.Response.Close();
        }
    }

    private static int GetFreePort()
    {
        using var socket = new TcpListener(IPAddress.Loopback, 0);
        socket.Start();
        return ((IPEndPoint)socket.LocalEndpoint).Port;
    }
}
