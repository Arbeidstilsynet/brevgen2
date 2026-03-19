using Arbeidstilsynet.Brevgenerator.Client.Model;
using Arbeidstilsynet.Brevgenerator.Client.Ports;

namespace Arbeidstilsynet.Brevgenerator.Client.Implementation;

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
