using System.Runtime.CompilerServices;
using AT.Brevgenerator.Klient.Model;

namespace AT.Brevgenerator.Klient;

public interface IAddMarkdownStep
{
    /// <summary>
    /// Legg til dynamisk markdown og eventuelle variabler (flettefelt).
    /// </summary>
    /// <param name="md">Dynamisk markdown</param>
    /// <param name="mdVariables">
    /// Variabler (flettefelt) som er referert i dynamisk markdown.
    /// Kan være string/number/boolean etter serialisering til JSON.
    /// </param>
    IChooseTemplateStep AddMarkdown(string md, Dictionary<string, object?>? mdVariables);
}

public interface IChooseTemplateStep
{
    /// <summary>
    /// Velg default template. Må legge til argumenter senere med WithDefaultTemplateFields.
    /// </summary>
    IDefaultTemplateFieldsStep WithDefaultTemplate(Language language, SignatureVariant signatureVariant);

    /// <summary>
    /// Velg custom template. Dette har i praksis minimalt med styling og layout.
    /// Du må selv mate inn ønsket konfigurasjon via WithConversionOptions.
    /// <br /><br/>
    /// Mest egnet for testing, ikke til å lage produksjonsdokument.
    /// </summary>
    IBuildStep WithCustomTemplate();

    /// <summary>
    /// Velg blank template. Dette er som et blankt ark, uten header/footer, men med samme styling som default template.
    /// <br />
    /// Du kan legge til egen header/footer osv. med WithConversionOptions
    /// </summary>
    IBuildStep WithBlankTemplate();
}

public interface IDefaultTemplateFieldsStep
{
    /// <summary>
    /// Legg til flettefelt-verdier for default template. Saksnummer, Virksomhetsadresse o.l.
    /// </summary>
    /// <param name="fields"></param>
    IBuildStep WithDefaultTemplateFields(DefaultTemplateFields fields);
}

public interface IBuildStep
{
    /// <summary>
    /// Legg til metadata i generert PDF
    /// </summary>
    /// <param name="documentTitle"></param>
    /// <param name="author"></param>
    IBuildStep WithMetadata(string documentTitle, string author);

    /// <summary>
    /// Sett avanserte parametre for konverteringen. Dette er vanligvis ikke nødvendig.
    /// Den kan overstyre Author og DocumentTitle, men bruk heller AddMetadata for det.
    /// <br/><br/>
    /// Hvis du ønsker HTML i stedet for PDF kan du sette AsHtml=true
    /// </summary>
    /// <param name="config"></param>
    IBuildStep WithConversionOptions(PdfConfig config);

    /// <summary>
    /// Bygg payload for Brevgenerator-API
    /// </summary>
    GenererBrevArgs Build();
}

/// <summary>
/// Builder for payload til Brevgenerator-API
/// </summary>
public class GenererBrevArgsBuilder
{
    private GenererBrevArgsBuilder() { }

    /// <summary>
    /// Initier builder
    /// </summary>
    public static IAddMarkdownStep Create() => new BuilderSteps();
}

internal class BuilderSteps : IAddMarkdownStep, IChooseTemplateStep, IDefaultTemplateFieldsStep, IBuildStep
{
    private const string MissingInitializerErrorMessage = "Should be set by default initializer";
    private readonly GenererBrevArgs args = new();

    /// <inheritdoc/>
    public IChooseTemplateStep AddMarkdown(string md, Dictionary<string, object?>? mdVariables)
    {
        args.Md = md;
        args.MdVariables = mdVariables;
        return this;
    }

    /// <inheritdoc/>
    public IDefaultTemplateFieldsStep WithDefaultTemplate(Language language, SignatureVariant signatureVariant)
    {
        args.Options.Dynamic.Template = TemplateType.Default;
        args.Options.Dynamic.DefaultTemplateArgs!.Language = language;
        args.Options.Dynamic.DefaultTemplateArgs!.SignatureVariant = signatureVariant;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithCustomTemplate()
    {
        args.Options.Dynamic.Template = TemplateType.Custom;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithBlankTemplate()
    {
        args.Options.Dynamic.Template = TemplateType.Blank;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithDefaultTemplateFields(DefaultTemplateFields fields)
    {
        args.Options.Dynamic.DefaultTemplateArgs.ThrowIfNull(MissingInitializerErrorMessage);
        args.Options.Dynamic.DefaultTemplateArgs!.Fields = fields;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithMetadata(string documentTitle, string author)
    {
        args.Options.DocumentTitle = documentTitle;
        args.Options.Author = author;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithConversionOptions(PdfConfig config)
    {
        var mergedOptions = new GeneratePdfOptions(config)
        {
            Dynamic = args.Options.Dynamic,
            Author = args.Options.Author,
            DocumentTitle = args.Options.DocumentTitle
        };
        args.Options = mergedOptions;
        return this;
    }

    /// <inheritdoc/>
    public GenererBrevArgs Build()
    {
        args.Options.Dynamic.DefaultTemplateArgs.ThrowIfNull(MissingInitializerErrorMessage);

        return args;
    }
}

internal static class ThrowHelpers
{
    public static void ThrowIfNull(
        this object? obj,
        string message,
        [CallerArgumentExpression(nameof(obj))] string? callerName = default
    )
    {
        if (obj is null)
        {
            throw new ArgumentException(message, callerName);
        }
    }
}
