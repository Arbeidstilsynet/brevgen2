import type { GenerateDocumentRequest } from "@repo/shared-types";
import type { LoadTestProfile } from "./types";

export const profileCycle: LoadTestProfile[] = [
  "small-blank",
  "small-blank",
  "typical-default",
  "typical-default",
  "typical-default",
  "typical-default",
  "typical-direktorat",
  "typical-direktorat",
  "heavy-default",
  "heavy-default",
];

const typicalContent = `# Load Test PDF

Dette er et representativt brev for lasttesting. Unik identifikator: {{requestId}}.

## Bakgrunn

Virksomheten skal sende inn dokumentasjon innen fristen. Informasjonen i dette brevet beskriver vedtaket og veiledningen som gjelder.

| Frist | Ansvarlig | Status |
|:--|:--|:--|
| 20.12.2030 | Virksomheten | Pågår |

## Videre oppfølging

- Gå gjennom vedtaket
- Send nødvendig dokumentasjon
- Ta kontakt ved spørsmål
`;

const heavyContent = `# Load Test PDF

Unik identifikator: {{requestId}}.

${Array.from(
  { length: 20 },
  (_, index) => `## Vurdering ${index + 1}

Arbeidstilsynet har vurdert dokumentasjonen og forholdene i virksomheten. Virksomheten må følge opp kravene innen angitt frist. Denne teksten representerer et lengre dokument med flere sider, avsnitt og overskrifter som er typisk for en krevende PDF-generering.`,
).join("\n\n")}`;

export function profileForRequest(requestNumber: number): LoadTestProfile {
  return profileCycle[requestNumber % profileCycle.length];
}

export function createPayload(
  profile: LoadTestProfile,
  requestId: string,
): GenerateDocumentRequest {
  switch (profile) {
    case "small-blank":
      return {
        md: "# Load Test PDF\n\nUnik identifikator: {{requestId}}.",
        mdVariables: { requestId },
        options: {
          document_title: `Load test - ${requestId}`,
          dynamic: { template: "blank" },
        },
      };
    case "typical-default":
      return {
        md: typicalContent,
        mdVariables: { requestId },
        options: {
          document_title: `Load test - ${requestId}`,
          dynamic: {
            template: "default",
            defaultTemplateArgs: {
              language: "bm",
              signatureVariant: "automatiskBehandlet",
              fields: {
                dato: "20.12.2030",
                saksnummer: `2030/${requestId}`,
                saksbehandlerNavn: "Lasttest Testesen",
                virksomhet: {
                  navn: "Eksempelvirksomhet AS",
                  adresse: "Testveien 1",
                  postnr: "7010",
                  poststed: "Trondheim",
                },
              },
            },
          },
        },
      };
    case "typical-direktorat":
      return {
        md: typicalContent,
        mdVariables: { requestId },
        options: {
          document_title: `Load test - ${requestId}`,
          dynamic: {
            template: "direktorat",
            direktoratTemplateArgs: {
              language: "bm",
              signatureVariant: "elektroniskGodkjent",
              signatureLines: ["Lasttest Testesen", "Avdelingsdirektør"],
              fields: {
                dato: "20.12.2030",
                saksnummer: `2030/${requestId}`,
                saksbehandlerNavn: "Lasttest Testesen",
                mottaker: {
                  navn: "Eksempelvirksomhet AS",
                  adresse: "Testveien 1",
                  postnr: "7010",
                  poststed: "Trondheim",
                },
              },
            },
          },
        },
      };
    case "heavy-default":
      return {
        md: heavyContent,
        mdVariables: { requestId },
        options: {
          document_title: `Load test - ${requestId}`,
          dynamic: {
            template: "default",
            defaultTemplateArgs: {
              language: "bm",
              signatureVariant: "elektroniskGodkjent",
              fields: {
                dato: "20.12.2030",
                saksnummer: `2030/${requestId}`,
                saksbehandlerNavn: "Lasttest Testesen",
                virksomhet: {
                  navn: "Eksempelvirksomhet AS",
                  adresse: "Testveien 1",
                  postnr: "7010",
                  poststed: "Trondheim",
                },
              },
            },
          },
        },
      };
  }
}
