// app/rent/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Payment = {
  id: string;
  amount: number;
  due_date: string;
  tenant_id?: string | null;
  tenant?: { name?: string | null } | null;
  tenant_name?: string | null;
  tenantName?: string | null;
};

type PaymentsResponse = {
  items: Payment[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

function formatCurrency(value: number): string {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : String(value);
}
function formatDateYMD(iso: string): string {
  if (typeof iso === "string" && iso.length >= 10) return iso.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function RentScreen() {
  const api = useApi();
  const qc = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();

  const queryKey = ["payments", "due"] as const;
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => api.get<PaymentsResponse>("/api/v1/payments?status=due"),
    enabled: isLoaded && isSignedIn,
  });

  // Preload tenants map (id -> full_name)
  const tenantsQuery = useQuery<Paginated<Tenant>, Error>({
    queryKey: qk.tenants(1, 1000),
    queryFn: () =>
      api.get<Paginated<Tenant>>("/api/v1/tenants?page=1&limit=1000"),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
  const tenantNameById = useMemo(() => {
    const map = new Map<string, string>();
    (tenantsQuery.data?.items ?? []).forEach((t) => {
      if (t.id && t.full_name) map.set(String(t.id), t.full_name);
    });
    return map;
  }, [tenantsQuery.data]);

  const markPaid = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/payments/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const items = data?.items ?? [];

  const renderItem: ListRenderItem<Payment> = ({ item }) => {
    const tenantName =
      (item.tenant_id && tenantNameById.get(String(item.tenant_id))) ||
      item.tenant?.name ||
      item.tenant_name ||
      item.tenantName ||
      "Unknown tenant";
    return (
      <View style={styles.item}>
        <View style={styles.rowBetween}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {tenantName}
          </Text>
          <Text style={styles.itemDate}>{formatDateYMD(item.due_date)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <Pressable
            onPress={() => markPaid.mutate(item.id)}
            disabled={markPaid.isPending}
            style={[styles.payBtn, markPaid.isPending && styles.payBtnDisabled]}
          >
            <Text style={styles.payBtnText}>
              {markPaid.isPending ? "Working" : "Mark paid"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  if (isError)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {(error as Error)?.message || "Error"}
        </Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No due payments</Text>
          </View>
        )}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={
          items.length === 0 ? styles.flexGrow : styles.listContent
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flexGrow: { flexGrow: 1 },
  listContent: { padding: 12 },
  separator: { height: 8 },
  item: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: { fontSize: 14, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  itemDate: { fontSize: 12, color: "#666" },
  amount: { fontSize: 16, fontWeight: "600" },
  payBtn: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: "#fff", fontWeight: "600" },
  errorText: { color: "#c00", marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  retryText: { color: "#333", fontWeight: "600" },
});
