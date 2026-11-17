import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { focusRing, m } from "./theme";

const plans = [
  { name: "Starter", price: "$0", desc: "Manage up to 3 units.", feats: ["3 units", "Tenants and rent tracking", "Issue log"] },
  { name: "Pro", price: "$19", desc: "For growing portfolios.", feats: ["Unlimited units", "Photo uploads", "Push notifications"], hot: true },
  { name: "Business", price: "$49", desc: "For small teams and agencies.", feats: ["Everything in Pro", "Invite teammates", "Per-organization scoping"] },
];

export default function Pricing() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  return (
    <View style={s.wrapper}>
      <View style={s.content}>
        <Text accessibilityRole="header" style={[s.title, { fontSize: width >= 900 ? 48 : 34 }]}>
          Simple pricing
        </Text>
        <Text style={s.sub}>Start free. Upgrade when your portfolio does.</Text>
        <View style={s.row}>
          {plans.map((p) => (
            <Plan key={p.name} {...p} onSelect={() => router.push("/(auth)/sign-up")} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Plan({ name, price, desc, feats, hot, onSelect }: any) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  const fg = hot ? m.onDark : m.ink;
  const mu = hot ? m.onDarkMuted : m.inkSoft;
  return (
    <View style={[s.card, hot && { backgroundColor: m.ink, borderColor: m.ink }]}>
      <Text style={[s.planName, { color: fg }]}>{name}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
        <Text style={[s.price, { color: fg }]}>{price}</Text>
        <Text style={[s.per, { color: mu }]}>/mo</Text>
      </View>
      <Text style={[s.desc, { color: mu }]}>{desc}</Text>
      <View style={{ gap: 10, marginVertical: 24 }}>
        {feats.map((t: string) => (
          <Text key={t} style={[s.feat, { color: fg }]}>
            ✓  {t}
          </Text>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${name}`}
        onPress={onSelect}
        onHoverIn={() => setH(true)}
        onHoverOut={() => setH(false)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={[
          s.btn,
          hot
            ? { backgroundColor: h ? "#fff" : m.wash }
            : { backgroundColor: h ? m.accentDark : m.accent },
          f && focusRing,
        ]}
      >
        <Text style={[s.btnText, { color: hot ? m.ink : "#fff" }]}>Get started</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.paper },
  content: { maxWidth: m.max, width: "100%", alignSelf: "center", paddingHorizontal: 20, paddingVertical: 96 },
  title: { fontFamily: m.display, fontWeight: "800", color: m.ink, letterSpacing: -1.2 },
  sub: { fontFamily: m.body, fontSize: 18, color: m.inkSoft, marginTop: 12, marginBottom: 48 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  card: {
    flexGrow: 1, flexBasis: 280, borderRadius: 28, borderWidth: 1.5, borderColor: m.line,
    padding: 32, backgroundColor: "#fff",
  },
  planName: { fontFamily: m.display, fontSize: 20, fontWeight: "700" },
  price: { fontFamily: m.display, fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  per: { fontFamily: m.body, fontSize: 16, marginLeft: 4 },
  desc: { fontFamily: m.body, fontSize: 16, marginTop: 4 },
  feat: { fontFamily: m.body, fontSize: 15 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  btnText: { fontFamily: m.body, fontWeight: "700", fontSize: 15 },
});
