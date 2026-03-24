using Arbeidstilsynet.Brevgenerator.Client.Implementation;
using Arbeidstilsynet.Brevgenerator.Client.Models;

namespace Arbeidstilsynet.Brevgenerator.Client.Ports;

/// <summary>
/// IAddMarkdownStep
/// </summary>
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

/// <summary>
/// IChooseTemplateStep
/// </summary>
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

/// <summary>
/// IDefaultTemplateFieldsStep
/// </summary>
public interface IDefaultTemplateFieldsStep
{
    /// <summary>
    /// Legg til flettefelt-verdier for default template. Saksnummer, Virksomhetsadresse o.l.
    /// </summary>
    /// <param name="fields"></param>
    IBuildStep WithDefaultTemplateFields(DefaultTemplateFields fields);
}

/// <summary>
/// IDirektoratTemplateFieldsStep
/// </summary>
public interface IDirektoratTemplateFieldsStep
{
    /// <summary>
    /// Legg til flettefelt-verdier for direktorat template. Saksnummer, Mottakeradresse o.l.
    /// </summary>
    /// <param name="fields"></param>
    IBuildStep WithDirektoratTemplateFields(DirektoratTemplateFields fields);
}

/// <summary>
/// IBuildStep
/// </summary>
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
    /// Den kan overstyre Author og DocumentTitle, men bruk heller WithMetadata for det.
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
public interface IGenererBrevArgsBuilder
{
    /// <summary>
    /// Initier builder
    /// </summary>
    public static IAddMarkdownStep Create() => new BuilderSteps();
}
