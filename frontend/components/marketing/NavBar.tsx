import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onGoToPricing?: () => void;
  onGoToFAQ?: () => void;
};

export default function NavBar({ onGoToPricing, onGoToFAQ }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.logo}>
          Homi
        </Text>

        <View style={styles.spacer} />

        <View style={styles.linksRow}>
          <NavLink
            label="Pricing"
            onPress={onGoToPricing}
            accessibilityLabel="Go to pricing"
          />
          <NavLink
            label="FAQ"
            onPress={onGoToFAQ}
            accessibilityLabel="Go to frequently asked questions"
          />
        </View>

        <View style={styles.actionsRow}>
          <ButtonLink
            label="Log in"
            variant="ghost"
            onPress={() => router.push("/(auth)/sign-in")}
            accessibilityLabel="Log in"
          />
          <ButtonLink
            label="Get started"
            variant="primary"
            onPress={() => router.push("/(auth)/sign-up")}
            accessibilityLabel="Get started"
          />
        </View>
      </View>
    </View>
  );
}

function NavLink({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.navLink,
        hovered && styles.hovered,
        focused && styles.focused,
      ]}
    >
      <Text style={styles.navLinkText}>{label}</Text>
    </Pressable>
  );
}

function ButtonLink({
  label,
  onPress,
  accessibilityLabel,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: "primary" | "ghost";
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const base = [
    styles.btn,
    variant === "primary" ? styles.btnPrimary : styles.btnGhost,
  ];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[base, hovered && { opacity: 0.9 }, focused && styles.focused]}
    >
      <Text
        style={
          variant === "primary" ? styles.btnPrimaryText : styles.btnGhostText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  content: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  spacer: { flex: 1 },
  linksRow: {
    flexDirection: "row",
    gap: 16,
    marginRight: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  navLink: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hovered: { opacity: 0.9 },
  focused: Platform.select({
    web: { outlineWidth: 2, outlineColor: "#3b82f6", outlineStyle: "solid" },
    default: {},
  }),
  navLinkText: { color: "#111", fontSize: 14 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#3b82f6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  btnGhostText: { color: "#111", fontWeight: "600" },
});
