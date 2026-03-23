using Arbeidstilsynet.Brevgenerator.Client.Models;
using Arbeidstilsynet.Brevgenerator.Client.Ports;
using Xunit;

namespace Arbeidstilsynet.Brevgenerator.Client.Tests;

public class IGenererBrevArgsBuilderBlankTemplateTests
{
    [Fact]
    public void WithBlankTemplate_SetsTemplateType()
    {
        var args = IGenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithBlankTemplate().Build();

        Assert.Equal(TemplateType.Blank, args.Options.Dynamic.Template);
    }

    [Fact]
    public void WithBlankTemplate_HasNoTemplateArgs()
    {
        var args = IGenererBrevArgsBuilder.Create().AddMarkdown("# Test", null).WithBlankTemplate().Build();

        Assert.Null(args.Options.Dynamic.DefaultTemplateArgs);
        Assert.Null(args.Options.Dynamic.DirektoratTemplateArgs);
    }

    [Fact]
    public void WithBlankTemplate_WithMetadata_BuildsCorrectly()
    {
        var args = IGenererBrevArgsBuilder
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
