using System.Reflection;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace Arbeidstilsynet.Brevgenerator.Client.Models;

/// <summary>
/// Parametre for å opprette brev via brevgenerator2.
/// <br/><br/>
/// Basert på TypeScript-typen HandlerGeneratePdfArgs i felles-brevgenerator/apps/api/lib/handler.ts
/// </summary>
public class GenererBrevArgs
{
    /// <summary>
    /// Dynamisk markdown
    /// </summary>
    [JsonPropertyName("md")]
    public required string Md { get; init; } = string.Empty;

    [JsonPropertyName("mdVariables")]
    public Dictionary<string, object?>? MdVariables { get; set; }

    [JsonPropertyName("options")]
    public required GeneratePdfOptions Options { get; init; } = new();

    public GenererBrevArgs() { }

    public GenererBrevArgs(string md, Dictionary<string, object?>? mdVariables, GeneratePdfOptions options)
    {
        Md = md;
        MdVariables = mdVariables;
        Options = options;
    }
}

/// <summary>
/// All konfigurasjon for konvertering til HTML/PDF
/// </summary>
public class GeneratePdfOptions : PdfConfig
{
    /// <summary>
    /// Konfigurasjon og standard flettefelter for dokumentmaler (templates).
    /// </summary>
    [JsonPropertyName("dynamic")]
    public DynamicMdPdfConfig Dynamic { get; set; } = new();

    public GeneratePdfOptions() { }

    public GeneratePdfOptions(PdfConfig pdfConfig)
    {
        var baseProperties = typeof(PdfConfig).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var property in baseProperties)
        {
            if (property.CanWrite)
            {
                var value = property.GetValue(pdfConfig);
                property.SetValue(this, value);
            }
        }
    }

    public GeneratePdfOptions(DynamicMdPdfConfig dynamic)
    {
        Dynamic = dynamic;
    }
}

public class DynamicMdPdfConfig
{
    /// <summary>
    /// Pick letterhead, footer and styling template
    /// <br />
    /// "default" - standard Arbeidstilsynet SOM template
    /// <br />
    /// "custom" - user controlled, pass in `options.pdf_options` as needed
    /// <br />
    /// "blank" - similar to custom, but retains default styling
    /// </summary>
    [JsonPropertyName("template")]
    public TemplateType Template { get; set; }

    /// <summary>
    /// Required if template is "default"
    /// </summary>
    [JsonPropertyName("defaultTemplateArgs")]
    public DefaultTemplateArgs? DefaultTemplateArgs { get; set; }

    /// <summary>
    /// Required if template is "direktorat"
    /// </summary>
    [JsonPropertyName("direktoratTemplateArgs")]
    public DirektoratTemplateArgs? DirektoratTemplateArgs { get; set; }

    public DynamicMdPdfConfig() { }

    public DynamicMdPdfConfig(TemplateType templateType, DefaultTemplateArgs? defaultTemplateArgs)
    {
        if (templateType == TemplateType.Default && defaultTemplateArgs == null)
        {
            throw new ArgumentException("defaultTemplateArgs are required when using the default template");
        }
        Template = templateType;
        DefaultTemplateArgs = defaultTemplateArgs;
    }
}

public enum TemplateType
{
    [EnumMember(Value = "default")]
    Default,

    [EnumMember(Value = "custom")]
    Custom,

    [EnumMember(Value = "blank")]
    Blank,

    [EnumMember(Value = "direktorat")]
    Direktorat,
}

public class PdfConfig : BasicConfig
{
    /// <summary>
    /// If true, generate HTML output instead of PDF output. Default: false.
    /// </summary>
    [JsonPropertyName("as_html")]
    public bool? AsHtml { get; set; }

    /// <summary>
    /// Author metadata
    /// </summary>
    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;
}

/// <summary>
/// Basert på felles-brevgenerator/apps/api/lib/core/config.ts
/// </summary>
public class BasicConfig
{
    /// <summary>
    /// Custom css styles.
    /// </summary>
    [JsonPropertyName("css")]
    public string? Css { get; set; }

    /// <summary>
    /// Whether to merge the provided CSS with the chosen template's CSS. If false, only the provided CSS will be used.
    /// This is useful if you only want to partially extend the template styles without having to provide a complete set of styles.
    /// Default: false
    /// </summary>
    [JsonPropertyName("merge_css")]
    public bool? MergeCss { get; set; }

    /// <summary>
    /// Name of the HTML Document.
    /// </summary>
    [JsonPropertyName("document_title")]
    public string DocumentTitle { get; set; } = string.Empty;

    /// <summary>
    /// Media type to emulate the page with.
    /// "screen" or "print".
    /// Default: "screen"
    /// </summary>
    [JsonPropertyName("page_media_type")]
    public string? PageMediaType { get; set; }

    /// <summary>
    /// PDF options for Puppeteer.
    /// </summary>
    [JsonPropertyName("pdf_options")]
    public PuppeteerPDFOptions? PdfOptions { get; set; }
}
