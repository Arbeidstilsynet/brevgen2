import type { DefaultTemplateArgs, DefaultTemplateFields } from "@repo/shared-types";
import { ChangeEvent, Dispatch } from "react";
import { Input } from "../Input";
import { Select } from "../Select";
import type { DefaultTemplateArgsAction } from "./templateConfigReducer";

type Props = Readonly<{
  state: DefaultTemplateArgs;
  dispatch: Dispatch<DefaultTemplateArgsAction>;
}>;

export function TemplateConfigDefaultForm({ state, dispatch }: Props) {
  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: Exclude<keyof DefaultTemplateFields, "erUnntattOffentlighet">,
  ) => dispatch({ type: "UPDATE_FIELD", field, value: e.target.value });

  const handleBooleanFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: Extract<keyof DefaultTemplateFields, "erUnntattOffentlighet">,
  ) => dispatch({ type: "TOGGLE_FIELD", field, value: e.target.checked });

  const handleVirksomhetChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof DefaultTemplateFields["virksomhet"],
  ) => dispatch({ type: "UPDATE_VIRKSOMHET", field, value: e.target.value });

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <Select
        label="Språk"
        value={state.language}
        options={{ bm: "Bokmål", nn: "Nynorsk" }}
        onChange={(value) => {
          dispatch({ type: "UPDATE_LANGUAGE", value });
        }}
      />

      <Select
        label="Signaturvariant"
        value={state.signatureVariant}
        options={{
          elektroniskGodkjent: "Elektronisk godkjent",
          automatiskBehandlet: "Automatisk behandlet",
          usignert: "Usignert",
        }}
        onChange={(value) => {
          dispatch({ type: "UPDATE_SIGNATURE_VARIANT", value });
        }}
      />

      <Input
        label="Vår dato"
        value={state.fields.dato}
        onChange={(e) => handleFieldChange(e, "dato")}
      />

      <Input
        label="Vår referanse"
        value={state.fields.saksnummer}
        onChange={(e) => handleFieldChange(e, "saksnummer")}
      />

      <Input
        label="Tidligere referanse"
        value={state.fields.tidligereReferanse ?? ""}
        onChange={(e) => handleFieldChange(e, "tidligereReferanse")}
      />

      <Input
        label="Deres dato"
        value={state.fields.deresDato ?? ""}
        onChange={(e) => handleFieldChange(e, "deresDato")}
      />

      <Input
        label="Deres referanse"
        value={state.fields.deresReferanse ?? ""}
        onChange={(e) => handleFieldChange(e, "deresReferanse")}
      />

      <Input
        label="Vår saksbehandler"
        value={state.fields.saksbehandlerNavn}
        onChange={(e) => handleFieldChange(e, "saksbehandlerNavn")}
      />

      <div className="flex flex-row">
        <Input
          type="checkbox"
          label="Unntatt offentlighet"
          checked={state.fields.erUnntattOffentlighet ?? false}
          onChange={(e) => handleBooleanFieldChange(e, "erUnntattOffentlighet")}
        />

        <Input
          label="Hjemmel"
          value={state.fields.unntattOffentlighetHjemmel ?? ""}
          onChange={(e) => handleFieldChange(e, "unntattOffentlighetHjemmel")}
        />
      </div>

      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-4">Virksomhet</h3>
        <Input
          label="Navn"
          value={state.fields.virksomhet.navn}
          onChange={(e) => handleVirksomhetChange(e, "navn")}
        />
        <Input
          label="Adresse"
          value={state.fields.virksomhet.adresse}
          onChange={(e) => handleVirksomhetChange(e, "adresse")}
        />
        <Input
          label="Postnr"
          value={state.fields.virksomhet.postnr}
          onChange={(e) => handleVirksomhetChange(e, "postnr")}
        />
        <Input
          label="Poststed"
          value={state.fields.virksomhet.poststed}
          onChange={(e) => handleVirksomhetChange(e, "poststed")}
        />
      </div>
    </div>
  );
}
