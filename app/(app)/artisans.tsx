import { useEffect, useMemo, useState } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getArtisansByCategory,
  availabilityLabel,
  type Artisan,
} from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { CATEGORY_COLORS, getCategory } from "@/constants/categories";
import { useFilters } from "@/contexts/FiltersContext";

function isAvailable(a: Artisan) {
  return a.availability === "now" || a.availability === "today";
}

type SortBy = "default" | "rating" | "distance";

export default function ArtisansScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { category, categoryName, service } = useLocalSearchParams<{
    category: string;
    categoryName: string;
    service?: string;
  }>();

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("default");

  // Filtres partagés via context
  const {
    onlyAvailable,
    onlyVerified,
    setOnlyAvailable,
    setOnlyVerified,
  } = useFilters();

  const cat = getCategory(category);
  const catColors = CATEGORY_COLORS[category] ?? {
    bg: t.primaryMuted,
    icon: t.primary,
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getArtisansByCategory(category, service ? { service } : undefined)
      .then((list) => {
        if (mounted) setArtisans(list);
      })
      .catch((err) => {
        if (mounted) setError(err.message ?? "Erreur de chargement");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [category, service]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let list = [...artisans]
      .filter((a) => (onlyAvailable ? isAvailable(a) : true))
      .filter((a) => (onlyVerified ? a.verified : true));

    if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "distance") {
      list.sort((a, b) => a.distance - b.distance);
    } else {
      // Default : dispo en premier, puis rating
      list.sort((a, b) => {
        const ad = isAvailable(a) ? 0 : 1;
        const bd = isAvailable(b) ? 0 : 1;
        if (ad !== bd) return ad - bd;
        return b.rating - a.rating;
      });
    }
    return list;
  }, [artisans, onlyAvailable, onlyVerified, sortBy]);

  const openArtisan = (id: string) =>
    router.push({ pathname: "/(app)/artisan/[id]", params: { id } });

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* ============= HEADER COMPACT ============= */}
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              s.iconBtn,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
              pressed && s.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={t.text} />
          </Pressable>

          <View style={s.headerCenter}>
            {cat && (
              <View
                style={[s.headerIconMini, { backgroundColor: catColors.bg }]}
              >
                <Ionicons name={cat.icon} size={14} color={catColors.icon} />
              </View>
            )}
            <Text style={[s.headerTitle, { color: t.text }]} numberOfLines={1}>
              {categoryName ?? cat?.name ?? "Artisans"}
            </Text>
          </View>

          <View style={s.headerCountWrap}>
            <Text style={[s.headerCount, { color: t.textSecondary }]}>
              {filtered.length}
            </Text>
          </View>
        </View>

        {/* ============= TRI (segmented control inline) ============= */}
        <View
          style={[
            s.sortRow,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
          ]}
        >
          <SortPill
            label="Pertinent"
            active={sortBy === "default"}
            onPress={() => setSortBy("default")}
            t={t}
          />
          <SortPill
            label="Mieux notés"
            active={sortBy === "rating"}
            onPress={() => setSortBy("rating")}
            t={t}
          />
          <SortPill
            label="Plus proches"
            active={sortBy === "distance"}
            onPress={() => setSortBy("distance")}
            t={t}
          />
        </View>

        {/* ============= TOGGLES rapides (2 chips compacts) ============= */}
        <View style={s.toggleRow}>
          <QuickToggle
            label="Disponibles maintenant"
            icon="flash"
            active={onlyAvailable}
            onPress={() => setOnlyAvailable(!onlyAvailable)}
            t={t}
          />
          <QuickToggle
            label="Vérifiés"
            icon="shield-checkmark"
            active={onlyVerified}
            onPress={() => setOnlyVerified(!onlyVerified)}
            t={t}
          />
        </View>

        {/* ============= LISTE ============= */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.list,
            { paddingBottom: 32 + insets.bottom },
          ]}
        >
          {loading ? (
            <View style={s.skeletonList}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    s.skeleton,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                />
              ))}
            </View>
          ) : error ? (
            <View style={s.emptyBlock}>
              <View
                style={[s.emptyIcon, { backgroundColor: t.dangerMuted }]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={26}
                  color={t.danger}
                />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                Erreur de chargement
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                {error}
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.emptyBlock}>
              <View
                style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons
                  name="filter-outline"
                  size={26}
                  color={t.primary}
                />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                Aucun artisan ne correspond
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                Essayez d&apos;élargir vos filtres.
              </Text>
            </View>
          ) : (
            filtered.map((a, idx) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(idx * 30).duration(300)}
              >
                <Pressable
                  onPress={() => openArtisan(a.id)}
                  style={({ pressed }) => [
                    s.artisanCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                    pressed && s.pressed,
                  ]}
                >
                  <Avatar
                    uri={a.avatarUrl}
                    initials={a.initials}
                    size={56}
                  />

                  <View style={s.artInfo}>
                    <View style={s.artNameRow}>
                      <Text
                        style={[s.artName, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {a.firstName} {a.lastName.charAt(0)}.
                      </Text>
                      {a.verified && (
                        <Ionicons
                          name="shield-checkmark"
                          size={13}
                          color={t.primary}
                        />
                      )}
                    </View>

                    <View style={s.artMeta}>
                      <Ionicons name="star" size={11} color="#C9A961" />
                      <Text style={[s.artRating, { color: t.text }]}>
                        {a.rating.toFixed(1)}
                      </Text>
                      <Text
                        style={[s.artReview, { color: t.textTertiary }]}
                      >
                        ({a.reviewCount})
                      </Text>
                      <Text style={[s.artDot, { color: t.textTertiary }]}>
                        ·
                      </Text>
                      <Text style={[s.artDist, { color: t.textSecondary }]}>
                        {a.distance.toFixed(1)} km
                      </Text>
                      <Text style={[s.artDot, { color: t.textTertiary }]}>
                        ·
                      </Text>
                      <Text style={[s.artDist, { color: t.textSecondary }]}>
                        {a.yearsExp} an{a.yearsExp > 1 ? "s" : ""}
                      </Text>
                    </View>

                    <View style={s.artFooter}>
                      <View
                        style={[
                          s.availDot,
                          {
                            backgroundColor: isAvailable(a)
                              ? "#10B981"
                              : t.textTertiary,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          s.artAvail,
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
                      <Text style={[s.artPrice, { color: t.text }]}>
                        {a.priceRange}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={t.textTertiary}
                  />
                </Pressable>
              </Animated.View>
            ))
          )}

          {/* ============= TRUST FOOTER ============= */}
          {!loading && filtered.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={s.trustWrap}
            >
              <LinearGradient
                colors={
                  najdaGradient as unknown as [string, string, ...string[]]
                }
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.trustCard}
              >
                <View style={s.trustIcon}>
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.trustTitle}>
                    Tous nos artisans sont vérifiés
                  </Text>
                  <Text style={s.trustSub}>
                    Identité, assurance et Kbis contrôlés.
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =====================================================
// Sort pill (1/3 chacune, segmented control)
// =====================================================
function SortPill({
  label,
  active,
  onPress,
  t,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.sortPill,
        active && {
          backgroundColor: t.surface,
          ...shadow.sm,
        },
        pressed && s.pressed,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          s.sortPillTxt,
          {
            color: active ? t.text : t.textSecondary,
            fontWeight: active ? "800" : "600",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =====================================================
// Quick toggle (Disponibles / Vérifiés)
// =====================================================
function QuickToggle({
  label,
  icon,
  active,
  onPress,
  t,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.quickToggle,
        {
          backgroundColor: active ? t.primary : t.surfaceMuted,
          borderColor: active ? t.primary : t.borderStrong,
        },
        pressed && s.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={active ? "#FFFFFF" : t.primary}
      />
      <Text
        numberOfLines={1}
        style={[
          s.quickToggleTxt,
          { color: active ? "#FFFFFF" : t.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: space.md,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerIconMini: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  headerCountWrap: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  headerCount: {
    fontSize: 15,
    fontWeight: "700",
  },

  // ===== SORT SEGMENTED =====
  sortRow: {
    flexDirection: "row",
    marginHorizontal: space.lg,
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 2,
    marginBottom: 10,
  },
  sortPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sortPillTxt: { fontSize: 13, letterSpacing: -0.1 },

  // ===== QUICK TOGGLES =====
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  quickToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  quickToggleTxt: { fontSize: 12, fontWeight: "700", letterSpacing: -0.1 },

  // ===== LIST =====
  list: {
    paddingHorizontal: space.lg,
    gap: 8,
  },

  artisanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  artInfo: { flex: 1, gap: 3 },
  artNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  artName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  artMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  artRating: { fontSize: 12, fontWeight: "700" },
  artReview: { fontSize: 11, fontWeight: "500" },
  artDot: { fontSize: 11 },
  artDist: { fontSize: 11, fontWeight: "500" },
  artFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  artAvail: { fontSize: 11, fontWeight: "700", flex: 1 },
  artPrice: { fontSize: 13, fontWeight: "800", letterSpacing: -0.2 },

  // ===== SKELETON =====
  skeletonList: { gap: 8 },
  skeleton: {
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
  },

  // ===== EMPTY =====
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", maxWidth: 280 },

  // ===== TRUST =====
  trustWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: space.lg,
    ...shadow.md,
  },
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  trustSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    lineHeight: 16,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
