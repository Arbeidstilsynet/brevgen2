import { createContext } from "react";

type WorkspaceContextValue = Readonly<{
  currentMd: string;
  onLoadMd: (md: string) => void;
}>;

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  currentMd: "",
  onLoadMd: () => console.error("WorkspaceContext not provided"),
});
