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
    public DefaultTemplateFields Fields { get; set; } = new();

    [JsonPropertyName("signatureVariant")]
    public SignatureVariant SignatureVariant { get; set; }

    public DefaultTemplateArgs() { }

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
    public string Dato { get; set; } = string.Empty;

    /// <summary>
    /// "Obligatorisk" felt. Med manglende verdi vises fortsatt feltnavn i letterhead.
    /// </summary>
    [JsonPropertyName("saksnummer")]
    public string Saksnummer { get; set; } = string.Empty;

    /// <summary>
    /// Valgfritt felt. Manglende verdi gjør at feltet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("deresDato")]
    public string? DeresDato { get; set; } = string.Empty;

    /// <summary>
    /// Valgfritt felt. Manglende verdi gjør at feltet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("deresReferanse")]
    public string? DeresReferanse { get; set; } = string.Empty;

    /// <summary>
    /// "Obligatorisk" felt. Med manglende verdi vises fortsatt feltnavn i letterhead.
    /// </summary>
    [JsonPropertyName("saksbehandlerNavn")]
    public string SaksbehandlerNavn { get; set; } = string.Empty;

    /// <summary>
    /// Valgfritt felt. False eller null gjør at tekst om unntatt offentlighet ikke vises i letterhead.
    /// </summary>
    [JsonPropertyName("erUnntattOffentlighet")]
    public bool? ErUnntattOffentlighet { get; set; } = false;

    /// <summary>
    /// Adresse for virksomhet. Vises nedenfor og til venstre for de andre feltene.
    /// </summary>
    [JsonPropertyName("virksomhet")]
    public Virksomhet Virksomhet { get; set; } = new();
}

/// <summary>
/// Flettefelter for virksomhet i default template
/// </summary>
public class Virksomhet
{
    [JsonPropertyName("navn")]
    public string Navn { get; set; } = string.Empty;

    [JsonPropertyName("adresse")]
    public string Adresse { get; set; } = string.Empty;

    [JsonPropertyName("postnr")]
    public string Postnr { get; set; } = string.Empty;

    [JsonPropertyName("poststed")]
    public string Poststed { get; set; } = string.Empty;
}
