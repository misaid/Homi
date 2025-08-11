// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";

import AppHeaderActions from "@/components/AppHeaderActions";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        headerLeft: () => <AppHeaderActions side="left" />,
        headerRight: () => <AppHeaderActions side="right" />,
        headerTitleAlign: "center",
        headerLeftContainerStyle: { paddingLeft: 8 },
        headerRightContainerStyle: { paddingRight: 8 },
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: Colors[colorScheme ?? "light"].pageBackground,
          },
        }),
        tabBarIcon: ({ color, focused, size }) => {
          const iconMap: Record<string, string> = {
            home: "home",
            units: "business",
            tenants: "people",
            rent: "card",
          };
          const baseName = iconMap[route.name] ?? "ellipse";
          const name = focused ? baseName : `${baseName}-outline`;
          const iconSize = typeof size === "number" ? size : 28;
          return (
            <Ionicons
              name={name as any}
              size={iconSize}
              color={color}
              style={{ opacity: focused ? 1 : 0.8 }}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="units"
        options={{
          title: "Units",
          // Index will use Tabs header; nested stack controls details
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          // Index will use Tabs header; nested stack controls details
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          title: "Rent",
          headerShown: true,
        }}
      />
    </Tabs>
  );
}
