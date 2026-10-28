import { GenerateDocumentRequest } from "@repo/shared-types";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

function getUserContext(user: unknown) {
  if (!isRecord(user)) return undefined;
  const { oid, azp, tid } = user;
  if (!oid && !azp && !tid) return undefined;
  return { oid, azp, tid };
}

export function buildGenerateDocumentRequestContext(body: GenerateDocumentRequest, user: unknown) {
  return {
    inputSummary: {
      mdLength: body.md.length,
      mdVariableCount: Object.keys(body.mdVariables ?? {}).length,

      // explicit null (not allowed by schema) instead of omitted undefined, for the sake of easier log querying
      template: body.options.dynamic.template ?? null,
      asHtml: body.options.as_html ?? null,
      documentTitle: body.options.document_title ?? null,
    },
    user: getUserContext(user),
  };
}
