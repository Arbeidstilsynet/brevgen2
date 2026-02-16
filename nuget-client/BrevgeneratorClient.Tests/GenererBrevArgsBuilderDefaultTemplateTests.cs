using Arbeidstilsynet.Brevgenerator.Client.Models;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class GenererBrevArgsBuilderDefaultTemplateTests
{
    [Fact]
    public void WithDefaultTemplate_SetsTemplateType()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDefaultTemplate(Language.Bokmål, DefaultTemplateSignatureVariant.ElektroniskGodkjent)
            .WithDefaultTemplateFields(CreateMinimalDefaultFields())
            .Build();

        Assert.Equal(TemplateType.Default, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithDefaultTemplate_WithAllFields_BuildsCorrectly()
    {
        var fields = new DefaultTemplateFields
        {
            Dato = "22.01.2026",
            Saksnummer = "2026/1234",
            SaksbehandlerNavn = "Kari Nordmann",
            Virksomhet = new Virksomhet
            {
                Navn = "Bedrift AS",
                Adresse = "Gateveien 1",
                Postnr = "0123",
                Poststed = "Oslo",
            },
            TidligereReferanse = "2025/9999",
            DeresDato = "01.01.2026",
            DeresReferanse = "REF-123",
            ErUnntattOffentlighet = true,
            UnntattOffentlighetHjemmel = "jf. offl. § 14",
        };

        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", new Dictionary<string, object?> { ["key"] = "value" })
            .WithDefaultTemplate(Language.Nynorsk, DefaultTemplateSignatureVariant.AutomatiskBehandlet)
            .WithDefaultTemplateFields(fields)
            .WithMetadata("Test Document", "Test Author")
            .Build();

        Assert.Equal("# Test", args.Md);
        Assert.NotNull(args.MdVariables);
        Assert.Equal("value", args.MdVariables["key"]);
        Assert.Equal(TemplateType.Default, args.Options.Dynamic.Template);
        Assert.NotNull(args.Options.Dynamic.DefaultTemplateArgs);
        Assert.Equal(Language.Nynorsk, args.Options.Dynamic.DefaultTemplateArgs.Language);
        Assert.Equal(
            DefaultTemplateSignatureVariant.AutomatiskBehandlet,
            args.Options.Dynamic.DefaultTemplateArgs.SignatureVariant
        );
        Assert.Equal("22.01.2026", args.Options.Dynamic.DefaultTemplateArgs.Fields.Dato);
        Assert.Equal("2026/1234", args.Options.Dynamic.DefaultTemplateArgs.Fields.Saksnummer);
        Assert.Equal("Bedrift AS", args.Options.Dynamic.DefaultTemplateArgs.Fields.Virksomhet.Navn);
        Assert.True(args.Options.Dynamic.DefaultTemplateArgs.Fields.ErUnntattOffentlighet);
        Assert.Equal("Test Document", args.Options.DocumentTitle);
        Assert.Equal("Test Author", args.Options.Author);
    }

    [Fact]
    public void WithDefaultTemplate_AllSignatureVariants_Work()
    {
        var variants = new[]
        {
            DefaultTemplateSignatureVariant.ElektroniskGodkjent,
            DefaultTemplateSignatureVariant.AutomatiskBehandlet,
            DefaultTemplateSignatureVariant.Usignert,
        };

        foreach (var variant in variants)
        {
            var args = GenererBrevArgsBuilder
                .Create()
                .AddMarkdown("# Test", null)
                .WithDefaultTemplate(Language.Bokmål, variant)
                .WithDefaultTemplateFields(CreateMinimalDefaultFields())
                .Build();

            Assert.Equal(variant, args.Options.Dynamic.DefaultTemplateArgs?.SignatureVariant);
        }
    }

    [Fact]
    public void WithDefaultTemplate_BothLanguages_Work()
    {
        var languages = new[] { Language.Bokmål, Language.Nynorsk };

        foreach (var language in languages)
        {
            var args = GenererBrevArgsBuilder
                .Create()
                .AddMarkdown("# Test", null)
                .WithDefaultTemplate(language, DefaultTemplateSignatureVariant.Usignert)
                .WithDefaultTemplateFields(CreateMinimalDefaultFields())
                .Build();

            Assert.Equal(language, args.Options.Dynamic.DefaultTemplateArgs?.Language);
        }
    }

    [Fact]
    public void WithDefaultTemplate_MissingUnntattOffentlighetHjemmel_Throws()
    {
        var builder = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDefaultTemplate(Language.Bokmål, DefaultTemplateSignatureVariant.Usignert)
            .WithDefaultTemplateFields(
                new()
                {
                    Dato = "01.01.2026",
                    Saksnummer = "2026/0001",
                    SaksbehandlerNavn = "Test",
                    Virksomhet = new Virksomhet
                    {
                        Navn = "Test AS",
                        Adresse = "Testveien 1",
                        Postnr = "0000",
                        Poststed = "Test",
                    },
                    ErUnntattOffentlighet = true,
                }
            );

        var exception = Assert.Throws<ArgumentException>(builder.Build);
        Assert.Contains("UnntattOffentlighetHjemmel", exception.Message);
    }

    private static DefaultTemplateFields CreateMinimalDefaultFields() =>
        new()
        {
            Dato = "01.01.2026",
            Saksnummer = "2026/0001",
            SaksbehandlerNavn = "Test",
            Virksomhet = new Virksomhet
            {
                Navn = "Test AS",
                Adresse = "Testveien 1",
                Postnr = "0000",
                Poststed = "Test",
            },
        };
}
