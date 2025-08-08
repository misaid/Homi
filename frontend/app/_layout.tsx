// app/_layout.tsx
import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useColorScheme } from "../hooks/useColorScheme";

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
};

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  const colorScheme = useColorScheme();

  const pk = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk) console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");

  const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const barStyle = colorScheme === "dark" ? "light" : "dark";

  return (
    <ClerkProvider publishableKey={pk ?? ""} tokenCache={tokenCache}>
      <QueryClientProvider client={qc}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={barStyle} />
          <Slot />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
