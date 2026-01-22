using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace AT.Brevgenerator.Klient.Model;

/// <summary>
/// Flettefelter og valg for direktorat template
/// </summary>
public class DirektoratTemplateArgs
{
    [JsonPropertyName("language")]
    public Language Language { get; set; }

    [JsonPropertyName("signatureVariant")]
    public DirektoratTemplateSignatureVariant SignatureVariant { get; set; }

    /// <summary>
    /// Enkel, valgfri liste med fritekstlinjer for signatur(er) i format navn+tittel eller annet.
    /// Dette brukes kun når SignatureVariant.ElektroniskGodkjent er valgt.
    /// </summary>
    [JsonPropertyName("signatureLines")]
    public List<string>? SignatureLines { get; set; }

    [JsonPropertyName("fields")]
    public DirektoratTemplateFields Fields { get; set; }

    public DirektoratTemplateArgs(
        Language language,
        DirektoratTemplateSignatureVariant signatureVariant,
        DirektoratTemplateFields fields,
        List<string>? signatureLines = null
    )
    {
        Language = language;
        SignatureVariant = signatureVariant;
        Fields = fields;
        SignatureLines = signatureLines;
    }
}

/// <summary>
/// Signaturvariant i direktorat template
/// </summary>
public enum DirektoratTemplateSignatureVariant
{
    [EnumMember(Value = "usignert")]
    Usignert,

    [EnumMember(Value = "elektroniskGodkjent")]
    ElektroniskGodkjent,
}

/// <summary>
/// Flettefelter for direktorat template. De er helt separerte fra "MdVariables" som påvirker for selve innholdet i brevet.
/// </summary>
public class DirektoratTemplateFields
{
    /// <summary>
    /// Vår dato. Valgfritt felt.
    /// </summary>
    [JsonPropertyName("dato")]
    public string? Dato { get; init; }

    /// <summary>
    /// Vår referanse. Valgfritt felt.
    /// </summary>
    [JsonPropertyName("saksnummer")]
    public string? Saksnummer { get; init; }

    /// <summary>
    /// Vår saksbehandler. Valgfritt felt.
    /// </summary>
    [JsonPropertyName("saksbehandlerNavn")]
    public string? SaksbehandlerNavn { get; init; }

    /// <summary>
    /// Mottaker-adresse. Valgfritt felt.
    /// </summary>
    [JsonPropertyName("mottaker")]
    public DirektoratMottaker? Mottaker { get; init; }
}

/// <summary>
/// Mottaker-adresse for direktorat template
/// </summary>
public class DirektoratMottaker
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
