using System.Text.Json.Serialization;

namespace Arbeidstilsynet.Brevgenerator.Client.Models;

public enum PaperFormat
{
    [JsonStringEnumMemberName("letter")]
    Letter,

    [JsonStringEnumMemberName("legal")]
    Legal,

    [JsonStringEnumMemberName("tabloid")]
    Tabloid,

    [JsonStringEnumMemberName("ledger")]
    Ledger,

    [JsonStringEnumMemberName("a0")]
    A0,

    [JsonStringEnumMemberName("a1")]
    A1,

    [JsonStringEnumMemberName("a2")]
    A2,

    [JsonStringEnumMemberName("a3")]
    A3,

    [JsonStringEnumMemberName("a4")]
    A4,

    [JsonStringEnumMemberName("a5")]
    A5,

    [JsonStringEnumMemberName("a6")]
    A6,
}

public class PDFMargin
{
    [JsonPropertyName("top")]
    public string? Top { get; set; }

    [JsonPropertyName("bottom")]
    public string? Bottom { get; set; }

    [JsonPropertyName("left")]
    public string? Left { get; set; }

    [JsonPropertyName("right")]
    public string? Right { get; set; }
}

public class PuppeteerPDFOptions
{
    /// <summary>
    /// Scales the rendering of the web page. Amount must be between `0.1` and `2`.
    /// Default: `1`
    /// </summary>
    [JsonPropertyName("scale")]
    public double? Scale { get; set; }

    /// <summary>
    /// Whether to show the header and footer. Default: `false`
    /// </summary>
    [JsonPropertyName("displayHeaderFooter")]
    public bool? DisplayHeaderFooter { get; set; }

    /// <summary>
    /// HTML template for the print header. Should be valid HTML.
    /// </summary>
    [JsonPropertyName("headerTemplate")]
    public string? HeaderTemplate { get; set; }

    /// <summary>
    /// HTML template for the print footer. Same constraints as HeaderTemplate.
    /// </summary>
    [JsonPropertyName("footerTemplate")]
    public string? FooterTemplate { get; set; }

    /// <summary>
    /// Set to `true` to print background graphics. Default: `false`
    /// </summary>
    [JsonPropertyName("printBackground")]
    public bool? PrintBackground { get; set; }

    /// <summary>
    /// Whether to print in landscape orientation. Default: `false`
    /// </summary>
    [JsonPropertyName("landscape")]
    public bool? Landscape { get; set; }

    /// <summary>
    /// Paper ranges to print, e.g., `1-5, 8, 11-13`.
    /// Default: Empty string, which means all pages are printed.
    /// </summary>
    [JsonPropertyName("pageRanges")]
    public string? PageRanges { get; set; }

    /// <summary>
    /// If set, this takes priority over the width and height options.
    /// Default: `letter`.
    /// </summary>
    [JsonPropertyName("format")]
    public PaperFormat? Format { get; set; }

    /// <summary>
    /// Sets the width of paper. Can be a number or a string? with a unit.
    /// </summary>
    [JsonPropertyName("width")]
    public object? Width { get; set; } // Can be string? or number

    /// <summary>
    /// Sets the height of paper. Can be a number or a string? with a unit.
    /// </summary>
    [JsonPropertyName("height")]
    public object? Height { get; set; } // Can be string? or number

    /// <summary>
    /// Give any CSS `@page` size declared in the page priority over width/height/format.
    /// Default: `false`.
    /// </summary>
    [JsonPropertyName("preferCSSPageSize")]
    public bool? PreferCSSPageSize { get; set; }

    /// <summary>
    /// Set the PDF margins. Default: `undefined`.
    /// </summary>
    [JsonPropertyName("margin")]
    public PDFMargin? Margin { get; set; }

    /// <summary>
    /// Hides default white background and allows generating PDFs with transparency. Default: `false`.
    /// </summary>
    [JsonPropertyName("omitBackground")]
    public bool? OmitBackground { get; set; }

    /// <summary>
    /// Generate tagged (accessible) PDF. Default: `true`.
    /// </summary>
    [JsonPropertyName("tagged")]
    public bool? Tagged { get; set; }

    /// <summary>
    /// Generate document outline. Default: `false`.
    /// </summary>
    [JsonPropertyName("outline")]
    public bool? Outline { get; set; }
}
