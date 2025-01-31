import { AzureDevOpsRepo, fetchManyFileContentFromAzure } from "@/actions/azdo";
import { findMdVariables } from "@at/dynamic-markdown";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useGetMarkdownFilesInfo } from "./useGetMarkdownFilesInfo";

type Props = Readonly<{
  repo: AzureDevOpsRepo;
  branch: string;
}>;

export function VariablesReport({ repo, branch }: Props) {
  const [viewMode, setViewMode] = useState<"counts" | "perFile">("counts");

  const { data, isLoading } = useGetMarkdownFilesInfo(repo, branch);

  const { data: variablesReport, isLoading: reportLoading } = useQuery({
    queryKey: ["variablesReport", repo.id, branch],
    queryFn: async () => {
      const filePaths = data!.map((file) => file.path);
      const files = await fetchManyFileContentFromAzure(repo.id, branch, filePaths);

      if (!files.length) {
        console.warn("No files found", { repo: repo.id, branch, filePaths, files });
      }

      const report: Record<string, Set<string>> = files.reduce(
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
      return report;
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
    <div className="p-4 bg-white rounded shadow">
      <div className="flex space-x-4 mb-4">
        <button
          className={`py-2 px-4 ${viewMode === "counts" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-800"} rounded`}
          onClick={() => setViewMode("counts")}
        >
          Sum
        </button>
        <button
          className={`py-2 px-4 ${viewMode === "perFile" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-800"} rounded`}
          onClick={() => setViewMode("perFile")}
        >
          Per brevmal
        </button>
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
