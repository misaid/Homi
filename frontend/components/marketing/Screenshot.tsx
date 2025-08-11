import { StyleSheet, View } from "react-native";

export default function Screenshot() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <View
          accessibilityLabel="App screenshot placeholder"
          style={styles.shot}
        />
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
    paddingVertical: 48,
  },
  shot: {
    width: "100%",
    height: 320,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
});
