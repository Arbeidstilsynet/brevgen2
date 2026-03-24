import { type AppSettings, useSettings } from "./settingsProvider";

function getTypedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

type SettingsData = Record<
  keyof AppSettings["advancedFeatures"],
  { name: string; description: string }
>;

const settingsData = {
  htmlRemoteTab: {
    name: "HTML (Remote)",
    description: "Aktiverer fanen for HTML-generering via API",
  },
  customizePdfOptions: {
    name: "PDF options",
    description: "Aktiverer muligheten til å tilpasse PDFOptions i payload",
  },
} as const satisfies SettingsData;

export function Settings() {
  const { settings, setAdvancedFeature } = useSettings();

  return (
    <>
      <h2 className="text-xl font-semibold">Innstillinger</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Avanserte funksjoner</h3>

        {getTypedEntries(settingsData).map(([key, data]) => (
          <SettingsEntry
            key={key}
            name={data.name}
            description={data.description}
            enabled={settings.advancedFeatures[key]}
            onToggle={() => setAdvancedFeature(key, !settings.advancedFeatures[key])}
          />
        ))}
      </div>
    </>
  );
}

function SettingsEntry({
  name,
  description,
  enabled,
  onToggle,
}: {
  name: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          aria-label={name}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </label>
    </div>
  );
}
