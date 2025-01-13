import { defaultTemplate } from "@at/document-templates";

export const initialMd = `# H1 - Overskrift/Tittel
Normal tekst

## H2 - Overskrift
Normal tekst

Hyperkobling/Lenke med beskrivende ledetekst [Mer informasjon om arbeidstilsynet (arbeidstilsynet.no)](https://www.arbeidstilsynet.no)

- Kulepunkt med **uthevet skrift**
- Kulepunkt med *skrift i kursiv*

### H3 - Overskrift
Et avsnitt med tekst.

Et nytt avsnitt med tekst (merk dobbel linjeskift).

#### H4 - Overskrift
Normal tekst og [guide for Markdown](https://markdownguide.offshoot.io/basic-syntax/)


## Dynamisk funksjonalitet

### Flettefelt/variabler (se forhåndsvisning)
Oppgi referansenummer {{ saksnummer }}

### Logikk
{{ if visEksempelAvsnitt == true ::
#### Fagsystemet kan styre om dette avsnittet skal vises
Normal tekst
}}
`;

export const initialVars = {
  saksnummer: "2024/123",
  visEksempelAvsnitt: true,
} as const;

export const initialDefaultTemplateArgs: defaultTemplate.DefaultTemplateArgs = {
  language: "bm",
  fields: {
    dato: "13.09.2024",
    saksnummer: "2024/1234",
    deresDato: "",
    deresReferanse: "",
    saksbehandlerNavn: "Ola Nordmann",
    erUnntattOffentlighet: false,
    unntattOffentlighetHjemmel: "jf. offl. § 14",
    virksomhet: {
      navn: "Nissene på jordet AS",
      adresse: "Akersgata 123",
      postnr: "0152",
      poststed: "Oslo",
    },
  },
  signatureVariant: "elektroniskGodkjent",
};
