// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function HomeTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Home</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "600" },
});
