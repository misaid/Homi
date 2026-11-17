// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth } from "@/lib/auth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeaderActions from "@/components/AppHeaderActions";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { palette } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: palette.faint,
        headerShown: true,
        headerLeft: () => <AppHeaderActions side="left" />,
        headerRight: () => <AppHeaderActions side="right" />,
        headerTitleAlign: "left",
        headerTitleStyle: { ...type.title, color: Colors[colorScheme ?? "light"].text },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].pageBackground,
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerShadowVisible: false,
        tabBarLabelStyle: { ...font("body", 600), fontSize: 11, lineHeight: 14, marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        headerLeftContainerStyle: { paddingLeft: 8 },
        headerRightContainerStyle: { paddingRight: 8 },
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...(Platform.OS === "ios" ? { position: "absolute" as const } : { backgroundColor: palette.card }),
          height: 60 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          elevation: 0,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconMap: Record<string, string> = {
            home: "home",
            units: "business",
            tenants: "people",
            rent: "card",
          };
          const baseName = iconMap[route.name] ?? "ellipse";
          const name = focused ? baseName : `${baseName}-outline`;
          const iconSize = 24;
          return (
            <Ionicons
              name={name as any}
              size={iconSize}
              color={color}
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
