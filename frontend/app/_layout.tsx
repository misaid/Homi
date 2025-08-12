// app/_layout.tsx
import { Colors } from "@/constants/Colors";
import { ThemeProvider as AppThemeProvider } from "@/context/ThemeContext";
import { useRegisterPushToken } from "@/hooks/useRegisterPushToken";
import { qk } from "@/lib/queryKeys";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
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
import { Platform } from "react-native";
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
  const responseSub = useRef<Notifications.Subscription | null>(null);
  const receiveSub = useRef<Notifications.Subscription | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoaded) return;
    if (!navState?.key) return;

    const inAuthGroup = segments?.[0] === "(auth)";
    const inMarketingGroup = segments?.[0] === "(marketing)";
    const atRoot = !segments || segments.length === 0;

    if (Platform.OS === "web") {
      // On web, only handle the root path. Let each route group guard itself
      // to avoid flicker and unnecessary replaces while navigating between
      // public marketing pages and authed app pages.
      if (atRoot) {
        router.replace(isSignedIn ? "/(tabs)/home" : "/(marketing)");
      }
    } else {
      if (isSignedIn && inAuthGroup) {
        router.replace("/(tabs)/home");
      } else if (!isSignedIn && !inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
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

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.push("/notifications");
      }
    );
    receiveSub.current = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: qk.unreadCount as any });
    });
    return () => {
      responseSub.current?.remove();
      receiveSub.current?.remove();
    };
  }, [router]);

  // Register push token when signed in
  useRegisterPushToken();

  if (!isLoaded) return null;

  return <Slot />;
}

function NavigationThemeWrapper() {
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  (navTheme as any).colors = {
    ...(navTheme as any).colors,
    background: pageBg,
    card: pageBg,
  };
  const barStyle = colorScheme === "dark" ? "light" : "dark";
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={barStyle} />
      <AppShell />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());

  const pk = Constants.expoConfig?.extra?.["CLERK_PUBLISHABLE_KEY"] as
    | string
    | undefined;
  if (!pk)
    console.warn("Missing CLERK_PUBLISHABLE_KEY in Constants.expoConfig.extra");

  return (
    <ClerkProvider publishableKey={pk ?? ""} tokenCache={tokenCache}>
      <QueryClientProvider client={qc}>
        <AppThemeProvider>
          <NavigationThemeWrapper />
        </AppThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
