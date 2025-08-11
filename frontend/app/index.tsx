// Redirect root "/" to the appropriate screen based on auth state
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

export default function RootIndexRedirect() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (didRedirectRef.current) return;

    didRedirectRef.current = true;
    // On web, root redirect is handled by the root layout guard to allow marketing pages
    if (Platform.OS === "web") return;
    if (isSignedIn) router.replace("/(tabs)/home");
    else router.replace("/(auth)/sign-in");
  }, [isLoaded, isSignedIn, router]);

  return null;
}
