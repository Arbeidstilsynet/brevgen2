import type { DirektoratTemplateArgs, DirektoratTemplateFields } from "@repo/shared-types";
import { ChangeEvent, Dispatch } from "react";
import { Input } from "../Input";
import { Select } from "../Select";
import type { DirektoratTemplateArgsAction } from "./templateConfigReducer";

type Props = Readonly<{
  state: DirektoratTemplateArgs;
  dispatch: Dispatch<DirektoratTemplateArgsAction>;
}>;

export function TemplateConfigDirektoratForm({ state, dispatch }: Props) {
  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof DirektoratTemplateFields,
  ) => dispatch({ type: "UPDATE_FIELD", field, value: e.target.value });

  const handleBooleanFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: Extract<keyof DirektoratTemplateFields, "erUnntattOffentlighet">,
  ) => dispatch({ type: "TOGGLE_FIELD", field, value: e.target.checked });

  const handleMottakerChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof Required<NonNullable<DirektoratTemplateFields["mottaker"]>>,
  ) => dispatch({ type: "UPDATE_MOTTAKER", field, value: e.target.value });

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
          usignert: "Usignert",
        }}
        onChange={(value) => {
          dispatch({ type: "UPDATE_SIGNATURE_VARIANT", value });
        }}
      />

      <Input
        label="Vår dato"
        value={state.fields.dato ?? ""}
        onChange={(e) => handleFieldChange(e, "dato")}
      />

      <Input
        label="Vår referanse"
        value={state.fields.saksnummer ?? ""}
        onChange={(e) => handleFieldChange(e, "saksnummer")}
      />

      <Input
        label="Vår saksbehandler"
        value={state.fields.saksbehandlerNavn ?? ""}
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
        <h3 className="font-semibold text-gray-700 mb-4">Mottaker</h3>
        <Input
          label="Navn"
          value={state.fields.mottaker?.navn ?? ""}
          onChange={(e) => handleMottakerChange(e, "navn")}
        />
        <Input
          label="Adresse"
          value={state.fields.mottaker?.adresse ?? ""}
          onChange={(e) => handleMottakerChange(e, "adresse")}
        />
        <Input
          label="Postnr"
          value={state.fields.mottaker?.postnr ?? ""}
          onChange={(e) => handleMottakerChange(e, "postnr")}
        />
        <Input
          label="Poststed"
          value={state.fields.mottaker?.poststed ?? ""}
          onChange={(e) => handleMottakerChange(e, "poststed")}
        />
      </div>
    </div>
  );
}
