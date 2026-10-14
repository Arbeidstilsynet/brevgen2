# Brevgenerator2

Brevgenerator2 centralises and standardises PDF generation: consumers author content in Dynamic Markdown, and the service renders it into branded documents. This is one cohesive domain spanning the API, the web editor, and the supporting packages.

Canonical terms are English (used in code). Norwegian equivalents in parentheses are acceptable in the editor UI and end-user docs.

## Generated artifacts

**Document** (Dokument):
The rendered output the service produces from a content template and its variables — a PDF, or HTML when requested.
_Avoid_: Letter, brev, output file

**Dynamic Markdown**:
Markdown extended with variables, nested variables, and inline logic (conditionals), letting a single content template produce many variants. It may be stored as `.mdat`; existing content may also use `.md`.
_Avoid_: MDX, dynamic markup

## Templates

**Content template** (Innholdsmal):
The Dynamic Markdown authored by a consumer that defines a document's body and merge logic.
_Avoid_: Brevmal, letter template, letter mal

**Document template** (Dokumentmal):
The reusable letterhead, footer, and styling wrapper applied around the content. Variants are `default`, `direktorat`, `custom`, and `blank`.
_Avoid_: Layout, theme, brevmal

**Document template fields** (Dokumentmalfelt):
Consumer-supplied metadata a document template renders into its letterhead and footer (e.g. `dato`, `saksnummer`, `virksomhet`).
_Avoid_: Template arguments, template args, props, malfelter (ambiguous with the other "mal" terms)

**Signature variant** (Signaturvariant):
How a document is signed off: `elektroniskGodkjent`, `automatiskBehandlet`, or `usignert`.
_Avoid_: Signature type, signing mode

## Data and actors

**Variable** (Variabel):
A named value a consumer supplies for a content template, referenced inside the template with `{{ name }}`. Values may themselves contain Dynamic Markdown.
_Avoid_: Flettefelt, merge field, placeholder, token

**Consumer** (Konsument):
Any system that integrates with the Brevgenerator2 API to generate documents. A case-handling system (fagsystem) is one example of a consumer, not a separate concept.
_Avoid_: Fagsystem (as a distinct term), client, caller

## Editor concepts

**Workspace**:
A preview-web working area where a user saves and reopens work-in-progress content templates.
_Avoid_: Draft store, scratchpad
