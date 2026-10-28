import { describe, expect, test } from "vitest";
import { defaultConfig } from "./config";
import { getHtml } from "./get-html";

describe("getHtml", () => {
  test("renders Markdown and supported raw HTML in a Norwegian HTML document", () => {
    const html = getHtml(
      '# Heading\n\n**Bold** and *emphasis*\n\n- Item\n\n<table><tr><td colspan="2">Cell</td></tr></table>',
      { ...defaultConfig, document_title: "Letter 2026/123" },
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="no">');
    expect(html).toContain('<title>Letter 2026/123</title><meta charset="utf-8">');
    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<strong>Bold</strong> and <em>emphasis</em>");
    expect(html).toContain("<ul>\n<li>Item</li>\n</ul>");
    expect(html).toContain('<table><tr><td colspan="2">Cell</td></tr></table>');
  });

  test("removes script and style contents and unsupported iframe elements", () => {
    const html = getHtml(
      '<p>Before</p><script>script-content</script><style>style-content</style><iframe src="https://example.com"></iframe><p>After</p>',
      defaultConfig,
    );

    expect(html).toContain("<p>Before</p><p>After</p>");
    expect(html).not.toMatch(/script|style|iframe|example\.com/);
  });

  test.each([
    "http://example.com",
    "https://example.com",
    "mailto:post@example.com",
    "/documents/123",
    "#section",
  ])("retains link destination %s", (href) => {
    expect(getHtml(`[Read more](${href})`, defaultConfig)).toContain(
      `<a href="${href}">Read more</a>`,
    );
  });

  test.each(["javascript:alert(1)", "data:text/html,example", "ftp://example.com"])(
    "removes disallowed link destination %s but retains the label",
    (href) => {
      const html = getHtml(`<a href="${href}">Read more</a>`, defaultConfig);

      expect(html).toContain("<a>Read more</a>");
      expect(html).not.toContain("href=");
    },
  );

  test("retains embedded data images and their layout attributes, but removes remote image sources", () => {
    const data = "data:image/png;base64,iVBORw0KGgo=";
    const html = getHtml(
      `<img src="${data}" alt="Logo" width="148" style="height: auto;" /><img src="https://example.com/logo.png" alt="Remote" />`,
      defaultConfig,
    );

    expect(html).toContain(`<img src="${data}" alt="Logo" width="148" style="height:auto" />`);
    expect(html).toContain('<img alt="Remote" />');
    expect(html).not.toContain("https://example.com/logo.png");
  });

  test("retains formatting and custom attributes rather than applying an attribute allowlist", () => {
    const html = getHtml(
      '<p id="intro" class="letter" style="text-align: right;" data-reference="123" title="A &amp; B">Text</p>',
      defaultConfig,
    );

    expect(html).toContain(
      '<p id="intro" class="letter" style="text-align:right" data-reference="123" title="A &amp; B">Text</p>',
    );
  });

  test("preserves special characters as text without double-escaping entities", () => {
    const html = getHtml(
      'A & B, &amp;, 2 < 3, 4 > 3, "quoted" and \'apostrophe\'.\n\n`<tag attr="value">`',
      defaultConfig,
    );

    expect(html).toContain(
      "<p>A &amp; B, &amp;, 2 &lt; 3, 4 &gt; 3, \"quoted\" and 'apostrophe'.</p>",
    );
    expect(html).toContain('<code>&lt;tag attr="value"&gt;</code>');
    expect(html).not.toContain("&amp;amp;");
  });

  test("keeps the document title independent of the body and supports an empty title", () => {
    expect(getHtml("# Body heading", defaultConfig)).toContain("<title></title>");
    expect(
      getHtml("# Body heading", { ...defaultConfig, document_title: "Document title" }),
    ).toContain("<title>Document title</title>");
  });
});
