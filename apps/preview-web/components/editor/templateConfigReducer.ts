import type {
  DefaultTemplateArgs,
  DefaultTemplateFields,
  DefaultTemplateSignatureVariant,
  DirektoratTemplateArgs,
  DirektoratTemplateFields,
  DirektoratTemplateSignatureVariant,
  TemplateLanguage,
} from "@repo/shared-types";

interface LanguageAction {
  type: "UPDATE_LANGUAGE";
  value: TemplateLanguage;
}

interface DefaultFieldsAction {
  type: "UPDATE_FIELD";
  field: Exclude<keyof DefaultTemplateFields, "erUnntattOffentlighet">;
  value: string | number;
}

interface DefaultBooleanFieldsAction {
  type: "TOGGLE_FIELD";
  field: Extract<keyof DefaultTemplateFields, "erUnntattOffentlighet">;
  value: boolean;
}

interface DefaultVirksomhetAction {
  type: "UPDATE_VIRKSOMHET";
  field: keyof DefaultTemplateFields["virksomhet"];
  value: string | number;
}

interface DefaultTemplateSignatureVariantAction {
  type: "UPDATE_SIGNATURE_VARIANT";
  value: DefaultTemplateSignatureVariant;
}

interface DirektoratFieldsAction {
  type: "UPDATE_FIELD";
  field: keyof DirektoratTemplateFields;
  value: string | number;
}

interface DirektoratMottakerAction {
  type: "UPDATE_MOTTAKER";
  field: keyof Required<NonNullable<DirektoratTemplateFields["mottaker"]>>;
  value: string | number;
}

interface DirektoratTemplateSignatureVariantAction {
  type: "UPDATE_SIGNATURE_VARIANT";
  value: DirektoratTemplateSignatureVariant;
}

export type DefaultTemplateArgsAction =
  | LanguageAction
  | DefaultFieldsAction
  | DefaultBooleanFieldsAction
  | DefaultVirksomhetAction
  | DefaultTemplateSignatureVariantAction;

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

type MottakerOf<T> = T extends { fields: { mottaker?: infer M } } ? M : never;

type WithRequiredMottaker<T extends { fields: unknown }> = Omit<T, "fields"> & {
  fields: Omit<T["fields"] & Record<string, unknown>, "mottaker"> & {
    mottaker: Required<NonNullable<MottakerOf<T>>>;
  };
};

export type DirektoratTemplateArgsAction =
  | LanguageAction
  | DirektoratFieldsAction
  | DirektoratMottakerAction
  | DirektoratTemplateSignatureVariantAction;

export function direktoratTemplateReducer(
  state: WithRequiredMottaker<DirektoratTemplateArgs>,
  action: DirektoratTemplateArgsAction,
): WithRequiredMottaker<DirektoratTemplateArgs> {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: action.value,
        },
      };
    case "UPDATE_MOTTAKER":
      return {
        ...state,
        fields: {
          ...state.fields,
          mottaker: {
            ...state.fields.mottaker,
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
