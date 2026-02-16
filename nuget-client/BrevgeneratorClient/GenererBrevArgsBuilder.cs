using Arbeidstilsynet.Brevgenerator.Client.Models;

namespace Arbeidstilsynet.Brevgenerator.Client;

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
    IDefaultTemplateFieldsStep WithDefaultTemplate(Language language, DefaultTemplateSignatureVariant signatureVariant);

    /// <summary>
    /// Velg direktorat template. Må legge til argumenter senere med WithDirektoratTemplateFields.
    /// </summary>
    IDirektoratTemplateFieldsStep WithDirektoratTemplate(
        Language language,
        DirektoratTemplateSignatureVariant signatureVariant,
        List<string>? signatureLines = null
    );

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

public interface IDirektoratTemplateFieldsStep
{
    /// <summary>
    /// Legg til flettefelt-verdier for direktorat template. Saksnummer, Mottakeradresse o.l.
    /// </summary>
    /// <param name="fields"></param>
    IBuildStep WithDirektoratTemplateFields(DirektoratTemplateFields fields);
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

internal class BuilderSteps
    : IAddMarkdownStep,
        IChooseTemplateStep,
        IDefaultTemplateFieldsStep,
        IDirektoratTemplateFieldsStep,
        IBuildStep
{
    private string? Md { get; set; }
    private Dictionary<string, object?>? MdVariables { get; set; }
    private GeneratePdfOptions options = new();
    private Language? defaultTemplateLanguage;
    private DefaultTemplateSignatureVariant? defaultTemplateSignatureVariant;
    private Language? direktoratTemplateLanguage;
    private DirektoratTemplateSignatureVariant? direktoratTemplateSignatureVariant;
    private List<string>? direktoratTemplateSignatureLines;

    /// <inheritdoc/>
    public IChooseTemplateStep AddMarkdown(string md, Dictionary<string, object?>? mdVariables)
    {
        Md = md;
        MdVariables = mdVariables;
        return this;
    }

    /// <inheritdoc/>
    public IDefaultTemplateFieldsStep WithDefaultTemplate(
        Language language,
        DefaultTemplateSignatureVariant signatureVariant
    )
    {
        options.Dynamic.Template = TemplateType.Default;
        defaultTemplateLanguage = language;
        defaultTemplateSignatureVariant = signatureVariant;
        return this;
    }

    /// <inheritdoc/>
    public IDirektoratTemplateFieldsStep WithDirektoratTemplate(
        Language language,
        DirektoratTemplateSignatureVariant signatureVariant,
        List<string>? signatureLines = null
    )
    {
        options.Dynamic.Template = TemplateType.Direktorat;
        direktoratTemplateLanguage = language;
        direktoratTemplateSignatureVariant = signatureVariant;
        direktoratTemplateSignatureLines = signatureLines;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithCustomTemplate()
    {
        options.Dynamic.Template = TemplateType.Custom;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithBlankTemplate()
    {
        options.Dynamic.Template = TemplateType.Blank;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithDefaultTemplateFields(DefaultTemplateFields fields)
    {
        if (
            defaultTemplateLanguage is Language language
            && defaultTemplateSignatureVariant is DefaultTemplateSignatureVariant signatureVariant
        )
        {
            options.Dynamic.DefaultTemplateArgs = new(language, signatureVariant, fields);
            return this;
        }

        throw new InvalidOperationException("Must call WithDefaultTemplate before WithDefaultTemplateFields");
    }

    /// <inheritdoc/>
    public IBuildStep WithDirektoratTemplateFields(DirektoratTemplateFields fields)
    {
        if (
            direktoratTemplateLanguage is Language language
            && direktoratTemplateSignatureVariant is DirektoratTemplateSignatureVariant signatureVariant
        )
        {
            options.Dynamic.DirektoratTemplateArgs = new(
                language,
                signatureVariant,
                fields,
                direktoratTemplateSignatureLines
            );
            return this;
        }

        throw new InvalidOperationException("Must call WithDirektoratTemplate before WithDirektoratTemplateFields");
    }

    /// <inheritdoc/>
    public IBuildStep WithMetadata(string documentTitle, string author)
    {
        options.DocumentTitle = documentTitle;
        options.Author = author;
        return this;
    }

    /// <inheritdoc/>
    public IBuildStep WithConversionOptions(PdfConfig config)
    {
        var mergedOptions = new GeneratePdfOptions(config)
        {
            Dynamic = options.Dynamic,
            Author = options.Author,
            DocumentTitle = options.DocumentTitle,
        };
        options = mergedOptions;
        return this;
    }

    /// <inheritdoc/>
    public GenererBrevArgs Build()
    {
        if (options.Dynamic.Template == TemplateType.Default && options.Dynamic.DefaultTemplateArgs is null)
        {
            throw new ArgumentException("DefaultTemplateArgs are required when using the default template");
        }

        if (options.Dynamic.Template == TemplateType.Direktorat && options.Dynamic.DirektoratTemplateArgs is null)
        {
            throw new ArgumentException("DirektoratTemplateArgs are required when using the direktorat template");
        }

        if (
            options.Dynamic.Template == TemplateType.Default
            && options.Dynamic.DefaultTemplateArgs?.Fields.ErUnntattOffentlighet == true
            && string.IsNullOrEmpty(options.Dynamic.DefaultTemplateArgs.Fields.UnntattOffentlighetHjemmel)
        )
        {
            throw new ArgumentException(
                "UnntattOffentlighetHjemmel must be set when ErUnntattOffentlighet is true in DefaultTemplateFields"
            );
        }

        if (
            options.Dynamic.Template == TemplateType.Direktorat
            && options.Dynamic.DirektoratTemplateArgs?.Fields.ErUnntattOffentlighet == true
            && string.IsNullOrEmpty(options.Dynamic.DirektoratTemplateArgs.Fields.UnntattOffentlighetHjemmel)
        )
        {
            throw new ArgumentException(
                "UnntattOffentlighetHjemmel must be set when ErUnntattOffentlighet is true in DirektoratTemplateFields"
            );
        }

        return new GenererBrevArgs
        {
            Md = Md!,
            MdVariables = MdVariables,
            Options = options,
        };
    }
}
