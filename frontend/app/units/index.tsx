// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { UnitCard } from "@/components/UnitCard";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import type { Paginated, Unit } from "@/lib/types";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function UnitsScreen() {
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textMuted = Colors[colorScheme ?? "light"].mutedText;
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
    keepPreviousData: true,
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
          <View style={styles.responsiveCenter}>
            <HeaderSearch value={search} onChange={setSearch} />
          </View>
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
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 72 },
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
          return showEmpty ? (
            <View style={styles.center}>
              <Text style={[styles.muted, { color: textMuted }]}>
                No units found
              </Text>
            </View>
          ) : null;
        }}
        ListFooterComponent={
          query.isFetching ? (
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

const HeaderSearch = memo(function HeaderSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search units..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
});

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
  listContent: { paddingVertical: 4, paddingBottom: 72 },
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
  searchContainer: {
    paddingHorizontal: 16,
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
