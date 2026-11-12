using System.Text.Json.Serialization;

namespace Arbeidstilsynet.Brevgenerator.Client.Models;

/// <summary>
/// Språkvalg for templates. Påvirker noen linjer tekst i letterhead og signatur.
/// </summary>
public enum Language
{
    [JsonStringEnumMemberName("bm")]
    Bokmål,

    [JsonStringEnumMemberName("nn")]
    Nynorsk,
}
