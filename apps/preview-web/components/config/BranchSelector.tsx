type Props = {
  branches: string[];
  selectedBranch: string;
  onBranchSelect: (branch: string) => void;
};

export function BranchSelector({ branches, selectedBranch, onBranchSelect }: Props) {
  return (
    <select
      className="p-2 border border-gray-300 rounded"
      value={selectedBranch}
      onChange={(e) => onBranchSelect(e.target.value)}
    >
      <option value="" disabled>
        Velg kodegren
      </option>
      {branches.map((branch) => (
        <option key={branch} value={branch}>
          {branch}
        </option>
      ))}
    </select>
  );
}
