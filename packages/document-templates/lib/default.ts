import { logoBase64 } from "./default-logo";

export type Language = "bm" | "nn";
export type SignatureVariant = "elektroniskGodkjent" | "automatiskBehandlet" | "usignert";

const SpecificText = {
  saksbehandler: {
    bm: "saksbehandler",
    nn: "saksbehandlar",
  },
  elektroniskGodkjent: {
    bm: "Dette brevet er elektronisk godkjent.",
    nn: "Dette brevet er elektronisk godkjent.",
  },
  automatiskBehandlet: {
    bm: "Dette er automatisk behandlet, og brevet er derfor ikke signert.",
    nn: "Dette er automatisk behandla, og brevet er derfor ikkje signert.",
  },
  hilsen: {
    bm: "Med vennlig hilsen",
    nn: "Med vennleg hilsen",
  },
} satisfies Record<string, Record<Language, string>>;

export type DefaultTemplateArgs = {
  language: Language;
  fields: DefaultTemplateFields;
  signatureVariant: SignatureVariant;
};

export type DefaultTemplateFields = {
  dato: string;
  saksnummer: string | number;
  saksbehandlerNavn: string;
  virksomhet: {
    navn: string;
    adresse: string;
    postnr: string | number;
    poststed: string;
  };
};

export const globalCss = `
body {
  font-family: Calibri,Candara,Segoe,Segoe UI,Optima,Arial,sans-serif;
  font-size: 11.5pt;
  }
h1 {
  font-size: 22pt;
  font-weight: normal;
}
h2 {
  font-size: 16pt;
  font-weight: normal;
}
h3 {
  font-size: 14pt;
  font-weight: normal;
}
h4 {
  font-size: 11.5pt;
  font-weight: bold;
}
p {
  break-inside: avoid;
}
a {
  color: #3C4C7D;
}
`;

export function getLetterhead(fields: DefaultTemplateFields, language: Language) {
  return `
  <div style="margin-bottom: 36px;">
    <img src="${logoBase64}" alt="Logo" style="max-width: 114px; height: auto; text-align: left;" />
  </div>
  <div style="text-align: right; font-size: 10pt;">
    <p style="margin: 0;">Vår dato: ${fields.dato}</p>
    <p style="margin: 0;">Vår referanse: ${fields.saksnummer}</p>
    <p style="margin: 0;">Vår ${SpecificText.saksbehandler[language]}: ${fields.saksbehandlerNavn}</p>
  </div>
  <p style="margin-bottom: 66px; font-style: normal;">
    <span style="display: block;">${fields.virksomhet.navn}</span>
    <span style="display: block;">${fields.virksomhet.adresse}</span>
    <span style="display: block;">${fields.virksomhet.postnr} ${fields.virksomhet.poststed}</span>
  </p>
`;
}

export function getSignature(variant: SignatureVariant, language: Language) {
  if (variant === "usignert") {
    return "";
  }

  return `<br /><br />
  ${SpecificText.hilsen[language]}<br />
  **Arbeidstilsynet**<br />
  *${SpecificText[variant][language]}*<br /><br />
  Postadresse: Postboks 4720 Torgarden, 7468 Trondheim, Norge<br />
  Telefon: +47 73 19 97 00<br />
  Organisasjonsnummer: 974 761 211<br />
  [www.arbeidstilsynet.no](https://www.arbeidstilsynet.no)
  `;
}

export function getFooter(fields: DefaultTemplateFields): string {
  return `
    <div style="font-family: Calibri,Candara,Segoe,Segoe UI,Optima,Arial,sans-serif; font-size: 10px; text-align: right; width: 100%; margin-right: 0.8in; margin-bottom: 0.5in;">
      <div>Vår referanse: ${fields.saksnummer}</div>
      <div>Side <span class="pageNumber"></span> av <span class="totalPages"></span></div>
    </div>`;
}
