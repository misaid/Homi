import { StyleSheet, Text, View } from "react-native";

const items = [
  { title: "Units", copy: "Manage properties and unit details." },
  { title: "Tenants", copy: "Track residents and contacts." },
  { title: "Rent", copy: "Monitor charges and payments." },
  { title: "Issues", copy: "Log and resolve maintenance tasks." },
  { title: "Photos", copy: "Attach move-in and condition photos." },
  { title: "Reports", copy: "Export simple summaries." },
];

export default function Features() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Features
        </Text>
        <View style={styles.grid}>
          {items.map((it) => (
            <View key={it.title} style={styles.card}>
              <View style={styles.icon} />
              <Text style={styles.cardTitle}>{it.title}</Text>
              <Text style={styles.cardCopy}>{it.copy}</Text>
            </View>
          ))}
        </View>
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
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  icon: {
    width: 36,
    height: 36,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: "700", fontSize: 16, color: "#111" },
  cardCopy: { color: "#374151", marginTop: 4 },
});
