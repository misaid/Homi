import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { Notification, Paginated } from "@/lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigation } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

dayjs.extend(relativeTime);

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const api = useApi();
  const qc = useQueryClient();
  const nav = useNavigation();

  const fetchPage = useCallback(
    async ({ pageParam = 1 }): Promise<Paginated<Notification>> => {
      return api.get<Paginated<Notification>>(
        `/api/v1/notifications?page=${pageParam}&limit=${PAGE_SIZE}`
      );
    },
    [api]
  );

  const listQuery = useInfiniteQuery({
    queryKey: qk.notifications({ page: 1, limit: PAGE_SIZE }),
    queryFn: fetchPage,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.notifications({ page: 1, limit: PAGE_SIZE }) as any,
      });
      qc.invalidateQueries({ queryKey: qk.unreadCount as any });
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.patch(`/api/v1/notifications/read_all`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.notifications({ page: 1, limit: PAGE_SIZE }) as any,
      });
      qc.invalidateQueries({ queryKey: qk.unreadCount as any });
    },
  });

  const items = (listQuery.data?.pages || []).flatMap((p) => p.items);
  const onRefresh = () => listQuery.refetch();
  const onEnd = () => listQuery.fetchNextPage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
          <Text style={styles.link}>Mark all read</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={async () => {
              if (!item.read_at) await markRead.mutateAsync(item.id);
              // Optional deep links
              const data = item.data || {};
              if (data.unit_id)
                nav.navigate(
                  "/units/[id]" as never,
                  { id: data.unit_id } as never
                );
              if (data.tenant_id)
                nav.navigate(
                  "/tenants/[id]" as never,
                  { id: data.tenant_id } as never
                );
            }}
            style={[styles.item, !item.read_at && styles.unread]}
          >
            <View style={styles.row}>
              {!item.read_at && <View style={styles.dot} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
              <Text style={styles.time}>
                {dayjs(item.created_at).fromNow()}
              </Text>
            </View>
          </Pressable>
        )}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={onRefresh}
          />
        }
        onEndReached={onEnd}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You are all caught up</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: "700" },
  link: { color: "#2563eb", fontWeight: "600" },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  unread: { backgroundColor: "#f1f5f9" },
  row: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginTop: 6,
  },
  itemTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  itemBody: { fontSize: 13, color: "#374151" },
  time: { fontSize: 12, color: "#6b7280" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  emptyText: { color: "#6b7280" },
});
