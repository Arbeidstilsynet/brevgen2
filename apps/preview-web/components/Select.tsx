import { useId } from "react";

type TValue = string | number;

interface SelectProps<T extends TValue> {
  className?: string;
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}

export function Select<T extends TValue>({
  className = "mb-4",
  label,
  value,
  options,
  onChange,
}: Readonly<SelectProps<T>>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id="default-form-language"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500"
      >
        {(Object.entries(options) as [T, string][]).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
