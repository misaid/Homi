import { StyleSheet, Text, View } from "react-native";

export default function Logos() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text style={styles.heading}>Trusted by small teams</Text>
        <View style={styles.row}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              accessibilityLabel={`Logo ${i + 1}`}
              style={styles.logoBox}
            />
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
    paddingVertical: 40,
  },
  heading: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  logoBox: {
    width: 120,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
});
