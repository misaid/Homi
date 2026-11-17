// All data fetching must use lib/api useApi(). Do not call fetch directly.
import CreateIssueModal from "@/components/CreateIssueModal";
import IssueDetailModal from "@/components/IssueDetailModal";
import { Badge, Button, Chip, EmptyState, SearchField, groupedRow } from "@/components/ui";
import { Colors } from "@/constants/Colors";
import { palette, radius, status as tone, type StatusTone } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/queryKeys";
import type { Issue, IssuesQuery, Paginated, Payment } from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeTab() {
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textMuted = Colors[colorScheme ?? "light"].mutedText;
  const textColor = Colors[colorScheme ?? "light"].text;
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 400);
  const [severity, setSeverity] = useState<IssuesQuery["severity"] | undefined>(
    undefined
  );
  const [status, setStatus] = useState<IssuesQuery["status"] | undefined>(
    undefined
  );
  const [sort, setSort] = useState<IssuesQuery["sort"]>("created_at");
  const [order, setOrder] = useState<IssuesQuery["order"]>("desc");
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [items, setItems] = useState<Issue[]>([]);
  const isResettingRef = useRef<boolean>(false);
  const listRef = useRef<FlatList<Issue>>(null as any);
  const [createOpen, setCreateOpen] = useState(false);

  const issuesQuery = useQuery<Paginated<Issue>, Error>({
    queryKey: qk.issues({ severity, status, sort, order, page, limit }),
    queryFn: () =>
      api.get(
        `/api/v1/issues?page=${page}&limit=${limit}` +
          (severity ? `&severity=${severity}` : "") +
          (status ? `&status=${status}` : "") +
          (sort ? `&sort=${sort}` : "") +
          (order ? `&order=${order}` : "")
      ),
    enabled: isLoaded && isSignedIn,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const [selected, setSelected] = useState<Issue | null>(null);
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status: Issue["status"] }) =>
      api.patch(`/api/v1/issues/${vars.id}`, { status: vars.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.issues({ severity, status, sort, order, page, limit }),
      });
    },
  });

  // Reset pagination on filter changes
  const lastFilterKeyRef = useRef<string>("");
  const filterKey = `${severity ?? ""}|${status ?? ""}|${sort}|${order}`;
  const lastSearchRef = useRef<string>("");

  // Update list when server data changes, with client-side search applied
  const serverItems = issuesQuery.data?.items ?? [];
  const filteredPageItems = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return serverItems;
    return serverItems.filter((it: Issue) => it.title.toLowerCase().includes(s));
  }, [serverItems, debouncedSearch]);

  // Reset page when filters change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      isResettingRef.current = true;
      setPage(1);
    }
  }, [filterKey]);

  // Apply items on data change or search changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!issuesQuery.data) return;
    setItems((prev) => {
      if (
        page === 1 ||
        isResettingRef.current ||
        lastSearchRef.current !== debouncedSearch
      ) {
        isResettingRef.current = false;
        lastSearchRef.current = debouncedSearch;
        return filteredPageItems;
      }
      return [...prev, ...filteredPageItems];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuesQuery.data, filteredPageItems, page, debouncedSearch]);

  const onEndReached = useCallback(() => {
    if (isResettingRef.current) return;
    if (!issuesQuery.data?.hasMore || issuesQuery.isFetching) return;
    setPage((p) => p + 1);
  }, [issuesQuery.data?.hasMore, issuesQuery.isFetching]);

  const isRefetching = issuesQuery.isFetching;
  const onRefresh = useCallback(() => {
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: qk.issues({ severity, status, sort, order, page: 1, limit }),
    });
  }, [queryClient, severity, status, sort, order]);

  // Overview counts (separate, unfiltered query)
  const overviewQuery = useQuery<Paginated<Issue>, Error>({
    queryKey: ["issues", "overview"],
    queryFn: () => api.get(`/api/v1/issues?page=1&limit=100`),
    enabled: isLoaded && isSignedIn,
    staleTime: 30_000,
  });
  const overview = useMemo(() => {
    const all = overviewQuery.data?.items ?? [];
    const active = all.filter((i) => i.status === "open" || i.status === "in_progress");
    return {
      open: all.filter((i) => i.status === "open").length,
      progress: all.filter((i) => i.status === "in_progress").length,
      urgent: active.filter((i) => i.severity === "high" || i.severity === "critical").length,
    };
  }, [overviewQuery.data]);


  // Rent collected so far this month (all statuses, current month only).
  const monthRange = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, "0");
    const last = new Date(y, m + 1, 0).getDate();
    return {
      key: `${y}-${pad(m + 1)}`,
      from: `${y}-${pad(m + 1)}-01`,
      to: `${y}-${pad(m + 1)}-${pad(last)}`,
      label: now.toLocaleDateString(undefined, { month: "long" }),
    };
  }, []);
  const rentQuery = useQuery<Paginated<Payment>, Error>({
    queryKey: ["payments", "month", monthRange.key],
    queryFn: () =>
      api.get(`/api/v1/payments?from=${monthRange.from}&to=${monthRange.to}&page=1&limit=100`),
    enabled: isLoaded && isSignedIn,
    staleTime: 30_000,
  });
  const rent = useMemo(() => {
    const all = rentQuery.data?.items ?? [];
    const total = all.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const collected = all
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { total, collected, pct: total > 0 ? Math.min(1, collected / total) : 0 };
  }, [rentQuery.data]);

  const tiles = [
    {
      label: "Open",
      n: overview.open,
      icon: "alert-circle-outline",
      tone: "warn" as StatusTone,
      active: status === "open",
      onPress: () => setStatus(status === "open" ? undefined : "open"),
    },
    {
      label: "In progress",
      n: overview.progress,
      icon: "time-outline",
      tone: "info" as StatusTone,
      active: status === "in_progress",
      onPress: () => setStatus(status === "in_progress" ? undefined : "in_progress"),
    },
    {
      label: "Urgent",
      n: overview.urgent,
      icon: "flame-outline",
      tone: "danger" as StatusTone,
      active: severity === "high",
      onPress: () => setSeverity(severity === "high" ? undefined : "high"),
    },
  ] as const;

  const filtered = !!severity || !!status || debouncedSearch.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <FlatList
        ref={listRef as any}
        ListHeaderComponent={
          <View>
            {rent.total > 0 ? (
              <Pressable
                onPress={() => router.push("/(tabs)/rent")}
                accessibilityRole="button"
                accessibilityLabel={`${monthRange.label} rent, ${money(rent.collected)} of ${money(rent.total)} collected. Open rent.`}
                style={({ pressed }) => [styles.meter, pressed && styles.pressed]}
              >
                <View style={styles.meterTop}>
                  <Text style={styles.sectionLabel}>{monthRange.label} rent</Text>
                  <Ionicons name="chevron-forward" size={16} color={palette.chevron} />
                </View>
                <Text style={styles.meterLine}>
                  <Text style={styles.meterValue}>{money(rent.collected)}</Text>
                  {`  of ${money(rent.total)} collected`}
                </Text>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: `${Math.round(rent.pct * 100)}%` }]} />
                </View>
              </Pressable>
            ) : null}

            <View style={styles.tilesRow} accessibilityLabel="Issue overview">
              {tiles.map((t) => (
                <Pressable
                  key={t.label}
                  onPress={t.onPress}
                  accessibilityRole="button"
                  accessibilityState={{ selected: t.active }}
                  accessibilityLabel={`${t.n} ${t.label}. Filter issues.`}
                  style={({ pressed }) => [
                    styles.tile,
                    t.active && styles.tileActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: tone[t.tone].bg }]}>
                    <Ionicons name={t.icon as any} size={16} color={tone[t.tone].fg} />
                  </View>
                  <Text style={styles.tileNum}>{t.n}</Text>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.issuesTop}>
              <View style={styles.issuesHead}>
                <Text style={styles.issuesTitle}>Issues</Text>
                <Text style={styles.issuesCount}>{items.length}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.sortPill}>
                  <Pressable
                    accessibilityLabel={`Sort by ${sortLabel(sort)}. Tap to change.`}
                    onPress={() => {
                      const seq = ["created_at", "severity", "status", "title"] as const;
                      setSort(seq[(seq.indexOf(sort as any) + 1) % seq.length]);
                    }}
                    hitSlop={4}
                    style={styles.sortField}
                  >
                    <Text style={styles.sortText}>{sortLabel(sort)}</Text>
                  </Pressable>
                  <View style={styles.sortDivider} />
                  <Pressable
                    accessibilityLabel={order === "asc" ? "Ascending. Tap for descending." : "Descending. Tap for ascending."}
                    onPress={() => setOrder(order === "asc" ? "desc" : "asc")}
                    hitSlop={4}
                    style={styles.sortDir}
                  >
                    <Ionicons name={order === "asc" ? "arrow-up" : "arrow-down"} size={14} color={palette.inkSoft} />
                  </Pressable>
                </View>
                <Button
                  label="New"
                  icon="add"
                  size="sm"
                  accessibilityLabel="Create new issue"
                  onPress={() => setCreateOpen(true)}
                />
              </View>
              <SearchField value={search} onChangeText={setSearch} placeholder="Search issues" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
                accessibilityLabel="Issue filters"
              >
                <Chip
                  label="All"
                  active={!severity && !status}
                  onPress={() => {
                    setSeverity(undefined);
                    setStatus(undefined);
                  }}
                />
                {(["high", "medium", "low"] as const).map((opt) => (
                  <Chip
                    key={opt}
                    label={severityLabel(opt)}
                    active={severity === opt}
                    onPress={() => setSeverity(severity === opt ? undefined : opt)}
                  />
                ))}
                <View style={styles.chipDivider} />
                {(["resolved", "closed"] as const).map((opt) => (
                  <Chip
                    key={opt}
                    label={statusLabel(opt)}
                    active={status === opt}
                    onPress={() => setStatus(status === opt ? undefined : opt)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        }
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityLabel={`${item.title}, severity ${
              item.severity
            }, status ${statusLabel(item.status)}, created ${formatDate(
              item.created_at
            )}`}
            style={({ pressed }) => [
              groupedRow(index, items.length, { joinTop: true }),
              styles.issueRow,
              pressed && { backgroundColor: palette.page },
            ]}
            onPress={() => setSelected(item)}
          >
            <View style={[styles.statusDot, { backgroundColor: statusDotColor(item.status) }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.issueTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.issueMeta} numberOfLines={1}>
                {item.unit?.name ? `${item.unit.name} · ` : ""}
                {statusLabel(item.status)} · {formatDate(item.created_at)}
              </Text>
            </View>
            <Badge label={capitalize(item.severity)} tone={severityTone(item.severity)} />
          </Pressable>
        )}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListEmptyComponent={() =>
          issuesQuery.isPending ? (
            <View style={styles.emptyWrap} />
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={filtered ? "funnel-outline" : "checkmark-done-outline"}
                title={filtered ? "No matching issues" : "No issues"}
                body={
                  filtered
                    ? "Try a different filter or search."
                    : "Nothing needs your attention right now."
                }
              />
            </View>
          )
        }
      />

      <IssueDetailModal
        issue={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />

      <CreateIssueModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(issue) => {
          setItems((prev) => {
            const next = [issue, ...prev];
            return applySort(next, sort, order);
          });
          setTimeout(() => {
            try {
              (listRef as any)?.current?.scrollToOffset?.({
                offset: 0,
                animated: true,
              });
            } catch {}
          }, 0);
        }}
      />
    </SafeAreaView>
  );
}

// Helpers
function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function severityLabel(v: IssuesQuery["severity"] | undefined): string {
  if (!v) return "All";
  return capitalize(v);
}

function statusLabel(v: Issue["status"] | undefined): string {
  switch (v) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return "All";
  }
}

function sortLabel(v: IssuesQuery["sort"]): string {
  switch (v) {
    case "created_at":
      return "Created";
    case "severity":
      return "Severity";
    case "status":
      return "Status";
    case "title":
      return "Title";
    default:
      return "Created";
  }
}

function applySort(
  arr: Issue[],
  sort: IssuesQuery["sort"],
  order: IssuesQuery["order"]
) {
  const mul = order === "asc" ? 1 : -1;
  return [...arr].sort((a, b) => {
    switch (sort) {
      case "title":
        return a.title.localeCompare(b.title) * mul;
      case "severity": {
        const rank: Record<string, number> = {
          low: 0,
          medium: 1,
          high: 2,
          critical: 3,
        };
        return ((rank[a.severity] ?? 0) - (rank[b.severity] ?? 0)) * mul;
      }
      case "status": {
        const rank: Record<string, number> = {
          open: 0,
          in_progress: 1,
          resolved: 2,
          closed: 3,
        };
        return ((rank[a.status] ?? 0) - (rank[b.status] ?? 0)) * mul;
      }
      case "created_at":
      default:
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          mul
        );
    }
  });
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id as any);
  }, [value, delayMs]);
  return debounced;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function statusDotColor(v: Issue["status"]): string {
  switch (v) {
    case "open":
      return tone.warn.fg;
    case "in_progress":
      return palette.tint;
    default:
      return tone.ok.fg;
  }
}

function severityTone(v: Issue["severity"]): StatusTone {
  switch (v) {
    case "high":
    case "critical":
      return "danger";
    case "medium":
      return "warn";
    default:
      return "neutral";
  }
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  contentContainer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1000,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  sectionLabel: { ...type.section, color: palette.muted },
  meter: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  meterTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meterLine: { ...type.caption, color: palette.muted, marginTop: 6 },
  meterValue: { ...font("display", 700), fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: palette.ink, ...type.tabular },
  meterTrack: { height: 8, borderRadius: radius.pill, backgroundColor: palette.wash, marginTop: 12, overflow: "hidden" },
  meterFill: { height: 8, borderRadius: radius.pill, backgroundColor: palette.tint },
  tilesRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  tile: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: 12,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  tileActive: { borderColor: palette.tint, backgroundColor: palette.page },
  tileIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tileNum: { ...type.numeral, color: palette.ink },
  tileLabel: { ...type.caption, color: palette.muted, marginTop: 2 },
  issuesTop: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  issuesHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  issuesTitle: { ...type.title, color: palette.ink },
  issuesCount: { ...type.caption, color: palette.muted, ...type.tabular },
  sortPill: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: palette.field,
  },
  sortField: { height: 36, paddingLeft: 12, paddingRight: 8, justifyContent: "center" },
  sortText: { ...font("body", 600), fontSize: 13, color: palette.inkSoft },
  sortDivider: { width: 1, height: 16, backgroundColor: palette.washDeep },
  sortDir: { height: 36, width: 32, alignItems: "center", justifyContent: "center" },
  chipScroll: { marginTop: 12, marginHorizontal: -16 },
  chipRow: { gap: 8, paddingHorizontal: 16, alignItems: "center" },
  chipDivider: { width: 1, height: 18, backgroundColor: palette.border, marginHorizontal: 2 },
  issueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  issueTitle: { ...type.bodyStrong, color: palette.ink },
  issueMeta: { ...type.caption, color: palette.muted, marginTop: 2 },
  emptyWrap: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    minHeight: 24,
  },
});
