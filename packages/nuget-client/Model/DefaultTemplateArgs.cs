using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace AT.Brevgenerator.Klient.Model;

/// <summary>
/// Flettefelter og valg for default template
/// </summary>
public class DefaultTemplateArgs
{
    [JsonPropertyName("language")]
    public Language Language { get; set; }

    [JsonPropertyName("fields")]
    public DefaultTemplateFields Fields { get; set; }

    [JsonPropertyName("signatureVariant")]
    public SignatureVariant SignatureVariant { get; set; }

    public DefaultTemplateArgs(Language language, SignatureVariant signatureVariant, DefaultTemplateFields fields)
    {
        Language = language;
        Fields = fields;
        SignatureVariant = signatureVariant;
    }
}

/// <summary>
/// Språkvalg for default template. Påvirker noen linjer tekst i letterhead og signatur.
/// </summary>
public enum Language
{
    [EnumMember(Value = "bm")]
    Bokmål,

    [EnumMember(Value = "nn")]
    Nynorsk
}

/// <summary>
/// Siganturvariant i default template
/// </summary>
public enum SignatureVariant
{
    [EnumMember(Value = "elektroniskGodkjent")]
    ElektroniskGodkjent,

    [EnumMember(Value = "automatiskBehandlet")]
    AutomatiskBehandlet,

    [EnumMember(Value = "usignert")]
    Usignert
}

/// <summary>
/// Flettefelter for default template. De er helt separerte fra "MdVariables" som påvirker for selve innholdet i brevet.
/// </summary>
public class DefaultTemplateFields
{
    /// <summary>
    /// "Obligatorisk" felt. Med manglende verdi vises fortsatt feltnavn i letterhead.
    /// </summary>
    [JsonPropertyName("dato")]
    public required string Dato { get; init; }

    /// <summary>
    /// "Obligatorisk" felt. Med manglende verdi vises fortsatt feltnavn i letterhead.
    /// </summary>
    [JsonPropertyName("saksnummer")]
    public required string Saksnummer { get; init; }

    /// <summary>
    /// Valgfritt felt. Manglende verdi gjør at feltet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("tidligereReferanse")]
    public string? TidligereReferanse { get; init; }

    /// <summary>
    /// Valgfritt felt. Manglende verdi gjør at feltet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("deresDato")]
    public string? DeresDato { get; init; }

    /// <summary>
    /// Valgfritt felt. Manglende verdi gjør at feltet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("deresReferanse")]
    public string? DeresReferanse { get; init; }

    /// <summary>
    /// "Obligatorisk" felt. Med manglende verdi vises fortsatt feltnavn i letterhead.
    /// </summary>
    [JsonPropertyName("saksbehandlerNavn")]
    public required string SaksbehandlerNavn { get; init; }

    /// <summary>
    /// Valgfritt felt. Må også sette UnntattOffentlighetHjemmel. False eller null gjør at tekst om unntatt offentlighet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("erUnntattOffentlighet")]
    public bool? ErUnntattOffentlighet { get; init; }

    /// <summary>
    /// Må settes når "erUnntattOffentlighet" er true. Settes etter "Unntatt offentlighet, " i letterhead. Eksempelvis "jf. offl. § 14".
    /// </summary>
    [JsonPropertyName("unntattOffentlighetHjemmel")]
    public string? UnntattOffentlighetHjemmel { get; init; }

    /// <summary>
    /// Adresse for virksomhet. Vises nedenfor og til venstre for de andre feltene.
    /// </summary>
    [JsonPropertyName("virksomhet")]
    public required Virksomhet Virksomhet { get; init; }
}

/// <summary>
/// Flettefelter for virksomhet i default template
/// </summary>
public class Virksomhet
{
    [JsonPropertyName("navn")]
    public required string Navn { get; init; }

    [JsonPropertyName("adresse")]
    public required string Adresse { get; init; }

    [JsonPropertyName("postnr")]
    public required string Postnr { get; init; }

    [JsonPropertyName("poststed")]
    public required string Poststed { get; init; }
}
