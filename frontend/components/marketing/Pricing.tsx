import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const plans = [
  {
    name: "Starter",
    price: "$0",
    desc: "Manage up to 3 units.",
  },
  {
    name: "Pro",
    price: "$19",
    desc: "For growing portfolios.",
  },
  {
    name: "Business",
    price: "$49",
    desc: "For small teams and agencies.",
  },
];

export default function Pricing() {
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Simple pricing
        </Text>
        <View style={styles.row}>
          {plans.map((p) => (
            <PlanCard
              key={p.name}
              name={p.name}
              price={p.price}
              desc={p.desc}
              onSelect={() => router.push("/(auth)/sign-up")}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function PlanCard({
  name,
  price,
  desc,
  onSelect,
}: {
  name: string;
  price: string;
  desc: string;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[styles.card, hovered && { borderColor: "#3b82f6" }]}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Text style={styles.planName}>{name}</Text>
      <Text style={styles.planPrice}>{price}/mo</Text>
      <Text style={styles.planDesc}>{desc}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${name}`}
        onPress={onSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.btn, styles.btnPrimary, focused && styles.focused]}
      >
        <Text style={styles.btnPrimaryText}>Get started</Text>
      </Pressable>
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  planName: { fontSize: 16, fontWeight: "700", color: "#111" },
  planPrice: { fontSize: 28, fontWeight: "800", marginTop: 4, color: "#111" },
  planDesc: { color: "#374151", marginTop: 6 },
  btn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
});
