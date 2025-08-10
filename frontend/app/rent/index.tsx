// app/rent/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  status?: string;
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
  if (Number.isFinite(value)) return `$${value.toFixed(2)}`;
  return String(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export default function RentScreen() {
  const api = useApi();
  const qc = useQueryClient();

  const queryKey = ["payments", { status: "due", page: 1, limit: 20 }] as const;

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () =>
      api.get<PaymentsResponse>("/v1/payments?status=due&page=1&limit=20"),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      return api.post<Payment>(`/v1/payments/${id}/pay`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });

  const groups = useMemo(() => {
    const items = data?.items ?? [];
    const getName = (p: Payment) =>
      (p.tenant && (p.tenant.name ?? null)) ??
      p.tenant_name ??
      p.tenantName ??
      null;

    const anyNames = items.some((p) => !!getName(p));
    if (!anyNames) return null;

    const map = new Map<string, Payment[]>();
    for (const p of items) {
      const name = getName(p) ?? "Unknown tenant";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(p);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
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
  }

  const items = data?.items ?? [];

  const renderItem = ({ item }: { item: Payment }) => {
    const disabled = markPaid.isPending;
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemTextWrap}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.dueDate}>{formatDate(item.due_date)}</Text>
        </View>
        <Pressable
          onPress={() => markPaid.mutate(item.id)}
          disabled={disabled}
          style={[styles.payBtn, disabled && styles.payBtnDisabled]}
        >
          <Text style={styles.payBtnText}>
            {disabled ? "Working" : "Mark paid"}
          </Text>
        </Pressable>
      </View>
    );
  };

  return groups ? (
    <SectionList
      sections={groups}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        isRefetching ? (
          <View style={styles.headerInline}>
            <ActivityIndicator size="small" />
            <Text style={styles.headerText}>Refreshing</Text>
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContent}
    />
  ) : (
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
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flexGrow: {
    flexGrow: 1,
  },
  listContent: {
    padding: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  separator: {
    height: 8,
  },
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
  itemTextWrap: {
    flexDirection: "column",
    gap: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
  },
  dueDate: {
    fontSize: 12,
    color: "#666",
  },
  payBtn: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    color: "#c00",
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  retryText: {
    color: "#333",
    fontWeight: "600",
  },
  headerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 12,
    color: "#666",
  },
});
