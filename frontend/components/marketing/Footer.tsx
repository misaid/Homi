import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { m } from "./theme";

export default function Footer() {
  const router = useRouter();
  return (
    <View style={s.wrapper}>
      <View style={s.content}>
        <Text accessibilityRole="header" style={s.cta}>
          Ready to put your rentals in order?
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/sign-up")} style={s.btn}>
          <Text style={s.btnText}>Start free</Text>
        </Pressable>
        <View style={s.bottom}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="home" size={16} color={m.onDarkMuted} />
            <Text style={s.copy}>Homi · © {new Date().getFullYear()}</Text>
          </View>
          <Text style={s.copy}>Tenant management made easy.</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.ink },
  content: { maxWidth: m.max, width: "100%", alignSelf: "center", paddingHorizontal: 20, paddingTop: 96, paddingBottom: 32, alignItems: "flex-start", gap: 28 },
  cta: { fontFamily: m.display, fontSize: 44, lineHeight: 46, fontWeight: "800", color: m.onDark, letterSpacing: -1.5, maxWidth: 640 },
  btn: { backgroundColor: m.wash, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 999 },
  btnText: { fontFamily: m.body, fontWeight: "700", fontSize: 16, color: m.ink },
  bottom: { width: "100%", marginTop: 56, paddingTop: 24, borderTopWidth: 1, borderColor: "#2e2a66", flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  copy: { fontFamily: m.body, fontSize: 14, color: m.onDarkMuted },
});
