import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getProConversations,
  type ProConversation,
} from "@/lib/api-extras";

export default function ProMessagesScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ProConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getProConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const totalUnread = conversations.reduce(
    (acc, c) => acc + c.proUnreadCount,
    0,
  );

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ============= HERO ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 14 }]}
        >
          <View style={s.heroTopBar}>
            <Text style={s.heroLabel}>Messages</Text>
            <Pressable
              onPress={() => router.push("/(app)/notifications")}
              hitSlop={10}
              style={({ pressed }) => [s.heroIcon, pressed && s.pressed]}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={s.heroTitle}>
            {conversations.length} conversation
            {conversations.length > 1 ? "s" : ""}
          </Text>
          <Text style={s.heroSub}>
            {totalUnread > 0
              ? `${totalUnread} message${totalUnread > 1 ? "s" : ""} non lu${totalUnread > 1 ? "s" : ""}`
              : "Tous vos messages sont lus"}
          </Text>
        </LinearGradient>

        {/* ============= LIST ============= */}
        <View style={s.section}>
          {loading ? (
            <View style={s.loaderWrap}>
              <ActivityIndicator size="large" color={t.primary} />
            </View>
          ) : conversations.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
              <LinearGradient
                colors={
                  najdaGradient as unknown as [string, string, ...string[]]
                }
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.emptyIconGrad}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                Aucune conversation
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                Vos discussions avec les clients s&apos;afficheront ici dès qu&apos;ils
                réserveront une prestation.
              </Text>
            </Animated.View>
          ) : (
            conversations.map((c, idx) => {
              const initial =
                (c.clientFirstName?.charAt(0) || "?").toUpperCase();
              const fullName =
                `${c.clientFirstName} ${c.clientLastName}`.trim() ||
                "Client";
              const unread = c.proUnreadCount > 0;

              return (
                <Animated.View
                  key={c.id}
                  entering={FadeInDown.delay(idx * 50).duration(300)}
                >
                  <Pressable
                    onPress={() =>
                      router.push(`/(app)/pro/conversation/${c.id}` as never)
                    }
                    style={({ pressed }) => [
                      s.convCard,
                      {
                        backgroundColor: unread ? t.primaryMuted : t.surface,
                        borderColor: unread ? t.primary : t.border,
                      },
                      pressed && s.pressed,
                    ]}
                  >
                    {/* Avatar client */}
                    {c.clientAvatarUrl ? (
                      <Image
                        source={{ uri: c.clientAvatarUrl }}
                        style={s.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          s.avatarFallback,
                          { backgroundColor: t.primary },
                        ]}
                      >
                        <Text style={s.avatarTxt}>{initial}</Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={s.convHead}>
                        <Text
                          style={[
                            s.convName,
                            { color: t.text, fontWeight: unread ? "800" : "700" },
                          ]}
                          numberOfLines={1}
                        >
                          {fullName}
                        </Text>
                        <Text
                          style={[s.convTime, { color: t.textTertiary }]}
                        >
                          {formatRelativeTime(c.lastMessageAt)}
                        </Text>
                      </View>
                      <Text
                        style={[s.convService, { color: t.primary }]}
                        numberOfLines={1}
                      >
                        {c.bookingService || "Réservation"}
                      </Text>
                      <Text
                        style={[
                          s.convLast,
                          {
                            color: unread ? t.text : t.textSecondary,
                            fontWeight: unread ? "700" : "500",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {c.lastMessageText || "Pas encore de message"}
                      </Text>
                    </View>

                    {unread && (
                      <View
                        style={[s.unreadBadge, { backgroundColor: t.primary }]}
                      >
                        <Text style={s.unreadTxt}>
                          {c.proUnreadCount > 9 ? "9+" : c.proUnreadCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // HERO
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.7,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  // LIST
  section: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: 10 },
  loaderWrap: { paddingVertical: 60, alignItems: "center" },

  convCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },

  convHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  convName: { fontSize: 14, letterSpacing: -0.2, flex: 1 },
  convTime: { fontSize: 11, fontWeight: "600" },
  convService: { fontSize: 11, fontWeight: "800", marginTop: 2 },
  convLast: { fontSize: 13, marginTop: 4 },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadTxt: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // EMPTY
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIconGrad: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
