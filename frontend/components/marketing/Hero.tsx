import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Hero() {
  const router = useRouter();
  const [focusA, setFocusA] = useState(false);
  const [focusB, setFocusB] = useState(false);
  const [hoverA, setHoverA] = useState(false);
  const [hoverB, setHoverB] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <View style={styles.textCol}>
          <Text style={styles.eyebrow}>Tenant management</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Track units, tenants, rent, and issues in one place
          </Text>
          <Text style={styles.subtitle}>
            Homi helps small property managers stay organized with a simple,
            fast workflow that works on mobile and web.
          </Text>
          <View style={styles.ctaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get started"
              onPress={() => router.push("/(auth)/sign-up")}
              onMouseEnter={() => setHoverA(true)}
              onMouseLeave={() => setHoverA(false)}
              onFocus={() => setFocusA(true)}
              onBlur={() => setFocusA(false)}
              style={[
                styles.btn,
                styles.btnPrimary,
                hoverA && { opacity: 0.9 },
                focusA && styles.focused,
              ]}
            >
              <Text style={styles.btnPrimaryText}>Get started</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Log in"
              onPress={() => router.push("/(auth)/sign-in")}
              onMouseEnter={() => setHoverB(true)}
              onMouseLeave={() => setHoverB(false)}
              onFocus={() => setFocusB(true)}
              onBlur={() => setFocusB(false)}
              style={[
                styles.btn,
                styles.btnGhost,
                hoverB && { opacity: 0.9 },
                focusB && styles.focused,
              ]}
            >
              <Text style={styles.btnGhostText}>Log in</Text>
            </Pressable>
          </View>
        </View>
        <Image
          accessibilityLabel="Hero illustration showing property management"
          source={require("@/assets/images/hero-illustration.webp")}
          style={styles.illustration}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: "#fff" },
  content: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 56,
    gap: 24,
    flexDirection: "column",
  },
  textCol: { gap: 12 },
  eyebrow: { color: "#3b82f6", fontWeight: "700", letterSpacing: 0.6 },
  title: { fontSize: 36, fontWeight: "800", color: "#111", lineHeight: 42 },
  subtitle: { fontSize: 16, color: "#374151", lineHeight: 22 },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  focused: Platform.select({
    web: { outlineWidth: 2, outlineColor: "#3b82f6", outlineStyle: "solid" },
    default: {},
  }),
  btnPrimary: { backgroundColor: "#3b82f6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  btnGhostText: { color: "#111", fontWeight: "600" },
  illustration: {
    marginTop: 8,
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
