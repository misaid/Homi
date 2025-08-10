// app/_layout.tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "../hooks/useColorScheme";

// Keep splash until auth state is known
void SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
};

function AppShell() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { isSignedIn, isLoaded } = useAuth();
  const didHide = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!navState?.key) return;

    const inAuthGroup = segments?.[0] === "(auth)";
    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/home");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }

    (async () => {
      if (!didHide.current) {
        await Promise.resolve();
        try {
          await SplashScreen.hideAsync();
        } catch {}
        didHide.current = true;
      }
    })();
  }, [isLoaded, isSignedIn, navState?.key, segments, router]);

  if (!isLoaded) return null;

  return <Slot />;
}

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  const colorScheme = useColorScheme();

  const pk = Constants.expoConfig?.extra?.["CLERK_PUBLISHABLE_KEY"] as
    | string
    | undefined;
  if (!pk)
    console.warn("Missing CLERK_PUBLISHABLE_KEY in Constants.expoConfig.extra");

  const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const barStyle = colorScheme === "dark" ? "light" : "dark";

  return (
    <ClerkProvider publishableKey={pk ?? ""} tokenCache={tokenCache}>
      <QueryClientProvider client={qc}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={barStyle} />
          <AppShell />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
