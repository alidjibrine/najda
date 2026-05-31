import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  space,
  radius,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getMyConversations, type Conversation } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesScreen() {
  const router = useRouter();
  const t = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const list = await getMyConversations();
      setConversations(list);
    } catch {
      setConversations([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      fetchData().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0,
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* ===== HEADER ===== */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: t.text }]}>Messages</Text>
          <Text style={[s.subtitle, { color: t.textSecondary }]}>
            {totalUnread > 0
              ? `${totalUnread} non lu${totalUnread > 1 ? "s" : ""}`
              : "Vos conversations en direct"}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.primary}
          />
        }
      >
        {loading ? (
          <LoadingBlock t={t} />
        ) : conversations.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={s.emptyBlock}
          >
            <View
              style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={26}
                color={t.primary}
              />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              Aucune conversation
            </Text>
            <Text style={[s.emptySub, { color: t.textSecondary }]}>
              Réservez un artisan et un canal de discussion s&apos;ouvrira
              automatiquement.
            </Text>
            <Pressable
              onPress={() => router.push("/(app)/(tabs)")}
              style={({ pressed }) => [s.emptyBtn, pressed && s.pressed]}
            >
              <LinearGradient
                colors={najdaGradient as unknown as [string, string, ...string[]]}
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.emptyBtnInner}
              >
                <Text style={s.emptyBtnTxt}>Trouver un artisan</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {conversations.map((conv, idx) => (
              <Animated.View
                key={conv.id}
                entering={FadeInDown.delay(idx * 50).duration(300)}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/conversation/[id]",
                      params: { id: conv.id },
                    })
                  }
                  style={({ pressed }) => [
                    s.row,
                    { backgroundColor: t.surface, borderColor: t.border },
                    pressed && s.pressed,
                  ]}
                >
                  <Avatar
                    uri={conv.artisan?.avatarUrl}
                    initials={conv.artisan?.initials ?? "?"}
                    size={52}
                  />

                  <View style={s.info}>
                    <View style={s.topRow}>
                      <Text
                        style={[s.name, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {conv.artisan
                          ? `${conv.artisan.firstName} ${conv.artisan.lastName}`
                          : "Artisan"}
                      </Text>
                      <Text style={[s.time, { color: t.textTertiary }]}>
                        {timeAgo(conv.lastMessageAt)}
                      </Text>
                    </View>
                    <View style={s.bottomRow}>
                      <Text
                        style={[
                          s.preview,
                          {
                            color:
                              conv.unreadCount > 0 ? t.text : t.textSecondary,
                            fontWeight: conv.unreadCount > 0 ? "600" : "400",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {conv.lastMessageText || "Nouvelle conversation"}
                      </Text>
                      {conv.unreadCount > 0 && (
                        <View style={s.unreadBadgeWrap}>
                          <LinearGradient
                            colors={najdaGradient as unknown as [string, string, ...string[]]}
                            start={najdaGradientDirection.start}
                            end={najdaGradientDirection.end}
                            style={s.unreadBadge}
                          >
                            <Text style={s.unreadTxt}>{conv.unreadCount}</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            <View style={s.secureNote}>
              <Ionicons name="lock-closed" size={11} color={t.textTertiary} />
              <Text style={[s.secureTxt, { color: t.textTertiary }]}>
                Messages chiffrés de bout en bout
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// Loading block
// =====================================================
function LoadingBlock({ t }: { t: ReturnType<typeof useTheme> }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.loadingBlock}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            s.skeleton,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: { ...T.sm, fontWeight: "500" },

  scroll: { padding: space.lg, gap: 10, minHeight: 400 },

  // ===== ROW =====
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  time: { fontSize: 11, fontWeight: "500" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  preview: { ...T.sm, flex: 1 },

  unreadBadgeWrap: {
    borderRadius: 11,
    overflow: "hidden",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadTxt: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  // ===== SECURE NOTE =====
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: space.lg,
  },
  secureTxt: { fontSize: 11, fontWeight: "500" },

  // ===== EMPTY =====
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: space.lg,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptySub: {
    ...T.sm,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyBtn: { marginTop: 12, borderRadius: radius.full },
  emptyBtnInner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyBtnTxt: { ...T.sm, fontWeight: "700", color: "#FFFFFF" },

  // ===== LOADING =====
  loadingBlock: { gap: 10 },
  skeleton: { height: 80, borderRadius: 16, borderWidth: 1 },
});
