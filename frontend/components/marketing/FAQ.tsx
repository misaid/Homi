import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const faqs = [
  {
    q: "Is there a free plan?",
    a: "Yes, the Starter plan lets you manage up to 3 units.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes, Homi works on iOS, Android, and the web.",
  },
  {
    q: "How do I invite teammates?",
    a: "Create an account, then invite them from settings.",
  },
];

export default function FAQ() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          FAQ
        </Text>
        <View style={styles.list}>
          {faqs.map((item, idx) => (
            <FaqItem key={idx} q={item.q} a={item.a} />
          ))}
        </View>
      </View>
    </View>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={q}
        onPress={() => setOpen((v) => !v)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.itemHeader, focused && styles.focused]}
      >
        <Text style={styles.question}>{q}</Text>
        <Text style={styles.expand}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open && <Text style={styles.answer}>{a}</Text>}
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
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 16 },
  list: { gap: 8 },
  item: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  focused: Platform.select({
    web: { outlineWidth: 2, outlineColor: "#3b82f6", outlineStyle: "solid" },
    default: {},
  }),
  question: { fontWeight: "700", color: "#111" },
  expand: { fontSize: 18, color: "#6b7280" },
  answer: { marginTop: 8, color: "#374151" },
});
