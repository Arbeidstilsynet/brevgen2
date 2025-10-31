import { useToast } from "../toast/provider";

export async function saveLocal(md: string) {
  // use native save window in chromium
  if (window.showSaveFilePicker) {
    try {
      const newHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "Markdown Files",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });
      const writableStream = await newHandle.createWritable();
      await writableStream.write(md);
      await writableStream.close();
    } catch (err) {
      const isError = err instanceof Error;
      // silently skip AbortError that occurs if user closes the save window
      if (!isError || (isError && err.name !== "AbortError")) {
        throw err;
      }
    }
  }
  // handle firefox etc.
  else {
    const blob = new Blob([md], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

function getRandomDateString(): string {
  const start = new Date(2000, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getRandomWord(): string {
  const words = ["lorem", "ipsum", "dolor", "sit", "amet"];
  return words[Math.floor(Math.random() * words.length)];
}

function getRandomNumberString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function getRandomBooleanString(): string {
  return Math.random() < 0.5 ? "true" : "false";
}

export function getRandomValue(variableName: string): string {
  const lowerVar = variableName.toLowerCase();
  if (lowerVar.includes("dato") || lowerVar.includes("date")) {
    return getRandomDateString();
  } else if (lowerVar.includes("organisasjonsnummer") || lowerVar.includes("orgnr")) {
    return getRandomNumberString(9);
  } else if (lowerVar.includes("saksnummer") || lowerVar.includes("saksnr")) {
    return `${getRandomNumberString(4)}/${getRandomNumberString(3)}`;
  } else if (lowerVar.includes("nummer") || lowerVar.includes("number")) {
    return getRandomNumberString(Math.floor(Math.random() * 5) + 1);
  } else if (
    lowerVar.startsWith("er") ||
    lowerVar.startsWith("is") ||
    lowerVar.startsWith("har") ||
    lowerVar.startsWith("has")
  ) {
    return getRandomBooleanString();
  } else {
    return getRandomWord();
  }
}

export function getLoadedWorkspaceName(fileName: string): string {
  return `Workspace/${fileName}`;
}

export function getLoadedRepoFileName({
  systemName,
  fileName,
}: {
  systemName: string;
  fileName: string;
}) {
  return `${systemName}/${fileName}`;
}

export interface LastLoadedFile {
  fileName: string;
  tags: Set<string> | null;
}

type SetVarFn = (name: string, value: string) => void;

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

// Accepts direct JSON or serialized/double-escaped JSON like '"{\"abc\":123}"' or '{...}' wrapped in single quotes
export function parsePossiblySerializedJson(raw: string): unknown {
  let text = raw.trim();

  // Strip one layer of full-string quotes
  if (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith('"') && text.endsWith('"') && !looksLikeJson(text))
  ) {
    text = text.slice(1, -1);
  }

  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (typeof parsed === "string") {
        const inner = parsed.trim();
        if (looksLikeJson(inner)) {
          text = inner;
          continue;
        }
        return parsed;
      }
      return parsed;
    } catch {
      if (text.includes('\\"')) {
        text = text.replace(/\\"/g, '"');
        continue;
      }
      break;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isPrimitive(val: unknown): val is string | number | boolean | null {
  return (
    typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null
  );
}

// Apply only top-level keys; ignore arrays and nested objects
function applyTopLevelObjectToVars(obj: unknown, foundMdVars: Set<string>, setMdVar: SetVarFn) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

  let matches = 0;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!foundMdVars.has(k)) continue;
    if (!isPrimitive(v)) continue;
    setMdVar(k, v == null ? "" : String(v));
    matches++;
  }

  return matches;
}

/**
 * Generic function to read text from clipboard with fallback to prompt
 */
export async function readTextFromClipboard(promptMessage: string): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return window.prompt(promptMessage, "") ?? null;
  }
}

/**
 * Generic function to parse JSON from clipboard and filter by allowed keys
 */
export async function parseJsonFromClipboard<T extends Record<string, unknown>>(
  allowedKeys: Set<string>,
  isAllowedKey: (key: string) => key is Extract<keyof T, string>,
  promptMessage: string,
  addToast: ReturnType<typeof useToast>["addToast"],
): Promise<Partial<T> | null> {
  const raw = await readTextFromClipboard(promptMessage);
  if (!raw) {
    addToast("error", "No text provided from clipboard or prompt");
    return null;
  }

  const parsed = parsePossiblySerializedJson(raw);
  if (parsed === undefined) {
    addToast("error", "Failed to parse JSON");
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    addToast("error", "Input JSON must be an object");
    return null;
  }

  const filtered = {} as Record<string, unknown>;
  let keyCount = 0;

  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (allowedKeys.has(key) && isAllowedKey(key)) {
      filtered[key] = value;
      keyCount++;
    }
  }

  if (keyCount === 0) {
    addToast("warning", "No valid options found in provided JSON");
    return null;
  }

  return filtered as Partial<T>;
}

export async function fillVarsFromClipboard(
  foundMdVars: Set<string>,
  setMdVar: SetVarFn,
  addToast: ReturnType<typeof useToast>["addToast"],
) {
  const raw = await readTextFromClipboard(
    "Clipboard access unavailable. Paste JSON here to fill variables.",
  );
  if (!raw) return addToast("error", "No text provided from clipboard or prompt");

  const parsed = parsePossiblySerializedJson(raw);
  if (parsed === undefined) return addToast("error", "Failed to parse JSON");
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return addToast("error", "Input JSON must be an object with top-level key/value pairs");
  }

  const matches = applyTopLevelObjectToVars(parsed, foundMdVars, setMdVar);
  if (matches === 0) {
    addToast("warning", "No matching variables found in provided JSON");
  } else {
    addToast("success", `${matches} variables filled from JSON`);
  }
}
