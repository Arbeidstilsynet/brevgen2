import { useMemo } from "react";
import { type ComboboxOption, SelectCombobox } from "../SelectCombobox";

type Props = Readonly<{
  branches: string[];
  selectedBranch: string;
  onBranchSelect: (branch: string) => void;
}>;

export function BranchSelector({ branches, selectedBranch, onBranchSelect }: Props) {
  const options: ComboboxOption[] = useMemo(
    () => branches.map((b) => ({ value: b, label: b })),
    [branches],
  );

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
