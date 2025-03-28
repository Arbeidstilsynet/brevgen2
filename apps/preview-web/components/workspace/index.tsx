import { useToast } from "../toast/provider";
import { Toast } from "../toast/Toast";
import { SharedFileList } from "./SharedFileList";
import { SharedFileNew } from "./SharedFileNew";

export function Workspace() {
  const { message, variant, clearToast } = useToast();

  return (
    <article className="flex flex-col p-4 space-y-4">
      <h1 className="text-2xl font-bold">Delt arbeidsplass</h1>

      {message && <Toast message={message} variant={variant} onClose={clearToast} />}

      <span>
        Dette er arbeidsområde for brevmaler. Her kan du opprette og laste opp brevmaler som ikke er
        lagret i et repository. Hvis du vil endre en eksisterende mal, må du enten overskrive den
        eller opprette en ny.
      </span>

      <aside className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-gray-900" role="alert">
        <p className="font-bold">
          Filer som ligger her er felles for alle. Ikke slett før malen er lagt ut i repository.
        </p>
        <p className="font-bold">
          Merk! Hent alltid opp filen før du overskriver, slik at du ikke mister endringer som andre
          har gjort.
        </p>
      </aside>

      <aside className="p-4 border-l-4 border-blue-500 bg-blue-50">
        <p>
          Du kan lage link direkte til en fil med knappen “Copy permanent URL” med for å dele malen
          med andre eller lage bokmerker for deg selv
        </p>
      </aside>

      <div className="p-4 space-y-6">
        <SharedFileNew />
        <SharedFileList />
      </div>
    </article>
  );
}
