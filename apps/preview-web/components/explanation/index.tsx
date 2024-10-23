import { HoverableText } from "../editor/HoverableText";

export type IndictableElement = "editor" | "preview" | "vars" | "previewTabs" | null;

type Props = Readonly<{
  setHoveredElement: (element: IndictableElement) => void;
}>;

export function Explanation({ setHoveredElement }: Props) {
  const getHoverHandler =
    (element: IndictableElement) =>
    (hover: boolean): void =>
      setHoveredElement(hover ? element : null);

  return (
    <article className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-extrabold mb-4">Brevgenerator2</h2>
      <section>
        <p className="mb-4">
          Med Brevgenerator2 definerer vi brevmaler med{" "}
          <a
            href="https://www.markdownguide.org/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Markdown
          </a>{" "}
          i stedet for Word-filer. Dette gjør det mulig å standardisere brevene. Det lar oss skille
          innhold («brevmal») fra utformingen og standard felter som alle våre brev har
          («dokumentmal» eller «template»). Vi kan også enkelt trekke ut standardavsnitt som går
          igjen i mange brev og garantere at de blir like der de brukes. På et teknisk nivå blir det
          også enklere å se endringer som skal sjekkes inn i kode og dermed tryggere å gjøre
          endringer på brev uten å manuelt dobbelt og trippeltkontrollere Word-filene.
        </p>
        <p>
          For å muliggjøre bruk av flettefelter («variables») med Markdown bruker Brevgenerator2
          «Dynamisk Markdown». Det er en utvidelse som gjør det mulig å ikke bare flette inn enkelte
          felter, men hele avsnitt eller sider med innhold.
        </p>
      </section>

      <h2 className="text-2xl font-bold mb-4 mt-6">Om denne nettsiden</h2>
      <section>
        <p className="mb-4">
          Denne nettsiden er et verktøy for redigering og forhåndsvisning av «Dynamisk Markdown».{" "}
          <HoverableText onHover={getHoverHandler("editor")}>I midten</HoverableText> er en editor
          hvor du kan skrive innhold («brevmal»).{" "}
          <HoverableText onHover={getHoverHandler("preview")}>På høyre side</HoverableText> er
          forhåndsvisning av tre forskjellige format, som kan veksles mellom med tab-knappene{" "}
          <HoverableText onHover={getHoverHandler("previewTabs")}>tab-knappene</HoverableText>{" "}
          ovenfor. <HoverableText onHover={getHoverHandler("vars")}>På venstre side</HoverableText>{" "}
          kan du sette variabelverdier og konfigurere dokumentmalen.
        </p>
        <p className="mb-4">
          For å bruke variabler, skriv dem inn i markdown-innholdet ditt. Programmet vil automatisk
          finne og erstatte disse variablene med de verdiene du har spesifisert.
        </p>
        <p>
          NB: denne nettsiden har ikke funksjonalitet for å lagre endringene dine direkte i
          kodebasen for fagsystemet. Når du er ferdig med å redigere brevmalen kan du sende det til
          en utvikler for å sjekke det inn i kode. Husk at brevmalen bare består av Markdown (ren
          tekst), så det er lett å overføre den via Teams e.l.
        </p>
      </section>

      <aside className="mb-6 mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
        <h3 className="font-semibold mb-2">Lær mer om Markdown</h3>
        <p>
          For mer informasjon om hvordan du bruker Markdown, se{" "}
          <a
            href="https://markdownguide.offshoot.io/basic-syntax/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            denne guiden
          </a>
          .
        </p>
      </aside>

      <h3 className="text-l font-bold mb-4">Eksempel på Dynamisk Markdown</h3>
      <section>
        <pre className="bg-gray-100 rounded mb-4">
          {`
    ## H2 overskrift
    Deres saksnummer er {{ Saksnummer }}
        `}
        </pre>
        <p>
          Når fagsystemet sender denne teksten til Brevgenerator2 sammen med en variabel{" "}
          <code>Saksnummer=&quot;2024/123&quot;</code> blir det til:
        </p>
        <pre className="bg-gray-100 rounded mb-4">
          {`
    ## H2 overskrift
    Deres saksnummer er 2024/123
        `}
        </pre>
        <p>
          Deretter konverterer Brevgenerator2 det til et HTML-dokument med standard dokumentmal. Til
          slutt blir det gjort om til et PDF-dokument med A4-format og sendt tilbake til
          fagsystemet.
        </p>
      </section>
    </article>
  );
}
