import { useSettings } from "./settingsProvider";

export function Settings() {
  const { settings, setAdvancedFeature } = useSettings();

  return (
    <>
      <h2 className="text-xl font-semibold">Innstillinger</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Avanserte funksjoner</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.advancedFeatures.htmlRemoteTab}
              onChange={() =>
                setAdvancedFeature("htmlRemoteTab", !settings.advancedFeatures.htmlRemoteTab)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium">HTML (Remote)</div>
              <div className="text-sm text-gray-600">
                Aktiverer fanen for HTML-generering via API
              </div>
            </div>
          </label>
        </div>
      </div>
    </>
  );
}
