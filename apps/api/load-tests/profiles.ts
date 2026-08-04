import type { GenerateDocumentRequest } from "@repo/shared-types";

interface ProfileDefinition {
  /** How many slots this profile occupies in the deterministic request cycle */
  weight: number;
  createPayload: (requestId: string) => GenerateDocumentRequest;
}

const typicalContent = `# Load Test PDF

Dette er et representativt dokument for lasttesting. Unik identifikator: {{requestId}}.

## Bakgrunn

Virksomheten skal sende inn dokumentasjon innen fristen. Informasjonen i dette dokumentet beskriver vedtaket og veiledningen som gjelder.

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

/**
 * Single source of truth for the load test profiles: their names, their share of the
 * deterministic request cycle, and the payload each one sends.
 */
const profileRegistry = {
  "small-blank": {
    weight: 2,
    createPayload: (requestId) => ({
      md: "# Load Test PDF\n\nUnik identifikator: {{requestId}}.",
      mdVariables: { requestId },
      options: {
        document_title: `Load test - ${requestId}`,
        dynamic: { template: "blank" },
      },
    }),
  },
  "typical-default": {
    weight: 4,
    createPayload: (requestId) => ({
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
    }),
  },
  "typical-direktorat": {
    weight: 2,
    createPayload: (requestId) => ({
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
    }),
  },
  "heavy-default": {
    weight: 2,
    createPayload: (requestId) => ({
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
    }),
  },
} satisfies Record<string, ProfileDefinition>;

export type LoadTestProfile = keyof typeof profileRegistry;

export const profileNames = Object.keys(profileRegistry) as LoadTestProfile[];

const profileCycle: LoadTestProfile[] = profileNames.flatMap((profile) =>
  Array.from({ length: profileRegistry[profile].weight }, () => profile),
);

export function profileForRequest(requestNumber: number): LoadTestProfile {
  return profileCycle[requestNumber % profileCycle.length];
}

export function createPayload(
  profile: LoadTestProfile,
  requestId: string,
): GenerateDocumentRequest {
  return profileRegistry[profile].createPayload(requestId);
}
