import { EmptyState, IconButton, groupedRow } from "@/components/ui";
import { palette, status } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useApi } from "@/lib/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { qk } from "@/lib/queryKeys";
import { Notification, Paginated } from "@/lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigation, useRouter } from "expo-router";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const hasUnread = items.some((i) => !i.read_at);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))}
        />
        <Text style={styles.title}>Notifications</Text>
        {hasUnread ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.link}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const k = kindOf(item.kind);
          const unread = !item.read_at;
          return (
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
              style={({ pressed }) => [
                groupedRow(index, items.length),
                styles.item,
                unread && { backgroundColor: "#fbfaff" },
                pressed && { backgroundColor: palette.page },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: status[k.tone].bg }]}>
                <Ionicons name={k.icon} size={18} color={status[k.tone].fg} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemTitle, unread && font("body", 700)]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.time}>{dayjs(item.created_at).fromNow(true)}</Text>
                </View>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
              {unread ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={onRefresh}
          />
        }
        onEndReached={onEnd}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() =>
          listQuery.isPending ? null : (
            <EmptyState
              icon="notifications-off-outline"
              title="You're all caught up"
              body="Rent reminders, new issues and lease dates will show up here."
            />
          )
        }
      />
    </View>
  );
}

function kindOf(kind?: string): {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: "info" | "warn" | "danger" | "neutral";
} {
  switch (kind) {
    case "rent":
      return { icon: "card-outline", tone: "info" };
    case "issue":
      return { icon: "construct-outline", tone: "warn" };
    case "lease":
      return { icon: "calendar-outline", tone: "neutral" };
    default:
      return { icon: "notifications-outline", tone: "neutral" };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.page },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingRight: 16,
    marginBottom: 8,
  },
  title: { ...type.title, color: palette.ink, flex: 1 },
  link: { ...font("body", 600), fontSize: 14, color: palette.tint },
  list: { paddingHorizontal: 16, paddingBottom: 32, alignSelf: "center", width: "100%", maxWidth: 720 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  itemTitle: { ...type.label, color: palette.ink, flex: 1 },
  itemBody: { ...type.caption, color: palette.inkSoft, marginTop: 2 },
  time: { ...type.micro, color: palette.faint },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.tint, marginTop: 6 },
});
