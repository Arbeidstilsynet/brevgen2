import type {
  DirektoratTemplateArgs,
  DirektoratTemplateFields,
  DirektoratTemplateSignatureVariant,
  TemplateLanguage,
} from "@repo/shared-types";
import { globalCss } from "./css";
import { logoDirektoratBase64 } from "./direktorat-logo";

const text = {
  saksbehandler: {
    bm: "saksbehandler",
    nn: "saksbehandlar",
  },
  hilsen: {
    bm: "Med vennlig hilsen",
    nn: "Med vennleg helsing",
  },
  elektroniskGodkjent: {
    bm: "Dette brevet er elektronisk godkjent.",
    nn: "Dette brevet er elektronisk godkjent.",
  },
} satisfies Record<string, Record<TemplateLanguage, string>>;

export function getMd(md: string, args: DirektoratTemplateArgs): string {
  const letterhead = getLetterhead(args.fields, args.language);
  return `${letterhead}\n\n${md}\n\n${getSignature(args.signatureVariant, args.language, args.signatureLines)}`;
}

function getLetterhead(fields: DirektoratTemplateFields, language: TemplateLanguage) {
  // Use joined array to avoid extra whitespace from nested template string.
  // Certain whitespace can cause Marked's HTML conversion to insert elements as string literals in <code> tags.
  const lines = [
    `<div style="margin-bottom: 36px;">`,
    `<img src="${logoDirektoratBase64}" alt="Logo" style="max-width: 148px; height: auto; text-align: left;" />`,
    `</div>`,
    `<div style="text-align: right; font-size: 10pt;">`,
    fields.dato && `<p style="margin: 0;">Vår dato: ${fields.dato}</p>`,
    fields.saksnummer && `<p style="margin: 0;">Vår referanse: ${fields.saksnummer}</p>`,
    fields.saksbehandlerNavn &&
      `<p style="margin: 0;">Vår ${text.saksbehandler[language]}: ${fields.saksbehandlerNavn}</p>`,
    `</div>`,
    `<p style="margin-bottom: 66px; font-style: normal;">`,
    fields.mottaker && `<span style="display: block;">${fields.mottaker.navn}</span>`,
    fields.mottaker && `<span style="display: block;">${fields.mottaker.adresse}</span>`,
    fields.mottaker &&
      `<span style="display: block;">${fields.mottaker.postnr} ${fields.mottaker.poststed}</span>`,
    `</p>`,
  ].filter(Boolean);
  return lines.join("\n");
}

function getSignature(
  variant: DirektoratTemplateSignatureVariant,
  language: TemplateLanguage,
  signatureLines: string[] | null | undefined,
): string {
  if (variant === "usignert") {
    return "";
  }

  if (variant === "elektroniskGodkjent") {
    // NB: bruk av <br/> er viktig for avstand mellom innhold og signatur, samt formattering av signatur.
    // Ved endringer av signaturen, test nøye.
    return `<br /><br />
  ${text.hilsen[language]}<br />
  **Direktoratet for arbeidstilsynet**<br />
  ${signatureLines ? "<br />" + signatureLines.map((line) => `${line}<br />`).join("") + "<br />" : "<br />"}
  *${text[variant][language]}*<br /><br />
  Postadresse: Postboks 4720 Torgarden, 7468 Trondheim, Norge<br />
  Telefon: +47 73 19 97 00<br />
  Organisasjonsnummer: 974 761 211<br />
  [www.arbeidstilsynet.no](https://www.arbeidstilsynet.no)
  `;
  }

  return "";
}

function getFooter(fields: DirektoratTemplateFields): string {
  // nodene med class pageNumber og totalPages blir injected av Puppeteer
  // se PDFOptions.footerTemplate https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.pdfoptions.md
  return `
    <div style="font-family: 'Aptos', 'Helvetica Neue', Arial, sans-serif; font-size: 10px; text-align: right; width: 100%; margin-right: 0.8in; margin-bottom: 0.5in;">
      ${fields.saksnummer || typeof fields.saksnummer === "number" ? `<div>Vår referanse: ${fields.saksnummer}</div>` : ""}
      <div>Side <span class="pageNumber"></span> av <span class="totalPages"></span></div>
    </div>`;
}

export const direktoratTemplate = {
  globalCss,
  getMd,
  getFooter,
};
