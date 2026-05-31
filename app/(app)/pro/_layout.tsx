import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

export default function ProTabsLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: t.surface,
            borderTopColor: t.border,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Activité",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "grid" : "grid-outline"}
              color={color}
              focused={focused}
              primary={t.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Demandes",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "mail" : "mail-outline"}
              color={color}
              focused={focused}
              primary={t.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "Planning",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
              focused={focused}
              primary={t.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
              primary={t.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
  primary,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  primary: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={22} color={color} />
      {focused && (
        <View style={[styles.dot, { backgroundColor: primary }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0.5,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
