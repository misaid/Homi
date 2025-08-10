// app/tenants/index.tsx
// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useApi } from "../../lib/api";

type Tenant = {
  id: string;
  full_name: string;
  email?: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
};

type TenantsResponse = {
  items: Tenant[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export default function TenantsScreen() {
  const api = useApi();

  const fetchPage = useCallback(
    async ({ pageParam }: { pageParam: number }): Promise<TenantsResponse> => {
      return api.get<TenantsResponse>(
        `/v1/tenants?page=${pageParam}&limit=${PAGE_SIZE}`
      );
    },
    [api]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["tenants", PAGE_SIZE],
    queryFn: fetchPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const tenants = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]);

  const onRefresh = useCallback(() => {
    return refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && tenants.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading tenants...</Text>
      </View>
    );
  }

  if (isError && tenants.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {(error as Error)?.message || "Failed to load tenants"}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      data={tenants}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={tenants.length === 0 ? styles.flexGrow : undefined}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.muted}>No tenants found</Text>
        </View>
      }
      renderItem={({ item }) => <TenantRow tenant={item} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}

function TenantRow({ tenant }: { tenant: Tenant }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.name}>{tenant.full_name}</Text>
        {!!tenant.email && <Text style={styles.email}>{tenant.email}</Text>}
      </View>
      <Text style={styles.lease}>
        {formatDate(tenant.lease_start)} → {formatDate(tenant.lease_end)}
      </Text>
    </View>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  // Expecting ISO string from API. Show YYYY-MM-DD.
  return value.slice(0, 10);
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
  muted: {
    color: "#6b7280",
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#fff",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  email: {
    fontSize: 12,
    color: "#6b7280",
  },
  lease: {
    fontSize: 13,
    color: "#374151",
  },
  footer: {
    paddingVertical: 16,
  },
});
