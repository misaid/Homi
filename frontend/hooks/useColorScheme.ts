import { useThemeController } from "@/context/ThemeContext";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme(): "light" | "dark" | null | undefined {
  const system = useRNColorScheme();
  const { override } = useThemeController();
  if (override === "light" || override === "dark") return override;
  return system;
}
