import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function MarketingIndexFallback() {
  if (Platform.OS !== "web") {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return null;
}
