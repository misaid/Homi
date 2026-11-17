// components/marketing/ReanimatedTest.tsx
import { useEffect } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function ReanimatedTest() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);

  // Auto-animate on mount to test if reanimated works
  useEffect(() => {
    console.log("ReanimatedTest mounted");
    console.log("useSharedValue exists:", typeof useSharedValue);
    console.log("Initial scale value:", scale.value);

    // Test automatic animation
    rotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    console.log("animatedStyle running, scale:", scale.value); // This logs on every frame if working
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
        { translateX: translateX.value },
      ],
    };
  });

  const handlePress = () => {
    console.log("Button pressed, triggering animation");
    scale.value = withSpring(scale.value === 1 ? 1.5 : 1);
    translateX.value = withSpring(translateX.value === 0 ? 100 : 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reanimated Test</Text>
      <Text style={styles.subtitle}>
        If the box below is spinning, Reanimated is working!
      </Text>

      {/* Auto-rotating box */}
      <Animated.View style={[styles.autoBox, animatedStyle]} />

      {/* Manual test button */}
      <Pressable style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Tap to Animate</Text>
      </Pressable>

      {/* Static box for comparison */}
      <View style={styles.staticBox}>
        <Text style={styles.staticText}>Static (no animation)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#1e293b",
    marginVertical: 20,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
    textAlign: "center",
  },
  autoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  staticBox: {
    width: 100,
    height: 50,
    backgroundColor: "#64748b",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  staticText: {
    color: "#fff",
    fontSize: 10,
  },
});
