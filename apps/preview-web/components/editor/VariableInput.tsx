type Props = Readonly<{
  variable: string;
  varTypes: { [key: string]: "string" | "boolean" };
  mdVars: Record<string, string | boolean | undefined>;
  handleVarInputChange: (variable: string, value: string | boolean) => void;
  handleVarTypeToggle: (variable: string) => void;
}>;

export function VariableInput({
  variable,
  varTypes,
  mdVars,
  handleVarInputChange,
  handleVarTypeToggle,
}: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <label className="flex-grow">{variable}</label>
        <button
          onClick={() => handleVarTypeToggle(variable)}
          className="ml-2 p-1 bg-gray-300 rounded"
        >
          Switch type
        </button>
      </div>
      {varTypes[variable] === "boolean" ? (
        <div>
          <input
            type="checkbox"
            checked={(mdVars[variable] ?? false) as boolean}
            onChange={(e) => handleVarInputChange(variable, e.target.checked)}
            className="mr-2"
          />
        </div>
      ) : (
        <div>
          <textarea
            value={(mdVars[variable] ?? "") as string}
            onChange={(e) => handleVarInputChange(variable, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      )}
    </div>
  );
}
