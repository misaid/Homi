import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Phone from "./Phone";
import { focusRing, m } from "./theme";

export default function Hero() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const phoneW = wide ? 230 : Math.min(180, (width - 60) / 1.7);
  const phoneH = (phoneW * 0.94 * 2400) / 1080 + phoneW * 0.06;
  const stageH = phoneH + 60;
  return (
    <View style={s.wrapper}>
      <View style={[s.content, wide && { flexDirection: "row", alignItems: "center" }]}>
        <View style={[s.textCol, wide && { flex: 1, paddingRight: 24, minWidth: 0 }]}>
          <Text accessibilityRole="header" style={[s.title, { fontSize: wide ? 58 : 42, lineHeight: wide ? 60 : 44 }]}>
            Every unit, tenant and rent payment in one calm place.
          </Text>
          <Text style={s.subtitle}>
            Homi is a lightweight property manager for independent landlords and
            small teams. Track who lives where, who has paid, and what needs
            fixing, from your phone or the web.
          </Text>
          <View style={s.ctaRow}>
            <Cta label="Start free" primary onPress={() => router.push("/(auth)/sign-up")} />
            <Cta label="Log in" onPress={() => router.push("/(auth)/sign-in")} />
          </View>
          <Text style={s.note}>Free for up to 3 units. No card needed.</Text>
        </View>
        <View style={[s.stage, { height: stageH }, wide && { flex: 1, minWidth: 0 }]}>
          <View style={s.blobA} />
          <View style={s.blobB} />
          <Phone
            source={require("@/assets/images/units.png")}
            width={phoneW}
            label="Units screen"
            style={{ position: "absolute", left: "50%", marginLeft: -phoneW * 1.0, top: 50, transform: [{ rotate: "-5deg" }] }}
          />
          <Phone
            source={require("@/assets/images/home.png")}
            width={phoneW}
            label="Home screen with issues"
            style={{ position: "absolute", left: "50%", marginLeft: -phoneW * 0.0, top: 0, transform: [{ rotate: "4deg" }] }}
          />
        </View>
      </View>
    </View>
  );
}

function Cta({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
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
      style={[
        s.btn,
        primary ? { backgroundColor: h ? m.accentDark : m.accent } : { borderWidth: 1.5, borderColor: h ? m.accent : m.washDeep },
        f && focusRing,
      ]}
    >
      <Text style={[s.btnText, { color: primary ? "#fff" : m.ink }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.paper, overflow: "hidden" },
  content: {
    maxWidth: m.max,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 72,
    gap: 40,
  },
  textCol: { gap: 22 },
  title: { fontFamily: m.display, fontWeight: "800", color: m.ink, letterSpacing: -2 },
  subtitle: { fontFamily: m.body, fontSize: 19, lineHeight: 29, color: m.inkSoft, maxWidth: 520 },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" },
  btn: { paddingHorizontal: 26, paddingVertical: 15, borderRadius: 999, alignItems: "center" },
  btnText: { fontFamily: m.body, fontWeight: "700", fontSize: 16 },
  note: { fontFamily: m.body, fontSize: 14, color: m.inkMuted },
  stage: { width: "100%" },
  blobA: {
    position: "absolute", left: "8%", right: "4%", top: 40, bottom: 0,
    backgroundColor: m.wash, borderTopLeftRadius: 220, borderTopRightRadius: 40,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 220,
  },
  blobB: {
    position: "absolute", right: "2%", top: 10, width: 70, height: 70,
    borderRadius: 35, backgroundColor: m.washDeep,
  },
});
