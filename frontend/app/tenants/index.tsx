// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, Unit } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TenantsScreen() {
  const api = useApi();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const tenantsQuery = useQuery<Paginated<Tenant>, Error>({
    queryKey: qk.tenants(1, 20),
    queryFn: () =>
      api.get<Paginated<Tenant>>(`/api/v1/tenants?page=1&limit=20`),
    enabled: isLoaded && isSignedIn,
  });

  const unitsQuery = useQuery<Paginated<Unit>, Error>({
    queryKey: qk.units(1, 100),
    queryFn: () => api.get<Paginated<Unit>>(`/api/v1/units?page=1&limit=100`),
    enabled: isLoaded && isSignedIn,
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    (unitsQuery.data?.items ?? []).forEach((u) =>
      map.set(String(u.id), u.name)
    );
    return map;
  }, [unitsQuery.data]);

  const isRefetching = tenantsQuery.isRefetching || unitsQuery.isRefetching;
  const onRefresh = useCallback(() => {
    tenantsQuery.refetch();
    unitsQuery.refetch();
  }, [tenantsQuery, unitsQuery]);

  if (tenantsQuery.isPending && tenants.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading tenants...</Text>
      </View>
    );
  }

  if (tenantsQuery.isError && tenants.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{tenantsQuery.error.message}</Text>
        <Pressable
          onPress={() => tenantsQuery.refetch()}
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={tenants}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          tenants.length === 0 ? styles.flexGrow : undefined
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.muted}>No tenants found</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TenantRow
            tenant={item}
            unitName={
              item.unit_id
                ? unitNameById.get(String(item.unit_id)) ?? "Unassigned"
                : "Unassigned"
            }
            onPress={() =>
              (router as any).push({
                pathname: "/tenants/[id]",
                params: { id: String(item.id) },
              })
            }
            onAssign={() =>
              (router as any).push(`/tenants/${item.id}?mode=assign`)
            }
          />
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => (router as any).push("/tenants/new")}
      >
        <Text style={styles.fabText}>Add</Text>
      </Pressable>
    </View>
  );
}

function TenantRow({
  tenant,
  unitName,
  onPress,
  onAssign,
}: {
  tenant: Tenant;
  unitName: string;
  onPress: () => void;
  onAssign: () => void;
}) {
  const name = tenant.full_name ?? (tenant as any).fullName ?? "-";
  const email = tenant.email ?? null;
  const leaseStart = tenant.lease_start ?? (tenant as any).leaseStart ?? null;
  const leaseEnd = tenant.lease_end ?? (tenant as any).leaseEnd ?? null;
  const unassigned = !tenant.unit_id;
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.name}>{name}</Text>
        {!!email && <Text style={styles.email}>{email}</Text>}
      </View>
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            unassigned ? styles.badgeGray : styles.badgeBlue,
          ]}
        >
          <Text style={styles.badgeText}>{unitName}</Text>
        </View>
        {unassigned && (
          <Pressable onPress={onAssign} style={styles.assignBtn}>
            <Text style={styles.assignText}>Assign</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.lease}>
        {formatDate(leaseStart)} to {formatDate(leaseEnd)}
      </Text>
    </Pressable>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flexGrow: { flexGrow: 1 },
  muted: { color: "#6b7280", marginTop: 8 },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: "#1b73e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#fff",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  email: { fontSize: 12, color: "#6b7280" },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeBlue: { backgroundColor: "#e0f2fe" },
  badgeGray: { backgroundColor: "#f3f4f6" },
  badgeText: { color: "#111827", fontSize: 12 },
  lease: { fontSize: 13, color: "#374151" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
  },
  fabText: { color: "#fff", fontWeight: "700" },
  assignBtn: {
    marginLeft: 8,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  assignText: { color: "#fff", fontWeight: "600", fontSize: 12 },
});
