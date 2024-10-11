import { defaultTemplate } from "@at/document-templates";
import { ChangeEvent, Dispatch } from "react";
import { DefaultTemplateArgsAction } from "./templateConfigReducer";

type Props = Readonly<{
  state: defaultTemplate.DefaultTemplateArgs;
  dispatch: Dispatch<DefaultTemplateArgsAction>;
}>;

export function TemplateConfigDefaultForm({ state, dispatch }: Props) {
  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof defaultTemplate.DefaultTemplateFields,
  ) => {
    dispatch({
      type: "UPDATE_FIELD",
      field,
      value: e.target.value,
    });
  };

  const handleVirksomhetChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof defaultTemplate.DefaultTemplateFields["virksomhet"],
  ) => {
    dispatch({
      type: "UPDATE_VIRKSOMHET",
      field,
      value: e.target.value,
    });
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Språk:</label>
        <select
          value={state.language}
          onChange={(e) => {
            dispatch({
              type: "UPDATE_LANGUAGE",
              value: e.target.value as defaultTemplate.Language,
            });
          }}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="bm">Bokmål</option>
          <option value="nn">Nynorsk</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Signaturvariant:</label>
        <select
          value={state.signatureVariant}
          onChange={(e) => {
            dispatch({
              type: "UPDATE_SIGNATURE_VARIANT",
              value: e.target.value as defaultTemplate.SignatureVariant,
            });
          }}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="elektroniskGodkjent">elektroniskGodkjent</option>
          <option value="automatiskBehandlet">automatiskBehandlet</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Dato:</label>
        <input
          type="text"
          value={state.fields.dato}
          onChange={(e) => handleFieldChange(e, "dato")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Saksnummer:</label>
        <input
          type="text"
          value={state.fields.saksnummer}
          onChange={(e) => handleFieldChange(e, "saksnummer")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Saksbehandlernavn:</label>
        <input
          type="text"
          value={state.fields.saksbehandlerNavn}
          onChange={(e) => handleFieldChange(e, "saksbehandlerNavn")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-4">Virksomhet</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Navn:</label>
          <input
            type="text"
            value={state.fields.virksomhet.navn}
            onChange={(e) => handleVirksomhetChange(e, "navn")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Adresse:</label>
          <input
            type="text"
            value={state.fields.virksomhet.adresse}
            onChange={(e) => handleVirksomhetChange(e, "adresse")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Postnr:</label>
          <input
            type="text"
            value={state.fields.virksomhet.postnr}
            onChange={(e) => handleVirksomhetChange(e, "postnr")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Poststed:</label>
          <input
            type="text"
            value={state.fields.virksomhet.poststed}
            onChange={(e) => handleVirksomhetChange(e, "poststed")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
