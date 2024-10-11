const templateOptions = ["default", "custom"] as const;
export type TemplateOption = (typeof templateOptions)[number];

type Props = Readonly<{
  selectedTemplate: TemplateOption;
  setSelectedTemplate: (template: TemplateOption) => void;
}>;

export function TemplatePicker({ selectedTemplate, setSelectedTemplate }: Props) {
  return (
    <>
      <label htmlFor="template-select" className="mr-2">
        Template:
      </label>
      <select
        id="template-select"
        value={selectedTemplate}
        onChange={(event) => setSelectedTemplate(event.target.value as TemplateOption)}
        className="p-2 bg-white border border-gray-300 rounded"
      >
        {templateOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </>
  );
}
