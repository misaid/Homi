// All data fetching must use lib/api useApi(). Do not call fetch directly.
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type Props = {
  side?: "left" | "right";
};

export default function AppHeaderActions({ side = "left" }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const [open, setOpen] = useState(false);

  function onPressNotifications() {
    try {
      Alert.alert("Notifications", "No new notifications");
    } catch {}
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
        <View style={{ position: "relative" }}>
          <Pressable
            accessibilityLabel="Notifications"
            onPress={onPressNotifications}
            hitSlop={8}
            style={styles.btn}
          >
            <Ionicons name="notifications-outline" size={22} color={tint} />
          </Pressable>
          <View style={styles.badgeDot} />
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
            <Pressable style={styles.menu} onPress={() => {}}>
              <Text style={styles.menuTitle}>Menu</Text>
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
                <Text style={styles.menuItemText}>Settings</Text>
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
                <Text style={styles.menuItemText}>About</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Sign out"
                style={styles.menuItem}
                onPress={() => {
                  setOpen(false);
                  Alert.alert(
                    "Sign out",
                    "Use the Settings screen to sign out."
                  );
                }}
              >
                <Ionicons
                  name="exit-outline"
                  size={18}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.menuItemText}>Sign out</Text>
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
