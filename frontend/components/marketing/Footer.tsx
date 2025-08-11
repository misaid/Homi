import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export default function Footer() {
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <View style={styles.linksRow}>
          <FooterLink label="Privacy" onPress={() => {}} />
          <FooterLink label="Terms" onPress={() => {}} />
          <FooterLink label="Contact" onPress={() => {}} />
        </View>
        <Text style={styles.copy}>© {new Date().getFullYear()} Homi</Text>
      </View>
    </View>
  );
}

function FooterLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.link,
        hovered && { opacity: 0.9 },
        focused && styles.focused,
      ]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  content: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  linksRow: { flexDirection: "row", gap: 12 },
  link: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  focused: Platform.select({
    web: { outlineWidth: 2, outlineColor: "#3b82f6", outlineStyle: "solid" },
    default: {},
  }),
  linkText: { color: "#111" },
  copy: { color: "#6b7280" },
});
