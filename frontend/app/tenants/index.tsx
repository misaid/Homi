// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, TenantsQuery, Unit } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: pageBg }}>
      <View style={styles.responsivePad}>
        <Controls
          q={q}
          onChangeQ={setQ}
          sort={sort}
          onChangeSort={(v) => {
            setSort(v);
            setPage(1);
          }}
          order={order}
          onChangeOrder={(v) => setOrder(v)}
        />
      </View>
      <FlatList
        data={tenants}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          tenants.length === 0 ? styles.flexGrow : undefined,
          styles.responsivePad,
          { paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) + 72 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => {
          const showEmpty =
            normalizedQ !== undefined &&
            !tenantsQuery.isFetching &&
            (tenantsQuery.data?.items?.length ?? 0) === 0;
          return showEmpty ? (
            <View style={styles.center}>
              <Text style={styles.muted}>No tenants found</Text>
            </View>
          ) : null;
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (isResettingRef.current) return;
          if (tenants.length === 0) return;
          if (tenantsQuery.data?.hasMore && !tenantsQuery.isFetching) {
            setPage((p) => p + 1);
          }
        }}
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

const Controls = memo(function Controls({
  q,
  onChangeQ,
  sort,
  onChangeSort,
  order,
  onChangeOrder,
}: {
  q: string;
  onChangeQ: (v: string) => void;
  sort: TenantsQuery["sort"];
  onChangeSort: (v: TenantsQuery["sort"]) => void;
  order: TenantsQuery["order"];
  onChangeOrder: (v: TenantsQuery["order"]) => void;
}) {
  const colorScheme = useColorScheme();
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textColor = Colors[colorScheme ?? "light"].text;
  const textMuted = Colors[colorScheme ?? "light"].mutedText;
  const sortLabel = (s: TenantsQuery["sort"]) => {
    switch (s) {
      case "name":
        return "Name";
      case "lease_start":
        return "Lease start";
      case "lease_end":
        return "Lease end";
      default:
        return "Recently added";
    }
  };

  return (
    <View>
      <View style={styles.controlsRow}>
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
            accessibilityLabel="Search tenants"
            placeholder="Search tenants"
            placeholderTextColor={textMuted}
            value={q}
            onChangeText={onChangeQ}
            style={[styles.searchInput, { color: textColor }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            importantForAutofill="no"
          />
        </View>
        {q?.length ? (
          <Pressable
            accessibilityLabel="Clear search"
            onPress={() => onChangeQ("")}
            style={[
              styles.clearBtn,
              {
                backgroundColor: colorScheme === "dark" ? "#1f2937" : "#f3f4f6",
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
      <View style={styles.chipsRow} accessibilityLabel="Sort by">
        {(
          [
            { key: "name", label: "Name" },
            { key: "lease_start", label: "Lease start" },
            { key: "lease_end", label: "Lease end" },
            { key: "created_at", label: "Recently added" },
          ] as Array<{ key: TenantsQuery["sort"]; label: string }>
        ).map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => onChangeSort(opt.key)}
            style={[
              styles.chip,
              (sort || "created_at") === opt.key ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                (sort || "created_at") === opt.key
                  ? styles.chipTextActive
                  : null,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chipsRow} accessibilityLabel="Sort order">
        {(["asc", "desc"] as const).map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChangeOrder(opt)}
            style={[styles.chip, order === opt ? styles.chipActive : null]}
          >
            <Text
              style={[
                styles.chipText,
                order === opt ? styles.chipTextActive : null,
              ]}
            >
              {opt === "asc" ? "Asc" : "Desc"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

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
  onPress,
  onAssign,
}: {
  tenant: Tenant;
  unitName: string;
  onPress: () => void;
  onAssign: () => void;
}) {
  const colorScheme = useColorScheme();
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textColor = Colors[colorScheme ?? "light"].text;
  const name = tenant.full_name ?? (tenant as any).fullName ?? "-";
  const email = tenant.email ?? null;
  const leaseStart = tenant.lease_start ?? (tenant as any).leaseStart ?? null;
  const leaseEnd = tenant.lease_end ?? (tenant as any).leaseEnd ?? null;
  const unassigned = !tenant.unit_id;
  const avatarUri =
    (tenant as any).avatar_url || (tenant as any).image_url || null;
  const initials = (name || "-")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: cardBg, borderBottomColor: border },
      ]}
    >
      <View style={styles.rowHeader}>
        <View style={styles.leftHeaderWrap}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1f2937" : "#e5e7eb",
                  },
                ]}
              >
                <Text style={styles.avatarText}>{initials || "T"}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
              {name}
            </Text>
            {!!email && (
              <Text
                style={[
                  styles.email,
                  { color: Colors[colorScheme ?? "light"].mutedText },
                ]}
                numberOfLines={1}
              >
                {email}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
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
      <Text
        style={[
          styles.lease,
          { color: Colors[colorScheme ?? "light"].mutedText },
        ]}
      >
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
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    paddingTop: 8,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchInput: {
    flex: 1,
    paddingRight: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
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
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  chipText: { fontSize: 12, color: "#111827" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flexGrow: { flexGrow: 1 },
  responsivePad: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1100,
  },
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
    paddingVertical: 14,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#fff",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftHeaderWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#111827", fontWeight: "700" },
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
