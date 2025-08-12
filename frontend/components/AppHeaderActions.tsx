// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { useThemeController } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/useColorScheme";

type Props = {
  side?: "left" | "right";
};

export default function AppHeaderActions({ side = "left" }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { override, setOverride } = useThemeController();
  const api = useApi();

  const unreadQuery = useQuery({
    queryKey: qk.unreadCount,
    queryFn: async () => {
      const res = await api.get<{ items: any[]; total: number }>(
        "/api/v1/notifications?only_unread=true&page=1&limit=1"
      );
      return res.total as number;
    },
    refetchInterval: 30000,
  });

  function onPressNotifications() {
    router.push("/notifications");
  }

  function navigateSettings() {
    setOpen(false);
    router.push("/settings");
  }

  return (
    <View style={styles.row}>
      {side === "left" && (
        <Pressable
          accessibilityLabel="Open menu"
          onPress={() => setOpen(true)}
          hitSlop={8}
          style={styles.btn}
        >
          <Ionicons name="menu" size={22} color={tint} />
        </Pressable>
      )}

      {side === "right" && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Theme toggle */}
          <Pressable
            accessibilityLabel={
              colorScheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            onPress={() => {
              if (override === "light" || override === "dark") {
                setOverride(override === "light" ? "dark" : "light");
              } else {
                // If following system, toggle opposite of current scheme
                setOverride(colorScheme === "dark" ? "light" : "dark");
              }
            }}
            hitSlop={8}
            style={styles.btn}
          >
            <Ionicons
              name={
                colorScheme === "dark"
                  ? ("sunny-outline" as any)
                  : ("moon-outline" as any)
              }
              size={22}
              color={tint}
            />
          </Pressable>

          {/* Notifications */}
          <View style={{ position: "relative" }}>
            <Pressable
              accessibilityLabel="Notifications"
              onPress={onPressNotifications}
              hitSlop={8}
              style={styles.btn}
            >
              <Ionicons name="notifications-outline" size={22} color={tint} />
            </Pressable>
            {unreadQuery.data && unreadQuery.data > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadQuery.data > 99 ? "99+" : unreadQuery.data}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {side === "left" && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable
              style={[
                styles.menu,
                { backgroundColor: Colors[colorScheme ?? "light"].card },
              ]}
              onPress={() => {}}
            >
              <Text
                style={[
                  styles.menuTitle,
                  { color: Colors[colorScheme ?? "light"].mutedText },
                ]}
              >
                Menu
              </Text>
              <View style={{ height: 4 }} />
              <Text
                style={[
                  styles.menuTitle,
                  { color: Colors[colorScheme ?? "light"].mutedText },
                ]}
              >
                Appearance
              </Text>
              <Pressable
                accessibilityLabel={
                  colorScheme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                onPress={() => {
                  if (override === "light" || override === "dark") {
                    setOverride(override === "light" ? "dark" : "light");
                  } else {
                    setOverride(colorScheme === "dark" ? "light" : "dark");
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name={
                    colorScheme === "dark"
                      ? ("sunny-outline" as any)
                      : ("moon-outline" as any)
                  }
                  size={18}
                  color={Colors[colorScheme ?? "light"].text}
                />
                <Text style={{ color: Colors[colorScheme ?? "light"].text }}>
                  {colorScheme === "dark" ? "Light mode" : "Dark mode"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Go to Settings"
                style={styles.menuItem}
                onPress={navigateSettings}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Settings
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="About"
                style={styles.menuItem}
                onPress={() => {
                  setOpen(false);
                  Alert.alert("About", "Homi app v1.0");
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  About
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Sign out"
                style={styles.menuItem}
                onPress={async () => {
                  setOpen(false);
                  try {
                    await signOut();
                  } catch {}
                  // After sign-out, ensure navigation to a public route
                  if (Platform.OS === "web") {
                    router.replace("/(marketing)");
                  } else {
                    router.replace("/(auth)/sign-in");
                  }
                }}
              >
                <Ionicons
                  name="exit-outline"
                  size={18}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Sign out
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  badgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#ef4444",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingTop: 64,
    paddingHorizontal: 12,
  },
  menu: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  menuTitle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  menuItemText: { fontSize: 14, color: "#111827" },
});
