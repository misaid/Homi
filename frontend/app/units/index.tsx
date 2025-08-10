// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { useInfiniteQuery } from "@tanstack/react-query";
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

type Unit = {
  id: string | number;
  name: string;
  address?: string | null;
  monthly_rent?: number | null;
};

type UnitsResponse = {
  items: Unit[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export default function UnitsScreen() {
  const api = useApi();

  const query = useInfiniteQuery<UnitsResponse, Error>({
    queryKey: ["units", PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) =>
      api.get<UnitsResponse>(`/v1/units?page=${pageParam}&limit=${PAGE_SIZE}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
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

  if (units.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No units found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={units}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <UnitRow unit={item} />}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} />
      }
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}

function UnitRow({ unit }: { unit: Unit }) {
  const rent =
    typeof unit.monthly_rent === "number"
      ? `$${unit.monthly_rent.toLocaleString()}`
      : "N/A";
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{unit.name}</Text>
      {!!unit.address && <Text style={styles.sub}>{unit.address}</Text>}
      <Text style={styles.rent}>{rent} monthly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  muted: {
    color: "#666",
    marginTop: 8,
  },
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
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sub: {
    color: "#444",
    marginBottom: 6,
  },
  rent: {
    color: "#111",
    fontWeight: "500",
  },
  footerLoading: {
    paddingVertical: 16,
  },
});
