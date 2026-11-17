// app/settings/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Button, Card, EmptyState, SectionHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { type } from "@/constants/type";
import { useAuth } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

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
    <ScrollView style={{ backgroundColor: palette.page }} contentContainerStyle={styles.container}>
      <SectionHeader title="Account" style={{ marginTop: 0 }} />
      {loading ? (
        <Card style={styles.loading}>
          <ActivityIndicator color={palette.tint} />
        </Card>
      ) : error ? (
        <Card padded={false}>
          <EmptyState icon="cloud-offline-outline" tone="danger" title="Couldn't load your profile" body={error} />
        </Card>
      ) : (
        <Card padded={false}>
          <Row label="User ID" value={me?.userId || "–"} />
          <Row label="Organization" value={me?.orgId || "–"} divider />
        </Card>
      )}

      <SectionHeader title="Session" />
      <Button label="Sign out" icon="log-out-outline" variant="danger" full onPress={handleSignOut} />
    </ScrollView>
  );
}

function Row({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, alignSelf: "center", width: "100%", maxWidth: 560 },
  loading: { alignItems: "center", paddingVertical: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, minHeight: 52, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  label: { ...type.body, color: palette.muted },
  value: { ...type.label, color: palette.ink, flex: 1, textAlign: "right" },
});
