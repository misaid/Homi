// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function IndexInfo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home is a separate tab now</Text>
      <Link href="/home" style={styles.link}>
        Go to Home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, marginBottom: 8 },
  link: { color: "#2563eb", fontWeight: "600" },
});
