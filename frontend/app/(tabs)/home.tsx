// All data fetching must use lib/api useApi(). Do not call fetch directly.
import CreateIssueModal from "@/components/CreateIssueModal";
import IssueDetailModal from "@/components/IssueDetailModal";
import MinimalLineChart from "@/components/MinimalLineChart";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Issue, IssuesQuery, Paginated } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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
    keepPreviousData: true,
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
    return serverItems.filter((it) => it.title.toLowerCase().includes(s));
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

  // Satisfaction placeholder data (stable per session)
  const seedRef = useRef<number>(Date.now());
  const { values: satValues, labels: satLabels } = useMemo(
    () => generateSatisfaction(6, seedRef.current),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <FlatList
        ref={listRef as any}
        ListHeaderComponent={
          <View style={{ marginTop: 4 }}>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderBottomColor: border },
              ]}
              accessibilityLabel={satisfactionA11yLabel(satValues)}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Tenant satisfaction
              </Text>
              <MinimalLineChart
                values={satValues}
                labels={satLabels}
                height={160}
                showAxes
                showXAxis
                showYAxis={false}
              />
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderBottomColor: border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Issues
              </Text>
              <View
                style={[
                  styles.controlsRow,
                  { justifyContent: "space-between" },
                ]}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={[
                      styles.searchWrap,
                      { flex: 1, backgroundColor: cardBg, borderColor: border },
                    ]}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={textMuted}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      accessibilityLabel="Search issues"
                      placeholder="Search issues"
                      placeholderTextColor={textMuted}
                      value={search}
                      onChangeText={setSearch}
                      style={[styles.searchInput, { color: textColor }]}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {search?.length ? (
                    <Pressable
                      accessibilityLabel="Clear search"
                      onPress={() => setSearch("")}
                      style={[
                        styles.clearBtn,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#1f2937" : "#f3f4f6",
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text style={[styles.clearBtnText, { color: textMuted }]}>
                        Clear
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Create new issue"
                  onPress={() => setCreateOpen(true)}
                  style={[
                    styles.newBtn,
                    // Keep a consistent brand accent regardless of theme
                    { backgroundColor: Colors.light.tint },
                  ]}
                >
                  <Text style={styles.newBtnText}>+ New Issue</Text>
                </Pressable>
              </View>
              <View
                style={styles.chipsRow}
                accessibilityLabel="Severity filter"
              >
                {([undefined, "low", "medium", "high"] as const).map((opt) => (
                  <Chip
                    key={String(opt)}
                    active={severity === opt}
                    onPress={() => setSeverity(opt)}
                    label={severityLabel(opt)}
                  />
                ))}
              </View>
              <View style={styles.chipsRow} accessibilityLabel="Status filter">
                {(
                  [
                    undefined,
                    "open",
                    "in_progress",
                    "resolved",
                    "closed",
                  ] as const
                ).map((opt) => (
                  <Chip
                    key={String(opt)}
                    active={status === opt}
                    onPress={() => setStatus(opt)}
                    label={statusLabel(opt)}
                  />
                ))}
              </View>
              <View style={styles.chipsRow} accessibilityLabel="Sort by">
                {(["created_at", "severity", "status", "title"] as const).map(
                  (opt) => (
                    <Chip
                      key={opt}
                      active={sort === opt}
                      onPress={() => setSort(opt)}
                      label={sortLabel(opt)}
                    />
                  )
                )}
                <Chip
                  active={order === "asc"}
                  onPress={() => setOrder(order === "asc" ? "desc" : "asc")}
                  label={order === "asc" ? "Asc" : "Desc"}
                />
              </View>
            </View>
          </View>
        }
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={`${item.title}, severity ${
              item.severity
            }, status ${statusLabel(item.status)}, created ${formatDate(
              item.created_at
            )}`}
            style={[
              styles.issueRow,
              { borderBottomColor: border, backgroundColor: cardBg },
            ]}
            onPress={() => setSelected(item)}
          >
            <View style={styles.issueIconWrap}>
              <Ionicons
                name={statusIconName(item.status)}
                size={18}
                color={statusIconColor(item.status)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.issueTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.labelsRow}>
                  <LabelChip tone={severityTone(item.severity)}>
                    {capitalize(item.severity)}
                  </LabelChip>
                </View>
              </View>
              <Text style={[styles.issueMeta, { color: textMuted }]}>
                {statusLabel(item.status)} · opened on{" "}
                {formatDate(item.created_at)}
                {item.unit?.name ? ` · ${item.unit.name}` : ""}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 24, paddingTop: 0 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={[styles.muted, { color: textMuted }]}>No issues</Text>
          </View>
        )}
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
  return iso.slice(0, 10);
}

function satisfactionA11yLabel(values: number[]): string {
  if (!values.length) return "Tenant satisfaction chart";
  const first = values[0];
  const last = values[values.length - 1];
  const trend = last >= first ? "up" : "down";
  return `Tenant satisfaction. Last ${Math.round(last)}. Trend ${trend}.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function severityLabel(v: IssuesQuery["severity"] | undefined): string {
  if (!v) return "All";
  return capitalize(v);
}

function statusLabel(v: Issue["status"]): string {
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
      return "Open";
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

function statusIconName(v: Issue["status"]): any {
  switch (v) {
    case "open":
      return "ellipse"; // filled circle
    case "in_progress":
      return "time-outline";
    case "resolved":
    case "closed":
      return "checkmark-circle";
    default:
      return "ellipse";
  }
}

function statusIconColor(v: Issue["status"]): string {
  switch (v) {
    case "open":
      return "#1a7f37"; // GitHub green
    case "in_progress":
      return "#0969da"; // blue
    case "resolved":
    case "closed":
      return "#8250df"; // purple
    default:
      return "#1a7f37";
  }
}

type Tone = {
  bg: string;
  text: string;
  border: string;
};

function severityTone(v: Issue["severity"]): Tone {
  switch (v) {
    case "low":
      return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" };
    case "medium":
      return { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" };
    case "high":
      return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
    case "critical":
      return { bg: "#fee2e2", text: "#7f1d1d", border: "#fecaca" };
  }
}

const Chip = memo(function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
});

function LabelChip({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.labelChip,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.labelChipText, { color: tone.text }]}>
        {children}
      </Text>
    </View>
  );
}

function RentChart({ data }: { data: RentSummaryItem[] }) {
  const { labels, paid, due } = buildChartData(data);
  const width = 340;
  const height = 220;
  const padding = { top: 24, right: 12, bottom: 36, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxY = Math.max(1, ...paid, ...due);
  const yTicks = 4;
  const yStep = maxY / yTicks;
  const xCount = labels.length || 1;
  const groupWidth = innerW / xCount;
  const barWidth = Math.max(6, Math.min(16, groupWidth / 3));
  const gap = barWidth; // gap between paid/due

  const scaleY = (v: number) => innerH - (v / maxY) * innerH;

  return (
    <Svg width={width} height={height}>
      <G x={padding.left} y={padding.top}>
        {/* Y grid and labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const yVal = i * yStep;
          const y = scaleY(yVal);
          return (
            <G key={`y-${i}`}>
              <Line
                x1={0}
                y1={y}
                x2={innerW}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <SvgText
                x={-8}
                y={y + 4}
                fontSize={10}
                fill="#6b7280"
                textAnchor="end"
              >
                {formatCurrencyTick(Math.round(yVal))}
              </SvgText>
            </G>
          );
        })}
        {/* X labels */}
        {labels.map((lbl, idx) => (
          <SvgText
            key={`x-${idx}`}
            x={idx * groupWidth + groupWidth / 2}
            y={innerH + 18}
            fontSize={10}
            fill="#6b7280"
            textAnchor="middle"
          >
            {lbl}
          </SvgText>
        ))}
        {/* Bars */}
        {labels.map((_, idx) => {
          const groupX =
            idx * groupWidth + groupWidth / 2 - (barWidth + gap / 2);
          const paidVal = paid[idx] || 0;
          const dueVal = due[idx] || 0;
          const paidH = innerH - scaleY(paidVal);
          const dueH = innerH - scaleY(dueVal);
          return (
            <G key={`bars-${idx}`}>
              <Rect
                x={groupX}
                y={scaleY(paidVal)}
                width={barWidth}
                height={paidH}
                fill="#16a34a"
                rx={2}
              />
              <Rect
                x={groupX + barWidth + gap / 2}
                y={scaleY(dueVal)}
                width={barWidth}
                height={dueH}
                fill="#dc2626"
                rx={2}
              />
            </G>
          );
        })}
        {/* Legend */}
        <Rect x={0} y={-18} width={10} height={10} fill="#16a34a" rx={2} />
        <SvgText x={14} y={-10} fontSize={10} fill="#111827">
          Paid
        </SvgText>
        <Rect x={52} y={-18} width={10} height={10} fill="#dc2626" rx={2} />
        <SvgText x={66} y={-10} fontSize={10} fill="#111827">
          Due
        </SvgText>
      </G>
    </Svg>
  );
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

// Satisfaction data helpers (local only)
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function generateSatisfaction(
  months: number,
  seedBase: number
): { values: number[]; labels: string[] } {
  const rng = seededRandom(seedBase);
  const labels: string[] = [];
  const values: number[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(dt.toLocaleString(undefined, { month: "short" }));
    const val = 60 + Math.round(rng() * 32);
    values.push(val);
  }
  return { values, labels };
}

const styles = StyleSheet.create({
  contentContainer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1000,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 44,
    paddingLeft: 10,
  },
  searchIcon: { marginRight: 6 },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    paddingRight: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  clearBtnText: { fontSize: 12, color: "#374151" },
  issueRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  issueIconWrap: {
    marginTop: 3,
  },
  titleRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 2,
  },
  issueTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0969da", // GitHub link blue
  },
  labelsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  issueMeta: { fontSize: 12 },
  labelChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelChipText: { fontSize: 12, fontWeight: "600" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  muted: { color: "#6b7280" },
  errorText: { color: "#ef4444" },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#0a7ea4", borderColor: "#0a7ea4" },
  chipText: { fontSize: 12, color: "#111827" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  newBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    width: "100%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalDesc: { fontSize: 14, color: "#374151", marginBottom: 12 },
  modalClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0a7ea4",
    borderRadius: 6,
  },
  modalCloseText: { color: "#fff", fontWeight: "700" },
});
