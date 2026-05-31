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
  text as T,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getAllArtisans, availabilityLabel, type Artisan } from "@/lib/api";
import { getMyFavorites, removeFavorite } from "@/lib/api-extras";
import { Avatar } from "@/components/Avatar";

function isAvailable(a: Artisan) {
  return a.availability === "now" || a.availability === "today";
}

export default function FavoritesScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [favIds, all] = await Promise.all([
        getMyFavorites(),
        getAllArtisans(),
      ]);
      const favs = all.filter((a) => favIds.includes(a.id));
      setFavorites(favs);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const handleRemove = async (id: string) => {
    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* HEADER */}
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
            <Text style={[s.title, { color: t.text }]}>Mes favoris</Text>
            <Text style={[s.sub, { color: t.textSecondary }]}>
              {favorites.length} artisan{favorites.length > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          {loading ? (
            <View style={s.skeletonList}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    s.skeleton,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                />
              ))}
            </View>
          ) : favorites.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
              <View
                style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons name="heart-outline" size={28} color={t.primary} />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                Aucun favori pour l&apos;instant
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                Touchez le coeur sur un profil pour le retrouver ici.
              </Text>
              <Pressable
                onPress={() => router.push("/(app)/prestations")}
                style={[s.emptyCta, { borderColor: t.primary }]}
              >
                <Text style={[s.emptyCtaTxt, { color: t.primary }]}>
                  Explorer les artisans
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            favorites.map((a, idx) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(idx * 40).duration(300)}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/artisan/[id]",
                      params: { id: a.id },
                    })
                  }
                  style={({ pressed }) => [
                    s.card,
                    { backgroundColor: t.surface, borderColor: t.border },
                    pressed && s.pressed,
                  ]}
                >
                  <Avatar
                    uri={a.avatarUrl}
                    initials={a.initials}
                    size={56}
                  />
                  <View style={s.info}>
                    <View style={s.nameRow}>
                      <Text
                        style={[s.name, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {a.firstName} {a.lastName.charAt(0)}.
                      </Text>
                      {a.verified && (
                        <Ionicons
                          name="shield-checkmark"
                          size={12}
                          color={t.primary}
                        />
                      )}
                    </View>
                    <Text
                      style={[s.job, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {a.categoryName}
                    </Text>
                    <View style={s.meta}>
                      <Ionicons name="star" size={11} color="#C9A961" />
                      <Text style={[s.metaTxt, { color: t.text }]}>
                        {a.rating.toFixed(1)}
                      </Text>
                      <View
                        style={[
                          s.dot,
                          {
                            backgroundColor: isAvailable(a)
                              ? "#10B981"
                              : t.textTertiary,
                            marginLeft: 6,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          s.avail,
                          {
                            color: isAvailable(a)
                              ? "#10B981"
                              : t.textTertiary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {availabilityLabel[a.availability]}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(a.id)}
                    hitSlop={8}
                    style={s.heartBtn}
                  >
                    <Ionicons name="heart" size={20} color={t.danger} />
                  </Pressable>
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

  scroll: { paddingHorizontal: space.lg, gap: 8 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  job: { fontSize: 12, fontWeight: "500" },
  meta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  metaTxt: { fontSize: 12, fontWeight: "700" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  avail: { fontSize: 11, fontWeight: "700", flex: 1 },

  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  skeletonList: { gap: 8 },
  skeleton: {
    height: 84,
    borderRadius: 16,
    borderWidth: 1,
  },

  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptySub: { fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 19 },
  emptyCta: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.full,
    borderWidth: 1.5,
    marginTop: 8,
  },
  emptyCtaTxt: { fontSize: 13, fontWeight: "800" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
