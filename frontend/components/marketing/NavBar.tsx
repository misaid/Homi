import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { focusRing, m } from "./theme";

type Props = { onGoToPricing?: () => void; onGoToFAQ?: () => void };

export default function NavBar({ onGoToPricing, onGoToFAQ }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  return (
    <View style={s.wrapper}>
      <View style={s.content}>
        <View style={s.brand}>
          <View style={s.mark}>
            <Ionicons name="home" size={16} color="#fff" />
          </View>
          <Text accessibilityRole="header" style={s.logo}>
            Homi
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {wide && (
          <View style={s.links}>
            <Link label="Pricing" onPress={onGoToPricing} />
            <Link label="FAQ" onPress={onGoToFAQ} />
            <Link label="Log in" onPress={() => router.push("/(auth)/sign-in")} />
          </View>
        )}
        <Btn label="Get started" onPress={() => router.push("/(auth)/sign-up")} />
      </View>
    </View>
  );
}

function Link({ label, onPress }: { label: string; onPress?: () => void }) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      onHoverIn={() => setH(true)}
      onHoverOut={() => setH(false)}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={[s.link, f && focusRing]}
    >
      <Text style={[s.linkText, h && { color: m.accent }]}>{label}</Text>
    </Pressable>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setH(true)}
      onHoverOut={() => setH(false)}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={[s.btn, h && { backgroundColor: m.accentDark }, f && focusRing]}
    >
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.paper },
  content: {
    maxWidth: m.max,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: m.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { fontFamily: m.display, fontSize: 22, fontWeight: "800", color: m.ink, letterSpacing: -0.5 },
  links: { flexDirection: "row", gap: 6, marginRight: 14 },
  link: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  linkText: { fontFamily: m.body, fontSize: 15, fontWeight: "500", color: m.inkSoft },
  btn: { backgroundColor: m.accent, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999 },
  btnText: { fontFamily: m.body, color: "#fff", fontWeight: "700", fontSize: 15 },
});
