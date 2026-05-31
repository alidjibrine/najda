import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from "@/lib/api-extras";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

const ICONS: Record<NotificationType, keyof typeof import("@expo/vector-icons").Ionicons.glyphMap> = {
  booking_request: "mail",
  booking_accepted: "checkmark-circle",
  booking_rejected: "close-circle",
  booking_reminder: "alarm",
  booking_completed: "ribbon",
  new_message: "chatbubble",
  review_request: "star",
  system: "information-circle",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await getMyNotifications();
      setNotifs(list);
    } catch {
      setNotifs([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      load();
    } catch {
      // silent
    }
  };

  const handleTap = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
      } catch {
        // silent
      }
    }
    // Navigation contextuelle
    const bookingId = (n.data as { booking_id?: string }).booking_id;
    if (
      bookingId &&
      (n.type === "booking_accepted" ||
        n.type === "booking_rejected" ||
        n.type === "booking_request" ||
        n.type === "booking_reminder")
    ) {
      router.push("/(app)/(tabs)/bookings");
    } else if (n.type === "review_request" && bookingId) {
      router.push({
        pathname: "/(app)/reviews/new",
        params: { bookingId },
      });
    } else if (n.type === "new_message") {
      router.push("/(app)/(tabs)/messages");
    }
    load();
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              s.backBtn,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
              pressed && s.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={t.text} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: t.text }]}>Notifications</Text>
            <Text style={[s.sub, { color: t.textSecondary }]}>
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                : "Tout est à jour"}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAll}
              hitSlop={6}
              style={({ pressed }) => [
                s.markAllBtn,
                { backgroundColor: t.primaryMuted },
                pressed && s.pressed,
              ]}
            >
              <Text style={[s.markAllTxt, { color: t.primary }]}>Tout lire</Text>
            </Pressable>
          ) : (
            <View style={{ width: 70 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          {notifs.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
              <View
                style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={t.primary}
                />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                Aucune notification
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                Vous serez prévenu quand un événement vous concerne.
              </Text>
            </Animated.View>
          ) : (
            notifs.map((n, idx) => (
              <Animated.View
                key={n.id}
                entering={FadeInDown.delay(idx * 25).duration(280)}
              >
                <Pressable
                  onPress={() => handleTap(n)}
                  style={({ pressed }) => [
                    s.notifCard,
                    {
                      backgroundColor: n.read ? t.surface : t.primaryMuted,
                      borderColor: t.border,
                    },
                    pressed && s.pressed,
                  ]}
                >
                  <View
                    style={[
                      s.notifIcon,
                      {
                        backgroundColor: n.read
                          ? t.surfaceMuted
                          : "rgba(124,143,255,0.20)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={ICONS[n.type] ?? "ellipse-outline"}
                      size={18}
                      color={t.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        s.notifTitle,
                        {
                          color: t.text,
                          fontWeight: n.read ? "600" : "800",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text
                      style={[s.notifBody, { color: t.textSecondary }]}
                      numberOfLines={2}
                    >
                      {n.body}
                    </Text>
                    <Text style={[s.notifTime, { color: t.textTertiary }]}>
                      {relTime(n.createdAt)}
                    </Text>
                  </View>
                  {!n.read && (
                    <View
                      style={[s.unreadDot, { backgroundColor: t.primary }]}
                    />
                  )}
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: space.md,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  sub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllTxt: { fontSize: 12, fontWeight: "800" },

  scroll: { paddingHorizontal: space.lg, gap: 8 },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: { fontSize: 14, letterSpacing: -0.2 },
  notifBody: { fontSize: 12, fontWeight: "500", lineHeight: 17 },
  notifTime: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },

  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptySub: { fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 19 },

  pressed: { opacity: 0.85 },
});
