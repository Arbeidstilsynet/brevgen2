type Props = Readonly<{
  variable: string;
  varType: "string" | "boolean";
  value: string | boolean | undefined;
  handleVarInputChange: (variable: string, value: string | boolean) => void;
}>;

export function VariableInput({ variable, varType, value, handleVarInputChange }: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <label className="flex-grow">{variable}</label>
      </div>
      {varType === "boolean" ? (
        <div>
          <input
            type="checkbox"
            checked={(value ?? false) as boolean}
            onChange={(e) => handleVarInputChange(variable, e.target.checked)}
            className="mr-2"
          />
        </div>
      ) : (
        <div>
          <textarea
            value={(value ?? "") as string}
            onChange={(e) => handleVarInputChange(variable, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      )}
    </div>
  );
}
