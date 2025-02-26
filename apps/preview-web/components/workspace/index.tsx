import { SharedFileList } from "./SharedFileList";
import { SharedFileNew } from "./SharedFileNew";

export function Workspace() {
  return (
    <article className="flex flex-col p-4 space-y-4">
      <h1 className="text-2xl font-bold">Delt arbeidsplass</h1>
      <span>
        Her kan du opprette og laste inn brevmaler som ikke er i et repo. For å gjøre endringer på
        en mal så må du overskrive den eller opprette en ny.
      </span>

      <aside
        className="bg-yellow-100 border-l-4 border-yellow-500 text-gray-900 p-4 mb-4"
        role="alert"
      >
        <p className="font-bold">Filer er felles for alle, så pass på hva du sletter.</p>
        <p className="font-bold">
          Merk! Hvis du overskriver en fil så kan andre ha gjort endringer på den i mellomtiden.
        </p>
      </aside>

      <aside className="mb-6 mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
        <p className="font-bold">Redigering er ikke delt</p>
        <p>Alt du gjør utenfor dette vinduet påvirker bare din egen instans av editoren.</p>
      </aside>

      <div className="p-4 space-y-6">
        <SharedFileNew />
        <SharedFileList />
      </div>
    </article>
  );
}
