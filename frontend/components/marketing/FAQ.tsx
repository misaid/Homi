import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { focusRing, m } from "./theme";

const faqs = [
  { q: "Is there a free plan?", a: "Yes, the Starter plan lets you manage up to 3 units." },
  { q: "Can I use it on my phone?", a: "Yes, Homi works on iOS, Android, and the web." },
  { q: "How do I invite teammates?", a: "Create an account, then invite them from settings." },
];

export default function FAQ() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <View style={s.wrapper}>
      <View style={[s.content, wide && { flexDirection: "row", gap: 80 }]}>
        <Text accessibilityRole="header" style={[s.title, { fontSize: wide ? 48 : 34 }, wide ? { flex: 5 } : { marginBottom: 28 }]}>
          Questions, answered.
        </Text>
        <View style={wide ? { flex: 7 } : undefined}>
          {faqs.map((x, i) => (
            <Item key={i} q={x.q} a={x.a} first={i === 0} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Item({ q, a, first }: { q: string; a: string; first: boolean }) {
  const [open, setOpen] = useState(first);
  const [f, setF] = useState(false);
  return (
    <View style={[s.item, first && { borderTopWidth: 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={[s.header, f && focusRing]}
      >
        <Text style={s.q}>{q}</Text>
        <Text style={s.plus}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open && <Text style={s.a}>{a}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.wash },
  content: { maxWidth: m.max, width: "100%", alignSelf: "center", paddingHorizontal: 20, paddingVertical: 96 },
  title: { fontFamily: m.display, fontWeight: "800", color: m.ink, letterSpacing: -1.2 },
  item: { borderBottomWidth: 1, borderColor: m.washDeep, paddingVertical: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  q: { fontFamily: m.display, fontSize: 21, fontWeight: "700", color: m.ink, flex: 1 },
  plus: { fontFamily: m.body, fontSize: 26, color: m.accent, width: 24, textAlign: "center" },
  a: { fontFamily: m.body, fontSize: 17, lineHeight: 26, color: m.inkSoft, marginTop: 12, maxWidth: 520 },
});
