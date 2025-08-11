import { useThemeController } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): "light" | "dark" | null | undefined {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { override } = useThemeController();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  // If the user explicitly selected a theme, honor it immediately (pre-hydration too)
  if (override === "light" || override === "dark") {
    return override;
  }

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
