// Homi design tokens: one palette, one spacing scale, one radius scale, two shadows.
// Light palette only (the Appearance switch was removed; dark is not reachable today).
import { Platform, type ViewStyle } from "react-native";

export const palette = {
  ink: "#1b1840",
  inkSoft: "#4a4670",
  muted: "#6b6890",
  faint: "#8d8aab",
  chevron: "#c9c5e3",
  page: "#f6f5fc",
  card: "#ffffff",
  field: "#f1effb",
  wash: "#ece9fb",
  washDeep: "#d9d4f6",
  border: "#e6e3f5",
  grid: "#efedf9",
  tint: "#5b4fe0",
  tintDark: "#4338c4",
  white: "#ffffff",
  backdrop: "rgba(27,24,64,0.45)",
} as const;

export type StatusTone = "danger" | "warn" | "ok" | "info" | "neutral";

export const status: Record<StatusTone, { fg: string; bg: string }> = {
  danger: { fg: "#b42318", bg: "#fde8e6" },
  warn: { fg: "#93590a", bg: "#fdf1d3" },
  ok: { fg: "#17694a", bg: "#dff5ea" },
  info: { fg: "#4338c4", bg: "#ece9fb" },
  neutral: { fg: "#4a4670", bg: "#f1effb" },
};

export const dangerBorder = "#f3c9c4";

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const gutter = 16;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const shadow = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: "0 4px 14px -6px rgba(27,24,64,0.12)" } as ViewStyle,
    default: {
      shadowColor: "#1b1840",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  }) as ViewStyle,
  float: Platform.select<ViewStyle>({
    web: { boxShadow: "0 10px 24px -8px rgba(27,24,64,0.35)" } as ViewStyle,
    default: {
      shadowColor: "#1b1840",
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  }) as ViewStyle,
};

/** Avatar tints, picked by hashing the name. */
export const avatarTints = ["#ece9fb", "#dff5ea", "#fdf1d3", "#fde8e6", "#e3eefc"] as const;
