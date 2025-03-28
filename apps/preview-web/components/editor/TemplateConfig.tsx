import { defaultTemplate, TemplateOption } from "@at/document-templates";
import { Dispatch } from "react";
import { Select } from "../Select";
import { TemplateConfigDefaultForm } from "./TemplateConfigDefaultForm";
import { DefaultTemplateArgsAction } from "./templateConfigReducer";

type Props = Readonly<{
  selectedTemplate: TemplateOption;
  setSelectedTemplate: (template: TemplateOption) => void;
  defaultTemplateState: defaultTemplate.DefaultTemplateArgs;
  defaultTemplateDispatch: Dispatch<DefaultTemplateArgsAction>;
}>;

export function TemplateConfig({
  selectedTemplate,
  setSelectedTemplate,
  defaultTemplateState,
  defaultTemplateDispatch,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          className="flex items-center gap-2"
          label="Template"
          value={selectedTemplate}
          options={{ default: "Default", blank: "Blank", custom: "Custom" }}
          onChange={setSelectedTemplate}
        />

        <div className="relative group">
          <span className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full cursor-pointer font-bold text-lg">
            ?
          </span>
          <div className="absolute left-0 w-48 p-2 mt-2 text-sm text-white bg-gray-800 rounded-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
            Velg en dokumentmal for forhåndsvisning.
            <br />
            <br />
            Dokumentmalen er alt bortsett fra innholdet i brevet: logo, adressefelt, signatur,
            bunntekst.
            <br />
            <br />
            Alternativer for standardmalen vises nedenfor når den er valgt. Disse valgene vil settes
            av fagsystemet når den benytter brevgeneratoren, men du kan endre på eksempelverdiene
            her for å se ulike varianter av det genererte brevet.
            <br />
            <br />
            Ytterligere maler:
            <br />
            Blank - ingen innhold, men standard styling.
            <br />
            Custom - ingen innhold, minimal styling. For testing eller avansert bruk.
          </div>
        </div>
      </div>
      {selectedTemplate === "default" && (
        <TemplateConfigDefaultForm
          state={defaultTemplateState}
          dispatch={defaultTemplateDispatch}
        />
      )}
    </>
  );
}
