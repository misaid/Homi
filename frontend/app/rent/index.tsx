// app/rent/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import RentBarChart, { type RentBar } from "@/components/RentBarChart";
import { Avatar, Badge, Button, Card, EmptyState, groupedRow } from "@/components/ui";
import { Colors } from "@/constants/Colors";
import { palette, status } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Payment, Tenant } from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SectionList,
  type SectionListRenderItem,
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

/** "$1,980" for whole amounts, "$1,980.50" otherwise. */
function formatAmount(n: unknown): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0";
  const whole = Math.abs(num - Math.round(num)) < 0.005;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(num);
  } catch {
    return `$${whole ? Math.round(num) : num.toFixed(2)}`;
  }
}

function toDate(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? `${iso}T12:00:00Z` : iso);
}

function formatDay(iso: string): string {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return (iso || "").slice(0, 10);
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  } catch {
    return (iso || "").slice(0, 10);
  }
}

/** Whole days a due date is in the past (0 when due today or later). */
function daysOverdue(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.max(0, Math.round((today - due) / 86400000));
}

function monthName(ym: string, style: "long" | "short", withYear = false): string {
  const [yearStr, monthStr] = ym.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return ym.slice(0, 7);
  // UTC so the month never shifts back a day in western timezones.
  const d = new Date(Date.UTC(year, monthIndex, 1));
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: style,
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(d);
  } catch {
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
    // Refresh every payments query (this list, Home's rent meter, unit sheets).
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
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

  const bars: RentBar[] = useMemo(
    () =>
      sections.map((s, i) => ({
        key: s.month,
        label: monthName(s.month, "short"),
        longLabel: monthName(s.month, "long"),
        total: monthlyTotals[i] ?? 0,
        count: s.items.length,
      })),
    [sections, monthlyTotals]
  );

  // Earliest due date that is still ahead of today.
  const nextDue = useMemo(() => {
    const upcoming = items.filter((p) => daysOverdue(p.due_date) === 0);
    if (upcoming.length === 0) return null;
    const first = upcoming.reduce((a, b) => (a.due_date <= b.due_date ? a : b)).due_date;
    const same = upcoming.filter((p) => p.due_date === first);
    return { date: first, count: same.length, only: same.length === 1 ? same[0] : null };
  }, [items]);

  const listSections = useMemo(
    () =>
      sections.map((s, i) => ({
        title: s.month,
        total: monthlyTotals[i] ?? 0,
        count: s.items.length,
        data: collapsed[s.month] ? [] : s.items,
      })),
    [sections, monthlyTotals, collapsed]
  );

  const renderItem: SectionListRenderItem<Payment, (typeof listSections)[number]> = ({
    item,
    index,
    section,
  }) => {
    const tenantName =
      item.tenant?.full_name || tenantNameById.get(String(item.tenant_id)) || "Unknown tenant";
    const late = item.status === "due" ? daysOverdue(item.due_date) : 0;
    const busy = markPaid.isPending && markPaid.variables === item.id;
    return (
      <View
        style={[groupedRow(index, section.data.length), styles.row]}
        accessible
        accessibilityLabel={`${tenantName}, due ${formatDay(item.due_date)}, amount ${formatAmount(
          item.amount
        )}, ${late > 0 ? `overdue ${late} days` : item.status}`}
      >
        <Avatar name={tenantName} size={40} />
        <View style={styles.rowMain}>
          <Text style={styles.rowName} numberOfLines={1}>
            {tenantName}
          </Text>
          <View style={styles.rowMeta}>
            {late > 0 ? (
              <Text style={[styles.rowDue, styles.rowLate]} numberOfLines={1}>
                {formatDay(item.due_date)} · {late}d late
              </Text>
            ) : (
              <Text style={styles.rowDue}>Due {formatDay(item.due_date)}</Text>
            )}
            {item.status === "paid" ? <Badge label="Paid" tone="ok" /> : null}
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{formatAmount(item.amount)}</Text>
          {item.status === "due" ? (
            <Button
              label={busy ? "Saving" : "Mark paid"}
              icon={busy ? undefined : "checkmark"}
              variant="secondary"
              size="sm"
              disabled={busy}
              style={{ alignSelf: "flex-end" }}
              onPress={() => markPaid.mutate(item.id)}
              accessibilityLabel={`Mark ${tenantName}'s payment paid`}
            />
          ) : null}
        </View>
      </View>
    );
  };

  if (isLoading)
    return (
      <View style={[styles.center, { backgroundColor: palette.page }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  if (isError)
    return (
      <View style={[styles.center, { backgroundColor: palette.page }]}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load rent"
          body={(error as Error)?.message || "Something went wrong."}
          action={<Button label="Try again" variant="secondary" onPress={() => refetch()} />}
        />
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
        sections={listSections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.cardsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Due this month</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(currentMonthTotal)}
                </Text>
                <Text style={styles.statSub} numberOfLines={1}>
                  {paymentsThisMonthCount} {paymentsThisMonthCount === 1 ? "payment" : "payments"}
                </Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Next due</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {nextDue ? formatDay(nextDue.date) : "—"}
                </Text>
                <Text style={styles.statSub} numberOfLines={1}>
                  {nextDue
                    ? nextDue.only
                      ? nextDue.only.tenant?.full_name ?? "1 payment"
                      : `${nextDue.count} payments`
                    : "Nothing scheduled"}
                </Text>
              </Card>
            </View>

            {bars.length > 1 ? (
              <Card>
                <RentBarChart data={bars} currentKey={currentMonthKey} />
              </Card>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <MonthHeader
            title={monthName(section.title, "long", true)}
            total={formatAmount(section.total)}
            collapsed={!!collapsed[section.title]}
            onPress={() =>
              setCollapsed((prev) => ({ ...prev, [section.title]: !prev[section.title] }))
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            title="All caught up"
            body="No rent payments are due right now."
          />
        }
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={[
          sections.length === 0 ? styles.flexGrow : null,
          styles.listContent,
          { paddingTop: insets.top + 4 },
        ]}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

function MonthHeader({
  title,
  total,
  collapsed,
  onPress,
}: {
  title: string;
  total: string;
  collapsed: boolean;
  onPress: () => void;
}) {
  const spin = useRef(new Animated.Value(collapsed ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(spin, {
      toValue: collapsed ? 1 : 0,
      duration: 150,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [collapsed, spin]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${total} due. ${collapsed ? "Expand" : "Collapse"}.`}
      style={styles.monthHeader}
    >
      <Text style={styles.monthTitle}>{title}</Text>
      <Text style={styles.monthTotal}>{total}</Text>
      <Animated.View
        style={{
          transform: [
            { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-90deg"] }) },
          ],
        }}
      >
        <Ionicons name="chevron-down" size={18} color={palette.faint} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  flexGrow: { flexGrow: 1 },
  listContent: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1100,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerWrap: { paddingBottom: 4 },
  cardsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 14 },
  statLabel: { ...type.section, color: palette.muted },
  statValue: { ...type.numeral, fontSize: 24, lineHeight: 30, color: palette.ink, marginTop: 6 },
  statSub: { ...type.caption, color: palette.muted, marginTop: 2 },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 4,
    backgroundColor: palette.page,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  monthTitle: { ...type.heading, fontSize: 18, color: palette.ink, flex: 1 },
  monthTotal: { ...type.caption, color: palette.muted, ...type.tabular },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { ...type.bodyStrong, color: palette.ink },
  rowMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 3 },
  rowDue: { ...type.caption, color: palette.muted },
  rowLate: { color: status.danger.fg, ...font("body", 600) },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowAmount: { ...type.money, color: palette.ink },
});
