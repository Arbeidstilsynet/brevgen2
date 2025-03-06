import { useId } from "react";

const wrapperClasses = {
  text: "",
  checkbox: "flex items-center mr-5",
};

const labeledInputClasses = {
  text: "w-full",
  checkbox: "mr-2 w-5 h-5",
};

interface TextInputProps {
  type?: "text";
  label: string;
  value: string | number;
  checked?: never;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface CheckboxInputProps {
  type: "checkbox";
  label: string;
  value?: never;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type InputProps = TextInputProps | CheckboxInputProps;

export function Input({ type = "text", label, value, checked, onChange }: Readonly<InputProps>) {
  const id = useId();
  return (
    <div className={`mb-4 ${wrapperClasses[type]}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        checked={checked}
        onChange={onChange}
        className={`${labeledInputClasses[type]} p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
      />
    </div>
  );
}
