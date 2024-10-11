import { defaultTemplate } from "@at/document-templates";
import { Dispatch } from "react";
import { TemplateConfigDefaultForm } from "./TemplateConfigDefaultForm";
import { DefaultTemplateArgsAction } from "./templateConfigReducer";
import { TemplateOption, TemplatePicker } from "./TemplatePicker";

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
      <TemplatePicker
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
      {selectedTemplate === "default" && (
        <TemplateConfigDefaultForm
          state={defaultTemplateState}
          dispatch={defaultTemplateDispatch}
        />
      )}
    </>
  );
}
