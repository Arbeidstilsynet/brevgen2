declare module "*.css";

// https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
var showSaveFilePicker:
  | ((options?: {
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>)
  | undefined;
