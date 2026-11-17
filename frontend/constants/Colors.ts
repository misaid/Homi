/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#5b4fe0";
const tintColorDark = "#a79cff";

export const Colors = {
  light: {
    text: "#1b1840",
    background: "#fff",
    pageBackground: "#f6f5fc",
    tint: tintColorLight,
    icon: "#6b6890",
    tabIconDefault: "#6b6890",
    tabIconSelected: tintColorLight,
    card: "#ffffff",
    border: "#e6e3f5",
    mutedText: "#6b6890",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    pageBackground: "#0f172a",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    card: "#0b1220",
    border: "#334155",
    mutedText: "#9CA3AF",
  },
};
