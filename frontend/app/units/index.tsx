// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { UnitCard } from "@/components/UnitCard";
import { Button, EmptyState, Fab, SearchField } from "@/components/ui";
import { palette } from "@/constants/theme";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import type { Paginated, Unit } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function UnitsScreen() {
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<Unit[]>([]);
  const isResettingRef = useRef<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Fetch one page at a time like Tenants
  const query = useQuery<Paginated<Unit>, Error>({
    queryKey: ["units", { q: debounced || undefined, page, limit: PAGE_SIZE }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (debounced) params.set("q", debounced);
      return api.get<Paginated<Unit>>(`/api/v1/units?${params.toString()}`);
    },
    enabled: isLoaded && isSignedIn,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Accumulate pages
  useEffect(() => {
    if (!query.data) return;
    setItems((prev) => {
      if (page === 1 || isResettingRef.current) {
        isResettingRef.current = false;
        return query.data!.items;
      }
      return [...prev, ...query.data!.items];
    });
  }, [query.data, page]);

  // Reset pagination on search change
  const lastFilterRef = useRef<string>("");
  useEffect(() => {
    const key = debounced;
    if (lastFilterRef.current !== key) {
      lastFilterRef.current = key;
      isResettingRef.current = true;
      setPage(1);
    }
  }, [debounced]);

  const units = items;

  const onRefresh = useCallback(() => {
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: [
        "units",
        { q: debounced || undefined, page: 1, limit: PAGE_SIZE },
      ],
    });
    query.refetch();
  }, [queryClient, query, debounced]);

  const onEndReached = useCallback(() => {
    if (isResettingRef.current) return;
    if (query.data?.hasMore && !query.isFetching) {
      setPage((p) => p + 1);
    }
  }, [query.data?.hasMore, query.isFetching]);

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search units"
            style={styles.search}
          />
        }
        renderItem={({ item }) => (
          <UnitCard
            id={String(item.id)}
            name={item.name}
            address={item.address}
            monthly_rent={item.monthly_rent}
            beds={item.beds}
            baths={item.baths}
            photos={
              item.display_url
                ? [item.display_url]
                : item.image_url
                ? [item.image_url]
                : item.photos && item.photos.length > 0
                ? item.photos
                : item.cover_image_uri
                ? [item.cover_image_uri]
                : []
            }
            occupants_count={item.occupants_count ?? 0}
            onAddOccupant={() =>
              router.push({
                pathname: "/tenants/new",
                params: { unit_id: String(item.id) },
              })
            }
            onPress={() =>
              router.push({
                pathname: "/units/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          styles.responsivePad,
          { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 96 },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListEmptyComponent={() => {
          const showEmpty =
            !query.isPending && (query.data?.items?.length ?? 0) === 0;
          if (!showEmpty) return null;
          return debounced ? (
            <EmptyState
              icon="search-outline"
              title="No units found"
              body={`Nothing matches "${debounced}".`}
            />
          ) : (
            <EmptyState
              icon="business-outline"
              title="Add your first unit"
              body="Units hold your tenants, rent schedule and maintenance issues."
              action={<Button label="Add unit" icon="add" onPress={() => router.push("/units/new")} />}
            />
          );
        }}
        ListFooterComponent={
          query.isFetching ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={palette.tint} />
            </View>
          ) : null
        }
      />
      <Fab
        accessibilityLabel="Add unit"
        bottom={16}
        onPress={() => router.push("/units/new")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 96 },
  responsivePad: { alignSelf: "center", width: "100%", maxWidth: 1100 },
  search: { marginHorizontal: 16, marginBottom: 8 },
  footerLoading: { paddingVertical: 16 },
});
