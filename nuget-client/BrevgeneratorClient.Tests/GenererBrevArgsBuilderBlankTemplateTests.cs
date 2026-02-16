using Arbeidstilsynet.Brevgenerator.Client.Model;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class GenererBrevArgsBuilderBlankTemplateTests
{
    [Fact]
    public void WithBlankTemplate_SetsTemplateType()
    {
        var args = GenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithBlankTemplate().Build();

        Assert.Equal(TemplateType.Blank, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithBlankTemplate_HasNoTemplateArgs()
    {
        var args = GenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithBlankTemplate().Build();

        Assert.Null(args.Options.Dynamic.DefaultTemplateArgs);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs);
    }

    [Fact]
    public void WithBlankTemplate_WithMetadata_BuildsCorrectly()
    {
        var args = GenererBrevArgsBuilder
            .Create()
            .AddMarkdown("# Blank page", null)
            .WithBlankTemplate()
            .WithMetadata("Blank Doc", "Blank Author")
            .Build();

        Assert.Equal("# Blank page", args.Md);
        Assert.Equal("Blank Doc", args.Options.DocumentTitle);
        Assert.Equal("Blank Author", args.Options.Author);
    }
}
