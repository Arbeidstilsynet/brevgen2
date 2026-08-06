namespace Arbeidstilsynet.Brevgenerator.Client.Tests.Fixture;

internal sealed record RecordedRequest(HttpMethod Method, Uri? RequestUri, string? Authorization, string Body);

/// <summary>
/// Fake <see cref="HttpMessageHandler"/> that records every attempt and replays a scripted sequence of responses.
/// The last scripted response is reused once the script is exhausted.
/// </summary>
internal sealed class FakeHttpMessageHandler(params Func<HttpResponseMessage>[] responses) : HttpMessageHandler
{
    private readonly List<RecordedRequest> _requests = [];
    private readonly List<object> _requestInstances = [];
    private readonly List<object> _contentInstances = [];

    internal IReadOnlyList<RecordedRequest> Requests => _requests;

    internal IReadOnlyList<object> RequestInstances => _requestInstances;

    internal IReadOnlyList<object> ContentInstances => _contentInstances;

    /// <summary>
    /// Optional hook invoked after the request has been recorded but before the response is produced.
    /// </summary>
    internal Func<CancellationToken, Task>? OnSend { get; set; }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken
    )
    {
        cancellationToken.ThrowIfCancellationRequested();

        var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);

        _requests.Add(
            new RecordedRequest(request.Method, request.RequestUri, request.Headers.Authorization?.ToString(), body)
        );
        _requestInstances.Add(request);
        if (request.Content is not null)
        {
            _contentInstances.Add(request.Content);
        }

        if (OnSend is not null)
        {
            await OnSend(cancellationToken);
        }

        var index = Math.Min(_requests.Count - 1, responses.Length - 1);
        return responses[index]();
    }
}
