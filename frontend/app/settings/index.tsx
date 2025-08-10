// app/settings/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApi } from "@/lib/api";

type MeData = { userId: string; orgId: string | null };

export default function SettingsScreen() {
  const api = useApi();
  const router = useRouter();
  const { signOut } = useAuth();

  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get<MeData>("/api/v1/me");
        if (!isMounted) return;
        setMe(res);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      router.replace("/(auth)/sign-in");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.section}>
          <Text style={styles.label}>userId</Text>
          <Text style={styles.value}>{me?.userId || "-"}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>orgId</Text>
          <Text style={styles.value}>{me?.orgId || "-"}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Button title="Sign out" onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    alignSelf: "center",
    minWidth: 240,
  },
  label: {
    color: "#666",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  error: {
    color: "#c00",
    textAlign: "center",
  },
  footer: {
    alignSelf: "center",
    marginTop: 16,
  },
});
