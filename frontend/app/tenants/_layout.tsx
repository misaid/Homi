// All data fetching must use lib/api useApi(). Do not call fetch directly.
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

function HeaderCloseButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityLabel="Close"
    >
      <Ionicons name="close" size={24} color={tint} />
    </Pressable>
  );
}

function HeaderBackButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityLabel="Back"
    >
      <Ionicons name="arrow-back" size={24} color={tint} />
    </Pressable>
  );
}

export default function TenantsLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: tint,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tenants" }} />
      <Stack.Screen
        name="[id]"
        options={{ title: "Tenant", headerLeft: () => <HeaderBackButton /> }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Tenant",
          presentation: "modal",
          headerRight: () => <HeaderCloseButton />,
        }}
      />
    </Stack>
  );
}
