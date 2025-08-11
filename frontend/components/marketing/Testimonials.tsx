import { StyleSheet, Text, View } from "react-native";

const quotes = [
  {
    name: "Alex R.",
    text: "Homi keeps our rentals organized and easy to manage.",
  },
  { name: "Casey L.", text: "Simple and fast. Exactly what we needed." },
  {
    name: "Jordan P.",
    text: "Great for tracking issues and rent at a glance.",
  },
];

export default function Testimonials() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          What customers say
        </Text>
        <View style={styles.row}>
          {quotes.map((q) => (
            <View key={q.name} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{q.name.split(" ")[0][0]}</Text>
              </View>
              <Text style={styles.text}>“{q.text}”</Text>
              <Text style={styles.name}>{q.name}</Text>
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  avatarText: { color: "#111", fontWeight: "700" },
  text: { color: "#111" },
  name: { color: "#6b7280", marginTop: 6 },
});
