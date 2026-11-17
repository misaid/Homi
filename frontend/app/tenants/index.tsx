// All data fetching must use lib/api useApi(). Do not call fetch directly.
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Fab,
  SearchField,
  Segmented,
  Sheet,
  SheetAction,
  SheetHeader,
  groupedRow,
} from "@/components/ui";
import { Colors } from "@/constants/Colors";
import { palette } from "@/constants/theme";
import { type } from "@/constants/type";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, TenantsQuery, Unit } from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SORTS: { key: NonNullable<TenantsQuery["sort"]>; label: string; short: string }[] = [
  { key: "created_at", label: "Recently added", short: "Recent" },
  { key: "name", label: "Name", short: "Name" },
  { key: "lease_start", label: "Lease start", short: "Start" },
  { key: "lease_end", label: "Lease end", short: "End" },
];

export default function TenantsScreen() {
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const DEFAULT = {
    q: "",
    sort: "created_at" as const,
    order: "desc" as const,
    page: 1,
    limit: 20,
  };
  const limit = DEFAULT.limit;
  const [q, setQ] = useState<string>(DEFAULT.q);
  const [sort, setSort] = useState<TenantsQuery["sort"]>(DEFAULT.sort);
  const [order, setOrder] = useState<TenantsQuery["order"]>(DEFAULT.order);
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<Tenant[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const isResettingRef = useRef<boolean>(false);

  const debouncedQ = useDebounce(q, 400);
  const normalizedQ: string | undefined =
    debouncedQ.trim().length > 0 ? debouncedQ : undefined;

  const tenantsQuery = useQuery<Paginated<Tenant>, Error>({
    queryKey: qk.tenantsList({ q: normalizedQ, sort, order, page, limit }),
    queryFn: () =>
      api.get<Paginated<Tenant>>(
        `/api/v1/tenants?page=${page}&limit=${limit}` +
          (normalizedQ ? `&q=${encodeURIComponent(normalizedQ)}` : "") +
          (sort ? `&sort=${sort}` : "") +
          (order ? `&order=${order}` : "")
      ),
    enabled: isLoaded && isSignedIn,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const unitsQuery = useQuery<Paginated<Unit>, Error>({
    queryKey: qk.units(1, 100),
    queryFn: () => api.get<Paginated<Unit>>(`/api/v1/units?page=1&limit=100`),
    enabled: isLoaded && isSignedIn,
  });

  // Accumulate pages
  useEffect(() => {
    if (!tenantsQuery.data) return;
    setItems((prev) => {
      if (page === 1) return tenantsQuery.data!.items;
      const next = [...prev, ...tenantsQuery.data!.items];
      return next;
    });
    if (page === 1) {
      isResettingRef.current = false;
    }
  }, [tenantsQuery.data, page]);

  // Reset pagination on filter changes
  const lastFilterKeyRef = useRef<string>("");
  const filterKey = `${normalizedQ ?? ""}|${sort}|${order}`;
  useEffect(() => {
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      isResettingRef.current = true;
      setPage(1);
    }
  }, [filterKey]);

  const tenants = items;
  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    (unitsQuery.data?.items ?? []).forEach((u) =>
      map.set(String(u.id), u.name)
    );
    return map;
  }, [unitsQuery.data]);

  const isRefetching = tenantsQuery.isFetching || unitsQuery.isRefetching;
  const onRefresh = useCallback(() => {
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: qk.tenantsList({ q: normalizedQ, sort, order, page: 1, limit }),
    });
    tenantsQuery.refetch();
    unitsQuery.refetch();
  }, [queryClient, tenantsQuery, unitsQuery, debouncedQ, sort, order, limit]);

  if (tenantsQuery.isPending && tenants.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: pageBg }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (tenantsQuery.isError && tenants.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: pageBg }]}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load tenants"
          body={tenantsQuery.error.message}
          action={<Button label="Try again" variant="secondary" onPress={() => tenantsQuery.refetch()} />}
        />
      </View>
    );
  }

  const currentSort = SORTS.find((s) => s.key === (sort || "created_at")) ?? SORTS[0];

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: pageBg }}>
      <View style={[styles.responsivePad, styles.controlsRow]}>
        <SearchField value={q} onChangeText={setQ} placeholder="Search tenants" style={{ flex: 1 }} />
        <Button
          label={currentSort.short}
          icon="swap-vertical"
          variant="secondary"
          accessibilityLabel={`Sort: ${currentSort.label}, ${order === "asc" ? "ascending" : "descending"}`}
          onPress={() => setSortOpen(true)}
          style={{ paddingHorizontal: 14 }}
        />
      </View>
      <FlatList
        data={tenants}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          tenants.length === 0 ? styles.flexGrow : undefined,
          styles.responsivePad,
          { paddingHorizontal: 16, paddingTop: 4, paddingBottom: Math.max(insets.bottom, 12) + 96 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => {
          if (tenantsQuery.isFetching) return null;
          return normalizedQ !== undefined ? (
            <EmptyState
              icon="search-outline"
              title="No tenants found"
              body={`Nothing matches "${normalizedQ}".`}
            />
          ) : (
            <EmptyState
              icon="people-outline"
              title="Add your first tenant"
              body="Tenants get a lease, a unit and a rent schedule."
              action={
                <Button
                  label="Add tenant"
                  icon="add"
                  onPress={() => (router as any).push("/tenants/new")}
                />
              }
            />
          );
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (isResettingRef.current) return;
          if (tenants.length === 0) return;
          if (tenantsQuery.data?.hasMore && !tenantsQuery.isFetching) {
            setPage((p) => p + 1);
          }
        }}
        renderItem={({ item, index }) => (
          <TenantRow
            tenant={item}
            index={index}
            count={tenants.length}
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
      <Fab accessibilityLabel="Add tenant" onPress={() => (router as any).push("/tenants/new")} />

      <Sheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        header={<SheetHeader label="Sort tenants" onClose={() => setSortOpen(false)} />}
      >
        {SORTS.map((opt) => (
          <SheetAction
            key={opt.key}
            label={opt.label}
            selected={currentSort.key === opt.key}
            onPress={() => {
              setSort(opt.key);
              setPage(1);
            }}
          />
        ))}
        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <Segmented
            options={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
            value={order ?? "desc"}
            onChange={(v) => setOrder(v)}
          />
        </View>
      </Sheet>
    </View>
  );
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    // Flush immediately when cleared (empty string) for snappy UX
    if (typeof value === "string" && value.length === 0) {
      setDebounced(value as T);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function TenantRow({
  tenant,
  unitName,
  index,
  count,
  onPress,
  onAssign,
}: {
  tenant: Tenant;
  unitName: string;
  index: number;
  count: number;
  onPress: () => void;
  onAssign: () => void;
}) {
  const name = tenant.full_name ?? (tenant as any).fullName ?? "-";
  const leaseEnd = tenant.lease_end ?? (tenant as any).leaseEnd ?? null;
  const unassigned = !tenant.unit_id;
  const avatarUri =
    (tenant as any).avatar_url || (tenant as any).image_url || null;
  const left = daysUntil(leaseEnd);
  // Near-term leases show the day (the badge carries the countdown); later ones just month and year.
  const near = left != null && left <= 60;
  const line = [unitName, leaseEnd ? `${left != null && left < 0 ? "ended" : "ends"} ${formatDate(leaseEnd, near)}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${name}, ${line}`}
      style={({ pressed }) => [
        groupedRow(index, count),
        styles.row,
        pressed && { backgroundColor: palette.page },
      ]}
    >
      <Avatar name={name} size={44} uri={avatarUri} />
      <View style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {line}
        </Text>
        {left != null && left <= 60 ? (
          <View style={{ marginTop: 6 }}>
            <Badge
              label={left < 0 ? "Lease ended" : left === 0 ? "Ends today" : `Ends in ${left}d`}
              tone={left < 0 ? "danger" : "warn"}
            />
          </View>
        ) : null}
      </View>
      {unassigned ? (
        <Button label="Assign" variant="secondary" size="sm" onPress={onAssign} />
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={palette.chevron} />
    </Pressable>
  );
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value.slice(0, 10) + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((end - today) / 86400000);
}

function formatDate(value?: string | null, near = false): string {
  if (!value) return "-";
  const d = new Date(value.slice(0, 10) + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString(
    undefined,
    near
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "short", year: "numeric", timeZone: "UTC" }
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 4,
    paddingBottom: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  flexGrow: { flexGrow: 1 },
  responsivePad: { alignSelf: "center", width: "100%", maxWidth: 1100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 68,
  },
  rowMain: { flex: 1, minWidth: 0 },
  name: { ...type.bodyStrong, color: palette.ink },
  sub: { ...type.caption, color: palette.muted, marginTop: 1 },
});
