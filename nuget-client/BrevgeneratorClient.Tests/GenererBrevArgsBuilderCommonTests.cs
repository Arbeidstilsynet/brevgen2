using Arbeidstilsynet.Brevgenerator.Client.Models;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class GenererBrevArgsBuilderCommonTests
{
    [Fact]
    public void AddMarkdown_PreservesMarkdownContent()
    {
        const string markdown = "# Header\n\nParagraph with **bold** text.";

        var args = GenererBrevArgsBuilder.Create().AddMarkdown(markdown, null).WithCustomTemplate().Build();

        Assert.Equal(markdown, args.Md);
    }

    [Fact]
    public void AddMarkdown_WithVariables_PreservesVariables()
    {
        var variables = new Dictionary<string, object?>
        {
            ["stringVar"] = "text",
            ["numberVar"] = 42,
            ["boolVar"] = true,
            ["nullVar"] = null,
        };

        var args = GenererBrevArgsBuilder.Create().AddMarkdown("# Test", variables).WithCustomTemplate().Build();

        Assert.NotNull(args.MdVariables);
        Assert.Equal("text", args.MdVariables["stringVar"]);
        Assert.Equal(42, args.MdVariables["numberVar"]);
        Assert.True((bool)args.MdVariables["boolVar"]!);
        Assert.Null(args.MdVariables["nullVar"]);
    }

    [Fact]
    public void AddMarkdown_WithNullVariables_IsAccepted()
    {
        var args = GenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithCustomTemplate().Build();

        Assert.Null(args.MdVariables);
    }

    [Fact]
    public void WithMetadata_CanBeChained()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Test", null)
            .WithBlankTemplate()
            .WithMetadata("Title", "Author")
            .WithConversionOptions(new PdfConfig { Css = ".test {}" })
            .Build();

        Assert.Equal("Title", args.Options.DocumentTitle);
        Assert.Equal("Author", args.Options.Author);
        Assert.Equal(".test {}", args.Options.Css);
    }
}
