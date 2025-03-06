import { useToast } from "@/components/toast/provider";
import { useMonaco } from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";

const APERTIUM_API = "https://beta.apertium.org/apy/translate";
const LANGPAIR_NYNORSK_E = "nob|nno_e";

interface ApertiumResponse {
  responseData: {
    translatedText: string;
  };
  responseDetails: null;
  responseStatus: number;
}

interface ApertumErrorResponse {
  status: string;
  code: number;
  message: string;
  explanation: string;
}

const isError = (data: ApertiumResponse | ApertumErrorResponse): data is ApertumErrorResponse => {
  return (data as ApertumErrorResponse).status !== undefined;
};

export function useApertium(
  monaco: ReturnType<typeof useMonaco>,
  onTranslate: (fullEditorText: string) => void,
) {
  const { addToast, clearToast } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (text: string) => {
      clearToast();

      const res = await fetch(
        `${APERTIUM_API}?langpair=${LANGPAIR_NYNORSK_E}&q=${encodeURIComponent(text)}`,
      );
      const data = (await res.json()) as ApertiumResponse | ApertumErrorResponse;

      if (isError(data)) {
        throw new TypeError(JSON.stringify(data));
      }

      const translated = data.responseData.translatedText;
      if (!translated) {
        throw new TypeError("Translated text is empty, try a different selection");
      }
      if (translated.length < text.length / 2) {
        throw new TypeError("Translated text seems cut off, try a different selection");
      }

      return data;
    },
    onSuccess: () => {
      addToast("success", "Selected text translated");
    },
    onError: (error) => {
      addToast("error", error.message, 10_000);
    },
  });

  const handleTranslateSelection = async () => {
    if (!monaco || isPending) return;

    const editor = monaco.editor.getEditors()[0];
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const selectedText = editor.getModel()?.getValueInRange(selection);
    if (!selectedText?.trim()) return addToast("warning", "No text selected");

    const res = await mutateAsync(selectedText);
    const translatedText = res.responseData.translatedText;

    // Replace selected text with translated text
    editor.executeEdits("translation", [
      {
        range: selection,
        text: translatedText,
        forceMoveMarkers: true,
      },
    ]);

    onTranslate(editor.getValue());
  };

  return {
    handleTranslateSelection,
    isApertiumPending: isPending,
  };
}
