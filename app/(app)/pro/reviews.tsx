import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
  getMyReceivedReviews,
  getProStats,
  type ProReview,
  type ProStats,
} from "@/lib/api-extras";

const EMPTY_STATS: ProStats = {
  pendingCount: 0,
  confirmedCount: 0,
  todayCount: 0,
  completedThisMonth: 0,
  earnedThisMonthEur: 0,
  earnedAllTimeEur: 0,
  rating: 0,
  reviewCount: 0,
  completionPct: 0,
};

export default function ProReviewsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<ProReview[]>([]);
  const [stats, setStats] = useState<ProStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [rv, st] = await Promise.all([
        getMyReceivedReviews().catch(() => [] as ProReview[]),
        getProStats().catch(() => EMPTY_STATS),
      ]);
      setReviews(Array.isArray(rv) ? rv : []);
      setStats(st ?? EMPTY_STATS);
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

  // Distribution des notes
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const filtered = filter
    ? reviews.filter((r) => r.rating === filter)
    : reviews;

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
          style={[s.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={s.heroTopBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={s.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={s.heroLabel}>Avis reçus</Text>
            <View style={s.heroIcon}>
              <Ionicons name="star" size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={s.heroCenter}>
            <Text style={s.heroBigRating}>
              {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
            </Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= Math.round(stats.rating) ? "star" : "star-outline"}
                  size={18}
                  color="#FBBF24"
                />
              ))}
            </View>
            <Text style={s.heroSub}>
              {stats.reviewCount} avis · sur les 12 derniers mois
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
            <LinearGradient
              colors={
                najdaGradient as unknown as [string, string, ...string[]]
              }
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.emptyIconGrad}
            >
              <Ionicons name="star-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              Pas encore d&apos;avis
            </Text>
            <Text style={[s.emptySub, { color: t.textSecondary }]}>
              Vos clients pourront laisser un avis après chaque mission accomplie.
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* ============= DISTRIBUTION ============= */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={s.section}
            >
              <View
                style={[
                  s.distribCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                {distribution.map((d) => {
                  const pct = (d.count / maxCount) * 100;
                  const active = filter === d.star;
                  return (
                    <Pressable
                      key={d.star}
                      onPress={() =>
                        setFilter(filter === d.star ? null : d.star)
                      }
                      style={s.distribRow}
                    >
                      <View style={s.distribStarLabel}>
                        <Text
                          style={[
                            s.distribStarTxt,
                            {
                              color: active ? t.primary : t.text,
                              fontWeight: active ? "800" : "600",
                            },
                          ]}
                        >
                          {d.star}
                        </Text>
                        <Ionicons name="star" size={11} color="#FBBF24" />
                      </View>
                      <View
                        style={[
                          s.distribBarBg,
                          { backgroundColor: t.surfaceMuted },
                        ]}
                      >
                        <View
                          style={[
                            s.distribBarFill,
                            {
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: active ? t.primary : "#FBBF24",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          s.distribCount,
                          {
                            color: active ? t.primary : t.textSecondary,
                            fontWeight: active ? "800" : "700",
                          },
                        ]}
                      >
                        {d.count}
                      </Text>
                    </Pressable>
                  );
                })}
                {filter !== null && (
                  <Pressable
                    onPress={() => setFilter(null)}
                    style={[
                      s.clearFilter,
                      { backgroundColor: t.primaryMuted },
                    ]}
                  >
                    <Ionicons name="close" size={14} color={t.primary} />
                    <Text style={[s.clearFilterTxt, { color: t.primary }]}>
                      Effacer le filtre {filter} étoile{filter > 1 ? "s" : ""}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* ============= LISTE DES AVIS ============= */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionTitle, { color: t.text }]}>
                {filtered.length} avis{filter ? ` · ${filter} étoile${filter > 1 ? "s" : ""}` : ""}
              </Text>

              {filtered.map((r, idx) => (
                <Animated.View
                  key={r.id}
                  entering={FadeInDown.delay(idx * 50).duration(300)}
                  style={[
                    s.reviewCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  <View style={s.reviewHead}>
                    <View
                      style={[
                        s.reviewAvatar,
                        { backgroundColor: t.primary },
                      ]}
                    >
                      <Text style={s.reviewAvatarTxt}>
                        {(r.author?.charAt(0) ?? "?").toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[s.reviewAuthor, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {r.author}
                      </Text>
                      <Text
                        style={[s.reviewDate, { color: t.textTertiary }]}
                      >
                        {formatRelative(r.createdAt)}
                      </Text>
                    </View>
                    <View style={s.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < r.rating ? "star" : "star-outline"}
                          size={13}
                          color="#FBBF24"
                        />
                      ))}
                    </View>
                  </View>
                  {r.text ? (
                    <Text style={[s.reviewTxt, { color: t.text }]}>
                      « {r.text} »
                    </Text>
                  ) : (
                    <Text
                      style={[s.reviewTxt, { color: t.textTertiary, fontStyle: "italic" }]}
                    >
                      Sans commentaire.
                    </Text>
                  )}
                </Animated.View>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365)
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loaderWrap: { paddingVertical: 60, alignItems: "center" },

  hero: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCenter: { alignItems: "center", gap: 8 },
  heroBigRating: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  starsRow: { flexDirection: "row", gap: 3 },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  section: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },

  distribCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  distribRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distribStarLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    width: 24,
  },
  distribStarTxt: { fontSize: 13 },
  distribBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  distribBarFill: { height: "100%", borderRadius: 4 },
  distribCount: { fontSize: 12, minWidth: 22, textAlign: "right" },

  clearFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.full,
    marginTop: 4,
  },
  clearFilterTxt: { fontSize: 11, fontWeight: "800" },

  reviewCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarTxt: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  reviewAuthor: { fontSize: 13, fontWeight: "800", letterSpacing: -0.2 },
  reviewDate: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewTxt: { fontSize: 13, lineHeight: 19 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
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
});
