import { StyleSheet, Text, View } from "react-native";

type Team = { name: string };

const defaultTeams: Team[] = [
  { name: "Acme" },
  { name: "Globex" },
  { name: "Initech" },
  { name: "Umbrella" },
  { name: "Hooli" },
  { name: "Stark Industries" },
];

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase()).join("");
  return letters || "·";
}

export default function Logos({ teams = defaultTeams }: { teams?: Team[] }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <Text style={styles.heading}>Trusted by small teams</Text>
        <View style={styles.row}>
          {teams.map((t, i) => (
            <View
              key={`${t.name}-${i}`}
              accessibilityRole="image"
              accessibilityLabel={`${t.name} logo`}
              style={styles.logoBox}
            >
              <Text style={styles.logoText}>{toInitials(t.name)}</Text>
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
    width: 140,
    height: 44,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#9ca3af", fontWeight: "700", letterSpacing: 1 },
});
