import { fetchManyFileContentFromAzure } from "@/actions/azdo";
import { fetchManyFileContentFromGitHub } from "@/actions/github";
import { findMdVariables } from "@at/dynamic-markdown";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TabButton } from "../buttons";
import type { RepoWithName } from "./allowedRepos";
import { useGetMarkdownFilesInfo } from "./useGetMarkdownFilesInfo";

type Props = Readonly<{
  repoWithName: RepoWithName;
  branch: string;
}>;

export function VariablesReport({ repoWithName, branch }: Props) {
  const [viewMode, setViewMode] = useState<"counts" | "perFile">("counts");

  const { data, isLoading } = useGetMarkdownFilesInfo(repoWithName, branch);

  const { data: variablesReport, isLoading: reportLoading } = useQuery({
    queryKey: [
      "variablesReport",
      repoWithName.provider,
      repoWithName.repo.name,
      branch,
      repoWithName.prettyName,
    ],
    queryFn: async () => {
      const filePaths = data!.map((file) => file.path);
      let files: { filePath: string; content: string }[];

      if (repoWithName.provider === "azdo") {
        files = await fetchManyFileContentFromAzure(repoWithName.repoInfo.id, branch, filePaths);
      } else {
        files = await fetchManyFileContentFromGitHub(repoWithName.repo.name, branch, filePaths);
      }

      if (!files.length) {
        console.warn("No files found", { repo: repoWithName.repo.name, branch, filePaths, files });
      }

      return files.reduce(
        (report, content) => {
          try {
            report[content.filePath] = findMdVariables(content.content);
          } catch (error) {
            console.error(`Failed to parse file ${content.filePath}`, error);
          }
          return report;
        },
        {} as Record<string, Set<string>>,
      );
    },
    enabled: data && data.length > 0,
  });

  if (isLoading || reportLoading) {
    return <div>Laster...</div>;
  }

  if (!variablesReport || Object.keys(variablesReport).length === 0) {
    return <div>Ingen variabler funnet</div>;
  }

  const variableCounts = Object.values(variablesReport).reduce(
    (acc, variables) => {
      for (const variable of variables) {
        acc[variable] = (acc[variable] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-4 bg-white rounded-sm shadow-sm">
      <div className="flex mb-4 gap-2">
        <TabButton isActive={viewMode === "counts"} onClick={() => setViewMode("counts")}>
          Sum
        </TabButton>
        <TabButton isActive={viewMode === "perFile"} onClick={() => setViewMode("perFile")}>
          Per innholdsmal
        </TabButton>
      </div>

      {viewMode === "counts" && (
        <div>
          <ul className="list-disc list-inside">
            {Object.entries(variableCounts)
              .toSorted((a, b) => b[1] - a[1])
              .map(([variable, count]) => (
                <li key={variable} className="mb-1">
                  <span className="font-medium">{variable}</span>: {count}
                </li>
              ))}
          </ul>
        </div>
      )}

      {viewMode === "perFile" && (
        <div>
          {Object.entries(variablesReport).map(([filePath, variables]) => (
            <div key={filePath} className="mb-4">
              <h5 className="text-md font-semibold mb-1">{filePath}</h5>
              <ul className="list-disc list-inside pl-4">
                {Array.from(variables).map((variable) => (
                  <li key={variable} className="mb-1">
                    <span className="font-medium">{variable}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
