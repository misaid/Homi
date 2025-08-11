import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

export type ThemeOverride = "system" | "light" | "dark";

type ThemeContextValue = {
  override: ThemeOverride;
  setOverride: (v: ThemeOverride) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "APP_THEME_OVERRIDE";

async function loadStoredOverride(): Promise<ThemeOverride | null> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const v = window.localStorage?.getItem(STORAGE_KEY);
      return (v as ThemeOverride) || null;
    }
    const v = await SecureStore.getItemAsync(STORAGE_KEY);
    return (v as ThemeOverride) || null;
  } catch {
    return null;
  }
}

async function saveStoredOverride(v: ThemeOverride): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage?.setItem(STORAGE_KEY, v);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, v);
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverrideState] = useState<ThemeOverride>("light");

  useEffect(() => {
    loadStoredOverride().then((v) => {
      if (v === "light" || v === "dark" || v === "system") {
        setOverrideState(v);
      }
    });
  }, []);

  const setOverride = useCallback((v: ThemeOverride) => {
    setOverrideState(v);
    saveStoredOverride(v);
  }, []);

  const value = useMemo(
    () => ({ override, setOverride }),
    [override, setOverride]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeController(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Provide a no-provider fallback to avoid crashes; acts as system-only
    return {
      override: "system",
      setOverride: () => {},
    };
  }
  return ctx;
}
