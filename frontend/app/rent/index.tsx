// app/rent/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Payment = {
  id: string;
  amount: number;
  due_date: string;
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
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export default function RentScreen() {
  const api = useApi();
  const qc = useQueryClient();

  const queryKey = ["payments", "due"] as const;
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => api.get<PaymentsResponse>("/v1/payments?status=due"),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.post(`/v1/payments/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const sections = useMemo(() => {
    const items = data?.items ?? [];
    const nameOf = (p: Payment) =>
      p.tenant?.name ?? p.tenant_name ?? p.tenantName ?? "Unknown tenant";
    const map = new Map<string, Payment[]>();
    for (const p of items) {
      const name = nameOf(p);
      map.set(name, [...(map.get(name) ?? []), p]);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [data]);

  const renderItem = ({ item }: { item: Payment }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemTextWrap}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.dueDate}>{formatDate(item.due_date)}</Text>
      </View>
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
  );

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
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={() => (
        <View style={styles.center}>
          <Text>No due payments</Text>
        </View>
      )}
      refreshing={isRefetching}
      onRefresh={() => refetch()}
      contentContainerStyle={
        sections.length === 0 ? styles.flexGrow : styles.listContent
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flexGrow: { flexGrow: 1 },
  listContent: { padding: 12 },
  sectionHeader: { fontSize: 16, fontWeight: "600", paddingVertical: 8 },
  separator: { height: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemTextWrap: { flexDirection: "column" },
  amount: { fontSize: 16, fontWeight: "600" },
  dueDate: { fontSize: 12, color: "#666" },
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
