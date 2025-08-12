// app/rent/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import MinimalLineChart from "@/components/MinimalLineChart";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Payment, Tenant } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ListRenderItem,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentsResponse = {
  items: Payment[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

function formatAmount(n: unknown): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || "").slice(0, 10);
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return (iso || "").slice(0, 10);
  }
}

function formatMonth(ym: string): string {
  // ym is expected to be in the form "YYYY-MM". Construct a UTC date to
  // avoid local timezone shifting the month backwards (e.g., showing August
  // for a September key in some timezones).
  const [yearStr, monthStr] = ym.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0-based month index
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex))
    return ym.slice(0, 7);

  const d = new Date(Date.UTC(year, monthIndex, 1));
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(d);
  } catch {
    // Fallback to a simple string in case Intl is unavailable
    return ym.slice(0, 7);
  }
}

function groupByMonth(payments: Payment[]) {
  const groups = new Map<string, Payment[]>();
  for (const p of payments) {
    const key = (p.due_date || "").slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, items]) => ({ month, items }));
}

export default function RentScreen() {
  const api = useApi();
  const qc = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textColor = Colors[colorScheme ?? "light"].text;
  const insets = useSafeAreaInsets();

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
  const sections = useMemo(() => groupByMonth(items), [items]);
  const monthlyTotals = useMemo(
    () =>
      sections.map((s) =>
        s.items.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      ),
    [sections]
  );
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);
  const paymentsThisMonthCount = useMemo(() => {
    return sections.find((s) => s.month === currentMonthKey)?.items.length ?? 0;
  }, [sections, currentMonthKey]);
  const currentMonthTotal = useMemo(() => {
    const match = sections.find((s) => s.month === currentMonthKey);
    if (match) {
      return match.items.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }
    return monthlyTotals[monthlyTotals.length - 1] ?? 0;
  }, [sections, currentMonthKey, monthlyTotals]);
  const monthlyLabels = useMemo(() => {
    return sections.map((s) => {
      const [y, m] = s.month.split("-").map((n) => Number(n));
      const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
      try {
        return new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
      } catch {
        return s.month.slice(5, 7);
      }
    });
  }, [sections]);
  // Chart y-axis domain and tick formatting
  const chartMax = useMemo(() => {
    const maxVal = Math.max(1, ...monthlyTotals);
    // Round up to a nice number for the axis (e.g., nearest 50/100/500/1000)
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const step = magnitude / 2;
    return Math.ceil(maxVal / step) * step;
  }, [monthlyTotals]);

  const formatCurrencyTick = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(n);
    } catch {
      return `$${Math.round(n)}`;
    }
  };

  const renderItem: ListRenderItem<Payment> = ({ item }) => {
    const tenantName = item.tenant?.full_name || "Unknown tenant";
    const leftLine = `${tenantName} • ${formatDate(item.due_date)}`;
    const badgeText = item.status === "paid" ? "Paid" : "Due";
    return (
      <View
        style={styles.item}
        accessible
        accessibilityLabel={`${tenantName}, due ${formatDate(
          item.due_date
        )}, amount ${formatAmount(item.amount)}, ${item.status}`}
      >
        <View style={styles.rowBetween}>
          <View style={styles.leftBlock}>
            <Text
              style={styles.leftText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {leftLine}
            </Text>
            <View
              style={[
                styles.badge,
                item.status === "paid" ? styles.badgePaid : styles.badgeDue,
              ]}
            >
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          </View>
          <View style={styles.rightBlock}>
            <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
            {item.status === "due" && (
              <Pressable
                onPress={() => markPaid.mutate(item.id)}
                disabled={markPaid.isPending}
                style={[
                  styles.payBtn,
                  markPaid.isPending && styles.payBtnDisabled,
                ]}
              >
                <Text style={styles.payBtnText}>
                  {markPaid.isPending ? "Working" : "Mark paid"}
                </Text>
              </Pressable>
            )}
          </View>
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
    <View
      style={[
        styles.screen,
        { backgroundColor: Colors[colorScheme ?? "light"].pageBackground },
      ]}
    >
      <SectionList
        sections={sections.map((s) => ({
          title: s.month,
          data: collapsed[s.month] ? [] : s.items,
        }))}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <View style={[styles.headerWrap, styles.responsiveCenter]}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Overview
            </Text>
            <View style={styles.cardsRow}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Text style={styles.statLabel}>Payments this month</Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {paymentsThisMonthCount}
                </Text>
                <Text style={styles.statSub}>due payments</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Text style={styles.statLabel}>Next payment</Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {items.length ? formatDate(items[0].due_date) : "—"}
                </Text>
                <Text style={styles.statSub}>Tap an item to mark paid</Text>
              </View>
            </View>

            {monthlyTotals.length > 1 && (
              <View
                style={[
                  styles.chartCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: textColor }]}>
                    Monthly due trend
                  </Text>
                  <Text style={[styles.chartTitle, { color: tint }]}>
                    {formatAmount(currentMonthTotal)}
                  </Text>
                </View>
                <MinimalLineChart
                  values={monthlyTotals}
                  labels={monthlyLabels}
                  height={160}
                  showAxes
                  showArea
                  yDomain={[0, chartMax]}
                  formatYTick={formatCurrencyTick}
                  accessibilityLabel="Monthly due trend chart"
                />
              </View>
            )}
          </View>
        )}
        renderSectionHeader={({ section }) => {
          const title = section.title as string;
          const isCollapsed = !!collapsed[title];
          return (
            <Pressable
              onPress={() =>
                setCollapsed((prev) => ({ ...prev, [title]: !isCollapsed }))
              }
              accessibilityRole="button"
              accessibilityLabel={`Toggle month ${formatMonth(title)}`}
              style={[
                styles.sectionHeaderRow,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={[styles.sectionHeaderText, { color: textColor }]}>
                {formatMonth(title)}
              </Text>
              <Text
                style={[
                  styles.sectionHeaderCaret,
                  { color: Colors[colorScheme ?? "light"].mutedText },
                ]}
              >
                {isCollapsed ? "▸" : "▾"}
              </Text>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No due payments coming up</Text>
          </View>
        )}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={[
          sections.length === 0 ? styles.flexGrow : styles.listContent,
          styles.responsivePad,
          { paddingTop: insets.top + 8 },
        ]}
        stickySectionHeadersEnabled
        ListFooterComponent={<View style={{ height: 8 }} />}
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
  listContent: { padding: 12, paddingTop: 4 },
  responsiveCenter: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1100,
  },
  responsivePad: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1100,
  },
  headerWrap: { paddingHorizontal: 4, paddingBottom: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statLabel: { color: "#64748b", fontSize: 12, marginBottom: 4 },
  statValue: { color: "#0f172a", fontSize: 20, fontWeight: "700" },
  statSub: { color: "#475569", fontSize: 12, marginTop: 2 },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chartTitle: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  separator: { height: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionHeaderText: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  sectionHeaderCaret: { fontSize: 18, color: "#334155" },
  item: {
    padding: 14,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftBlock: { flexShrink: 1 },
  leftText: {
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 6,
    fontWeight: "700",
  },
  amount: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  rightBlock: { alignItems: "flex-end", gap: 8 },
  payBtn: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: "#fff", fontWeight: "600" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeDue: { backgroundColor: "#fef3c7" },
  badgePaid: { backgroundColor: "#dcfce7" },
  badgeText: { color: "#111", fontSize: 12 },
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
