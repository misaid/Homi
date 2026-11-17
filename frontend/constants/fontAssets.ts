// Native font files, one family name per weight. The web build resolves
// fontAssets.web.ts instead and loads the same face from Google Fonts.
export const fontAssets: Record<string, number> = {
  HankenGrotesk_400Regular: require("@expo-google-fonts/hanken-grotesk/400Regular/HankenGrotesk_400Regular.ttf"),
  HankenGrotesk_500Medium: require("@expo-google-fonts/hanken-grotesk/500Medium/HankenGrotesk_500Medium.ttf"),
  HankenGrotesk_600SemiBold: require("@expo-google-fonts/hanken-grotesk/600SemiBold/HankenGrotesk_600SemiBold.ttf"),
  HankenGrotesk_700Bold: require("@expo-google-fonts/hanken-grotesk/700Bold/HankenGrotesk_700Bold.ttf"),
  HankenGrotesk_800ExtraBold: require("@expo-google-fonts/hanken-grotesk/800ExtraBold/HankenGrotesk_800ExtraBold.ttf"),
};
