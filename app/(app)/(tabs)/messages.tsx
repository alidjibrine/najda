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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import { getMyConversations, type Conversation } from "@/lib/api";

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

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
        <Text style={s.subtitle}>Échangez avec vos artisans en direct</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.primary500}
          />
        }
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={brand.primary500} />
          </View>
        ) : conversations.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={s.empty}>
            <View style={s.emptyIconCircle}>
              <Ionicons
                name="chatbubbles-outline"
                size={32}
                color={brand.primary400}
              />
            </View>
            <Text style={s.emptyTitle}>Aucune conversation</Text>
            <Text style={s.emptySub}>
              Réservez un artisan et un canal de discussion s&apos;ouvrira
              automatiquement ici.
            </Text>
            <Pressable
              style={({ pressed }) => [s.cta, pressed && s.ctaP]}
              onPress={() => router.push("/(app)/(tabs)")}
            >
              <Ionicons name="search" size={18} color={brand.white} />
              <Text style={s.ctaTxt}>Trouver un artisan</Text>
            </Pressable>
          </Animated.View>
        ) : (
          conversations.map((conv, idx) => (
            <Animated.View
              key={conv.id}
              entering={FadeInDown.delay(idx * 50).duration(400)}
            >
              <Pressable
                style={({ pressed }) => [s.row, pressed && s.rowP]}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/conversation/[id]",
                    params: { id: conv.id },
                  })
                }
              >
                <View
                  style={[
                    s.avatar,
                    {
                      backgroundColor: brand.primary500,
                    },
                  ]}
                >
                  <Text style={s.avatarTxt}>
                    {conv.artisan?.initials ?? "?"}
                  </Text>
                </View>

                <View style={s.info}>
                  <View style={s.topRow}>
                    <Text style={s.name} numberOfLines={1}>
                      {conv.artisan
                        ? `${conv.artisan.firstName} ${conv.artisan.lastName}`
                        : "Artisan"}
                    </Text>
                    <Text style={s.time}>{timeAgo(conv.lastMessageAt)}</Text>
                  </View>
                  <View style={s.bottomRow}>
                    <Text
                      style={[
                        s.preview,
                        conv.unreadCount > 0 && s.previewUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.lastMessageText || "Nouvelle conversation"}
                    </Text>
                    {conv.unreadCount > 0 && (
                      <View style={s.unreadBadge}>
                        <Text style={s.unreadTxt}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}

        {!loading && conversations.length > 0 && (
          <View style={s.secureNote}>
            <Ionicons name="lock-closed" size={12} color={brand.gray400} />
            <Text style={s.secureTxt}>Messages chiffrés de bout en bout</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: { ...T.sm, color: brand.gray500 },

  scroll: { padding: space.lg, minHeight: 400 },

  loader: { paddingVertical: 80, alignItems: "center" },

  empty: {
    backgroundColor: brand.white,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
    ...shadow.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.sm,
  },
  emptyTitle: {
    ...T.lg,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.3,
  },
  emptySub: {
    ...T.sm,
    color: brand.gray500,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: space.md,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: brand.primary500,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: radius.full,
    ...shadow.lg,
  },
  ctaP: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaTxt: { ...T.base, fontWeight: "600", color: brand.white },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 8,
    ...shadow.sm,
  },
  rowP: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 16, fontWeight: "700", color: brand.white },

  info: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    flex: 1,
    letterSpacing: -0.2,
  },
  time: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  preview: { ...T.sm, color: brand.gray500, flex: 1 },
  previewUnread: { color: brand.gray800, fontWeight: "600" },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadTxt: { fontSize: 11, fontWeight: "700", color: brand.white },

  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: space.lg,
  },
  secureTxt: { ...T.xs, color: brand.gray400, fontWeight: "500" },
});
