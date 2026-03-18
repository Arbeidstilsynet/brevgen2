using Arbeidstilsynet.Common.BrevgeneratorClient.Model;
using Arbeidstilsynet.Common.BrevgeneratorClient.Ports;
using Xunit;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Tests;

public class IGenererBrevArgsBuilderCustomTemplateTests
{
    [Fact]
    public void WithCustomTemplate_SetsTemplateType()
    {
        var args = IGenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithCustomTemplate().Build();

        Assert.Equal(TemplateType.Custom, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithCustomTemplate_HasNoTemplateArgs()
    {
        var args = IGenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithCustomTemplate().Build();

        Assert.Null(args.Options.Dynamic.DefaultTemplateArgs);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs);
    }

    [Fact]
    public void WithCustomTemplate_WithMetadata_BuildsCorrectly()
    {
        var args = IGenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Custom content", new Dictionary<string, object?> { ["var"] = 123 })
            .WithCustomTemplate()
            .WithMetadata("Custom Doc", "Custom Author")
            .Build();

        Assert.Equal("# Custom content", args.Md);
        Assert.Equal(123, args.MdVariables?["var"]);
        Assert.Equal("Custom Doc", args.Options.DocumentTitle);
        Assert.Equal("Custom Author", args.Options.Author);
    }

    [Fact]
    public void WithCustomTemplate_WithConversionOptions_BuildsCorrectly()
    {
        var pdfConfig = new PdfConfig { AsHtml = true, Css = ".custom { color: red; }" };

        var args = IGenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithCustomTemplate()
            .WithConversionOptions(pdfConfig)
            .Build();

        Assert.True(args.Options.AsHtml);
        Assert.Equal(".custom { color: red; }", args.Options.Css);
    }
}
