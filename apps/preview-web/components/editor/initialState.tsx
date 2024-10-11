import { defaultTemplate } from "@at/document-templates";

export const initialMd = `# Examples

## Normal markdown

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Some [link out of here](https://www.arbeidstilsynet.no).
- **item 1 (bold)**
- *item 2 (italic)*

## Variable

Hey, {{ userName }}

## Nested variables: {{ variableWithDynamicMarkdown }}

## Logic

{{ if isParsingFun == true :: *Hello, world!* }}

{{if event == Bad::NotMuchWhiteSpaceHere}}
{{ if meaning != 42 :: Wrong universe, {{ userName }} }}

## Misc

<p style="color: red; text-align: center;">Random HTML</p>
<script>alert("I am sanitized")</script>
`;

export const initialVars = {
  userName: "Saks B. Handler",
  event: "Good",
  meaning: "7",
  isParsingFun: true,
  variableWithDynamicMarkdown: "*I was nested*\n" + "Hello again, {{ userName }}\n\n",
} as const;

export const initialDefaultTemplateArgs: defaultTemplate.DefaultTemplateArgs = {
  language: "bm",
  fields: {
    dato: "13.09.2024",
    saksnummer: "2024/1234",
    saksbehandlerNavn: "Ola Nordmann",
    virksomhet: {
      navn: "Nissene på jordet AS",
      adresse: "Akersgata 123",
      postnr: "0152",
      poststed: "Oslo",
    },
  },
  signatureVariant: "elektroniskGodkjent",
};
