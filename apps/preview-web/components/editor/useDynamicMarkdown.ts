import { findMdVariables, parseDynamicMd } from "@at/dynamic-markdown";
import { useReducer } from "react";

type MdVars = Record<string, string | boolean>;

type State = {
  md: string;
  parsedMd: string;
  parseError: Error | null;
  mdVars: MdVars;
  // workaround to preserve values while removing and adding back variables
  foundMdVars: Set<string>;
  mdVarsTypes: { [key: string]: "string" | "boolean" };
};

type Action =
  | { type: "SET_MD"; payload: string }
  | { type: "SET_MD_VAR"; payload: { mdVar: string; value: string | boolean } }
  | {
      type: "PARSE_MD";
      payload: { md: string; mdVars: MdVars };
    };

const getInitialState = ({
  initialMd,
  initialVars,
}: {
  initialMd: string;
  initialVars: MdVars;
}): State => ({
  md: initialMd,
  parsedMd: parseDynamicMd(initialMd, { variables: initialVars }),
  parseError: null,
  mdVars: initialVars,
  foundMdVars: findMdVariables(initialMd),
  mdVarsTypes: generateMdVarTypes(initialVars),
});

function getMdVarTypes(state: State, foundVariables: Set<string>) {
  const mdVarTypes = { ...state.mdVarsTypes };
  foundVariables.forEach((variable) => {
    if (!mdVarTypes[variable]) {
      mdVarTypes[variable] = "string";
    }
  });
  return mdVarTypes;
}

function generateMdVarTypes(vars: Record<string, string | boolean>) {
  const types: Record<string, "string" | "boolean"> = {};
  for (const key in vars) {
    types[key] = typeof vars[key] as "string" | "boolean";
  }
  return types;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MD":
      return reducer(state, {
        type: "PARSE_MD",
        payload: { md: action.payload, mdVars: state.mdVars },
      });
    case "SET_MD_VAR":
      return reducer(state, {
        type: "PARSE_MD",
        payload: {
          md: state.md,
          mdVars: { ...state.mdVars, [action.payload.mdVar]: action.payload.value },
        },
      });
    case "PARSE_MD": {
      const { md, mdVars } = action.payload;
      const newState = { ...state, md, mdVars };

      try {
        newState.foundMdVars = findMdVariables(md);
        newState.mdVarsTypes = getMdVarTypes(newState, newState.foundMdVars);
        const parsedMd = parseDynamicMd(md, { variables: mdVars });

        return {
          ...newState,
          parsedMd,
          parseError: null,
        };
      } catch (error) {
        if (error instanceof Error) {
          return { ...newState, parseError: error };
        } else {
          throw error;
        }
      }
    }
    default:
      return state;
  }
}

export function useDynamicMarkdown(initialMd: string, initialVars: MdVars) {
  const [state, dispatch] = useReducer(reducer, { initialMd, initialVars }, getInitialState);

  const setMd = (md: string) => {
    dispatch({ type: "SET_MD", payload: md });
  };

  const setMdVar = (mdVar: string, value: string | boolean) => {
    if (mdVar.startsWith("!")) mdVar = mdVar.slice(1); // handle negation
    dispatch({ type: "SET_MD_VAR", payload: { mdVar, value } });
  };

  const parse = (md: string, mdVars: MdVars) => {
    dispatch({ type: "PARSE_MD", payload: { md, mdVars } });
  };

  return {
    ...state,
    setMd,
    setMdVar,
    parse,
  };
}
