import { useCallback, useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { countProUnreadMessages, countUnreadNotifications } from "@/lib/api-extras";

export default function ProTabsLayout() {
  const t = useTheme();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [msgs, notifs] = await Promise.all([
        countProUnreadMessages().catch(() => 0),
        countUnreadNotifications().catch(() => 0),
      ]);
      setUnreadMsgs(typeof msgs === "number" ? msgs : 0);
      setUnreadNotifs(typeof notifs === "number" ? notifs : 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, [refresh]);

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
              badge={unreadNotifs}
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
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
              focused={focused}
              primary={t.primary}
              badge={unreadMsgs}
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
      {/* Routes cachées des tabs (accessibles uniquement par navigation) */}
      <Tabs.Screen
        name="stats"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reviews"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="conversation/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
  primary,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  primary: string;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={22} color={color} />
      {focused && (
        <View style={[styles.dot, { backgroundColor: primary }]} />
      )}
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
          <Text style={styles.badgeTxt}>
            {badge > 9 ? "9+" : String(badge)}
          </Text>
        </View>
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
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dot: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
