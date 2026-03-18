using System.Runtime.Serialization;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Model;

/// <summary>
/// Språkvalg for templates. Påvirker noen linjer tekst i letterhead og signatur.
/// </summary>
public enum Language
{
    [EnumMember(Value = "bm")]
    Bokmål,

    [EnumMember(Value = "nn")]
    Nynorsk,
}
