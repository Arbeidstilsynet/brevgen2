using Arbeidstilsynet.Brevgenerator.Client.Model;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class GenererBrevArgsBuilderDirektoratTemplateTests
{
    [Fact]
    public void WithDirektoratTemplate_SetsTemplateType()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDirektoratTemplate(Language.Bokmål, DirektoratTemplateSignatureVariant.Usignert)
            .WithDirektoratTemplateFields(new DirektoratTemplateFields())
            .Build();

        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithDirektoratTemplate_WithAllFields_BuildsCorrectly()
    {
        var signatureLines = new List<string> { "Ola Nordmann", "Direktør" };
        var mottaker = new DirektoratMottaker
        {
            Navn = "Bedrift AS",
            Adresse = "Gateveien 1",
            Postnr = "0123",
            Poststed = "Oslo",
        };
        var fields = new DirektoratTemplateFields
        {
            Dato = "22.01.2026",
            Saksnummer = "2026/1234",
            SaksbehandlerNavn = "Kari Nordmann",
            Mottaker = mottaker,
        };

        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", new Dictionary<string, object?> { ["key"] = "value" })
            .WithDirektoratTemplate(
                Language.Nynorsk,
                DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                signatureLines
            )
            .WithDirektoratTemplateFields(fields)
            .WithMetadata("Test Document", "Test Author")
            .Build();

        Assert.Equal("# Test", args.Md);
        Assert.NotNull(args.MdVariables);
        Assert.Equal("value", args.MdVariables["key"]);
        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs);
        Assert.Equal(Language.Nynorsk, args.Options.Dynamic.DirektoratTemplateArgs.Language);
        Assert.Equal(
            DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
            args.Options.Dynamic.DirektoratTemplateArgs.SignatureVariant
        );
        Assert.Equal(signatureLines, args.Options.Dynamic.DirektoratTemplateArgs.SignatureLines);
        Assert.Equal("22.01.2026", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Dato);
        Assert.Equal("2026/1234", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Saksnummer);
        Assert.Equal("Kari Nordmann", args.Options.Dynamic.DirektoratTemplateArgs.Fields.SaksbehandlerNavn);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker);
        Assert.Equal("Bedrift AS", args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker?.Navn);
        Assert.Equal("Test Document", args.Options.DocumentTitle);
        Assert.Equal("Test Author", args.Options.Author);
    }

    [Fact]
    public void WithDirektoratTemplate_WithMinimalFields_BuildsCorrectly()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Minimal", null)
            .WithDirektoratTemplate(Language.Bokmål, DirektoratTemplateSignatureVariant.Usignert)
            .WithDirektoratTemplateFields(new DirektoratTemplateFields())
            .Build();

        Assert.Equal(TemplateType.Direktorat, args.Options.Dynamic.Template);
        Assert.NotNull(args.Options.Dynamic.DirektoratTemplateArgs);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.SignatureLines);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Dato);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs.Fields.Mottaker);
    }

    [Fact]
    public void WithDirektoratTemplate_AllSignatureVariants_Work()
    {
        var variants = new[]
        {
            DirektoratTemplateSignatureVariant.Usignert,
            DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
        };

        foreach (var variant in variants)
        {
            var args = GenererBrevArgsBuilder
                .Create()
                .AddMarkdown("# Test", null)
                .WithDirektoratTemplate(Language.Bokmål, variant)
                .WithDirektoratTemplateFields(new DirektoratTemplateFields())
                .Build();

            Assert.Equal(variant, args.Options.Dynamic.DirektoratTemplateArgs?.SignatureVariant);
        }
    }

    [Fact]
    public void WithDirektoratTemplate_WithSignatureLines_OnlyUsedWithElektroniskGodkjent()
    {
        var signatureLines = new List<string> { "Leder Ledersen", "Avdelingsdirektør" };

        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDirektoratTemplate(
                Language.Bokmål,
                DirektoratTemplateSignatureVariant.ElektroniskGodkjent,
                signatureLines
            )
            .WithDirektoratTemplateFields(new DirektoratTemplateFields())
            .Build();

        Assert.Equal(signatureLines, args.Options.Dynamic.DirektoratTemplateArgs?.SignatureLines);
    }

    [Fact]
    public void WithDirektoratTemplate_MissingUnntattOffentlighetHjemmel_Throws()
    {
        var builder = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithDirektoratTemplate(Language.Bokmål, DirektoratTemplateSignatureVariant.Usignert)
            .WithDirektoratTemplateFields(new() { ErUnntattOffentlighet = true });

        var exception = Assert.Throws<ArgumentException>(builder.Build);
        Assert.Contains("UnntattOffentlighetHjemmel", exception.Message);
    }
}
