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
    field: Exclude<keyof defaultTemplate.DefaultTemplateFields, "erUnntattOffentlighet">,
  ) => {
    dispatch({
      type: "UPDATE_FIELD",
      field,
      value: e.target.value,
    });
  };

  const handleBooleanFieldChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: Extract<keyof defaultTemplate.DefaultTemplateFields, "erUnntattOffentlighet">,
  ) => {
    dispatch({
      type: "TOGGLE_FIELD",
      field,
      value: e.target.checked,
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
        <label htmlFor="default-form-language" className="block text-sm font-medium text-gray-700">
          Språk
        </label>
        <select
          id="default-form-language"
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
        <label
          htmlFor="default-form-signature-variant"
          className="block text-sm font-medium text-gray-700"
        >
          Signaturvariant
        </label>
        <select
          id="default-form-signature-variant"
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
          <option value="usignert">usignert</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="default-form-dato" className="block text-sm font-medium text-gray-700">
          Dato
        </label>
        <input
          id="default-form-dato"
          type="text"
          value={state.fields.dato}
          onChange={(e) => handleFieldChange(e, "dato")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="default-form-saksnummer"
          className="block text-sm font-medium text-gray-700"
        >
          Saksnummer
        </label>
        <input
          id="default-form-saksnummer"
          type="text"
          value={state.fields.saksnummer}
          onChange={(e) => handleFieldChange(e, "saksnummer")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="default-form-deres-dato"
          className="block text-sm font-medium text-gray-700"
        >
          Deres dato
        </label>
        <input
          id="default-form-deres-dato"
          type="text"
          value={state.fields.deresDato}
          onChange={(e) => handleFieldChange(e, "deresDato")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="default-form-deres-referanse"
          className="block text-sm font-medium text-gray-700"
        >
          Deres referanse
        </label>
        <input
          id="default-form-deres-referanse"
          type="text"
          value={state.fields.deresReferanse}
          onChange={(e) => handleFieldChange(e, "deresReferanse")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="default-form-saksbehandlernavn"
          className="block text-sm font-medium text-gray-700"
        >
          Saksbehandlernavn
        </label>
        <input
          id="default-form-saksbehandlernavn"
          type="text"
          value={state.fields.saksbehandlerNavn}
          onChange={(e) => handleFieldChange(e, "saksbehandlerNavn")}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4 flex items-center">
        <label
          htmlFor="default-form-unntatt-offentlighet"
          className="block text-sm font-medium text-gray-700 mr-2"
        >
          Unntatt offentlighet
        </label>
        <input
          id="default-form-unntatt-offentlighet"
          type="checkbox"
          checked={state.fields.erUnntattOffentlighet}
          onChange={(e) => handleBooleanFieldChange(e, "erUnntattOffentlighet")}
          className="w-4 h-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-4">Virksomhet</h3>
        <div className="mb-4">
          <label
            htmlFor="default-form-virksomhet-navn"
            className="block text-sm font-medium text-gray-700"
          >
            Navn
          </label>
          <input
            id="default-form-virksomhet-navn"
            type="text"
            value={state.fields.virksomhet.navn}
            onChange={(e) => handleVirksomhetChange(e, "navn")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="default-form-virksomhet-adresse"
            className="block text-sm font-medium text-gray-700"
          >
            Adresse
          </label>
          <input
            id="default-form-virksomhet-adresse"
            type="text"
            value={state.fields.virksomhet.adresse}
            onChange={(e) => handleVirksomhetChange(e, "adresse")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="default-form-virksomhet-postnr"
            className="block text-sm font-medium text-gray-700"
          >
            Postnr
          </label>
          <input
            id="default-form-virksomhet-postnr"
            type="text"
            value={state.fields.virksomhet.postnr}
            onChange={(e) => handleVirksomhetChange(e, "postnr")}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="default-form-virksomhet-poststed"
            className="block text-sm font-medium text-gray-700"
          >
            Poststed
          </label>
          <input
            id="default-form-virksomhet-poststed"
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
