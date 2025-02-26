import { defaultTemplate } from "@at/document-templates";

type DefaultTemplateArgs = defaultTemplate.DefaultTemplateArgs;
type DefaultTemplateFields = defaultTemplate.DefaultTemplateFields;
type Language = defaultTemplate.DefaultTemplateArgs["language"];
type SignatureVariant = defaultTemplate.DefaultTemplateArgs["signatureVariant"];

interface FieldsAction {
  type: "UPDATE_FIELD";
  field: Exclude<keyof DefaultTemplateFields, "erUnntattOffentlighet">;
  value: string | number;
}

interface BooleanFieldsAction {
  type: "TOGGLE_FIELD";
  field: Extract<keyof DefaultTemplateFields, "erUnntattOffentlighet">;
  value: boolean;
}

interface VirksomhetAction {
  type: "UPDATE_VIRKSOMHET";
  field: keyof DefaultTemplateFields["virksomhet"];
  value: string | number;
}

interface LanguageAction {
  type: "UPDATE_LANGUAGE";
  value: Language;
}

interface SignatureVariantAction {
  type: "UPDATE_SIGNATURE_VARIANT";
  value: SignatureVariant;
}

export type DefaultTemplateArgsAction =
  | FieldsAction
  | BooleanFieldsAction
  | VirksomhetAction
  | LanguageAction
  | SignatureVariantAction;

export function defaultTemplateReducer(
  state: DefaultTemplateArgs,
  action: DefaultTemplateArgsAction,
): DefaultTemplateArgs {
  switch (action.type) {
    case "UPDATE_FIELD":
    case "TOGGLE_FIELD":
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: action.value,
        },
      };
    case "UPDATE_VIRKSOMHET":
      return {
        ...state,
        fields: {
          ...state.fields,
          virksomhet: {
            ...state.fields.virksomhet,
            [action.field]: action.value,
          },
        },
      };
    case "UPDATE_LANGUAGE":
      return {
        ...state,
        language: action.value,
      };
    case "UPDATE_SIGNATURE_VARIANT":
      return {
        ...state,
        signatureVariant: action.value,
      };
  }
}
