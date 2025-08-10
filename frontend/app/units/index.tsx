// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Unit } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import { useInfiniteQuery } from "@tanstack/react-query";
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

const PAGE_SIZE = 20;

export default function UnitsScreen() {
  const api = useApi();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const query = useInfiniteQuery<Paginated<Unit>, Error>({
    queryKey: qk.units(1, PAGE_SIZE),
    queryFn: ({ pageParam = 1 }) =>
      api.get<Paginated<Unit>>(
        `/api/v1/units?page=${pageParam}&limit=${PAGE_SIZE}`
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: isLoaded && isSignedIn,
  });

  const units = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const onRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (query.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading units...</Text>
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{query.error.message}</Text>
        <Pressable onPress={() => query.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UnitRow
            unit={item}
            onPress={() =>
              router.push({
                pathname: "/units/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={onRefresh}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.muted}>No units found</Text>
          </View>
        )}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
      <Pressable style={styles.fab} onPress={() => router.push("/units/new")}>
        <Text style={styles.fabText}>Add</Text>
      </Pressable>
    </View>
  );
}

function UnitRow({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const rent = `$${Number(unit.monthly_rent ?? 0).toLocaleString()}`;
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={styles.title}>{unit.name}</Text>
      {!!unit.address && <Text style={styles.sub}>{unit.address}</Text>}
      <Text style={styles.rent}>{rent} monthly</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  muted: { color: "#666", marginTop: 8 },
  errorText: {
    color: "#b00020",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: "#1b73e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: { color: "white", fontWeight: "600" },
  listContent: { padding: 12, paddingBottom: 72 },
  item: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  sub: { color: "#444", marginBottom: 6 },
  rent: { color: "#111", fontWeight: "500" },
  footerLoading: { paddingVertical: 16 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  fabText: { color: "#fff", fontWeight: "700" },
});
