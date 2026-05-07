import { type ComboboxOption, SelectCombobox } from "../SelectCombobox";

type Props = Readonly<{
  branches: string[];
  selectedBranch: string;
  onBranchSelect: (branch: string) => void;
}>;

export function BranchSelector({ branches, selectedBranch, onBranchSelect }: Props) {
  const options: ComboboxOption[] = branches.map((b) => ({ value: b, label: b }));

  return (
    <SelectCombobox
      label="Kodegren"
      options={options}
      value={selectedBranch}
      onChange={onBranchSelect}
      placeholder="Velg kodegren"
    />
  );
}
