import { createContext, use, useEffect, useState } from "react";

export interface AppSettings {
  advancedFeatures: {
    htmlRemoteTab: boolean;
    customizePdfOptions: boolean;
  };
}

interface AppSettingsContext {
  settings: AppSettings;
  setAdvancedFeature: (feature: keyof AppSettings["advancedFeatures"], enabled: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  advancedFeatures: {
    htmlRemoteTab: false,
    customizePdfOptions: false,
  },
};

const SETTINGS_KEY = "brevgenerator-settings";

function getSettings(): AppSettings {
  if (globalThis.window === undefined) {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as AppSettings;
    // Merge with defaults to handle new settings being added
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      advancedFeatures: {
        ...DEFAULT_SETTINGS.advancedFeatures,
        ...parsed.advancedFeatures,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function updateSettings(newSettings: AppSettings): void {
  if (globalThis === undefined) {
    return;
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
}

function resetSettings(): void {
  if (globalThis.window === undefined) {
    return;
  }

  localStorage.removeItem(SETTINGS_KEY);
}

const SettingsContext = createContext<AppSettingsContext>({
  settings: DEFAULT_SETTINGS,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAdvancedFeature: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resetSettings: () => {},
});
export const useSettings = () => use(SettingsContext);

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load settings on mount to prevent hydration issues with useState initializer function
    // oxlint-disable-next-line react-hooks-extra/set-state-in-effect
    setSettings(getSettings());
  }, []);

  const setAdvancedFeature = (feature: keyof AppSettings["advancedFeatures"], enabled: boolean) => {
    const newSettings = {
      ...settings,
      advancedFeatures: {
        ...settings.advancedFeatures,
        [feature]: enabled,
      },
    };

    updateSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <SettingsContext
      value={{
        settings,
        setAdvancedFeature,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext>
  );
}
