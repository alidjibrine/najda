import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
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
import { getAllArtisans, type Artisan } from "@/lib/api";
import {
  CATEGORIES,
  CATEGORY_TAGLINE,
  CATEGORY_COLORS,
} from "@/constants/categories";
import { useFilters } from "@/contexts/FiltersContext";

function isAvailable(a: Artisan) {
  return a.availability === "now" || a.availability === "today";
}

export default function PrestationsScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopRated, setShowTopRated] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    onlyAvailable,
    onlyVerified,
    setOnlyAvailable,
    setOnlyVerified,
    reset: resetSharedFilters,
    activeCount: sharedActiveCount,
  } = useFilters();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getAllArtisans()
        .then((list) => {
          if (mounted) setArtisans(list);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const filteredArtisans = useMemo(
    () =>
      artisans
        .filter((a) => (onlyAvailable ? isAvailable(a) : true))
        .filter((a) => (onlyVerified ? a.verified : true))
        .filter((a) => (showTopRated ? a.rating >= 4.7 : true)),
    [artisans, onlyAvailable, onlyVerified, showTopRated],
  );

  const countByCategory = useMemo(() => {
    const m = new Map<string, { total: number; available: number }>();
    filteredArtisans.forEach((a) => {
      const cur = m.get(a.categoryId) ?? { total: 0, available: 0 };
      cur.total += 1;
      if (isAvailable(a)) cur.available += 1;
      m.set(a.categoryId, cur);
    });
    return m;
  }, [filteredArtisans]);

  // Une seule liste, triée : dispo en premier, puis ordre alpha (équitable)
  const sortedCategories = useMemo(() => {
    return [...CATEGORIES].sort((a, b) => {
      const ca = countByCategory.get(a.id) ?? { total: 0, available: 0 };
      const cb = countByCategory.get(b.id) ?? { total: 0, available: 0 };
      if (cb.available !== ca.available) return cb.available - ca.available;
      if (cb.total !== ca.total) return cb.total - ca.total;
      return a.name.localeCompare(b.name, "fr");
    });
  }, [countByCategory]);

  const totalCount = filteredArtisans.length;
  const activeTotal = sharedActiveCount + (showTopRated ? 1 : 0);

  const resetAll = () => {
    resetSharedFilters();
    setShowTopRated(false);
  };

  const openCategory = (id: string, name: string) =>
    router.push({
      pathname: "/(app)/artisans",
      params: { category: id, categoryName: name },
    });

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Halo subtil en background */}
      <LinearGradient
        colors={[
          "rgba(155,181,255,0.20)",
          "rgba(168,155,255,0.12)",
          "rgba(197,139,236,0.05)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.topHalo, { height: 240 + insets.top }]}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* ============= HEADER ============= */}
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              s.iconBtn,
              { backgroundColor: t.surface, borderColor: t.border },
              pressed && s.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={t.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setFilterOpen(true)}
            hitSlop={12}
            style={({ pressed }) => [
              s.iconBtn,
              s.filterIconBtn,
              { backgroundColor: t.surface, borderColor: t.border },
              pressed && s.pressed,
            ]}
          >
            <Ionicons name="options-outline" size={18} color={t.text} />
            <Text style={[s.filterTxt, { color: t.text }]}>Filtrer</Text>
            {activeTotal > 0 && (
              <View style={[s.filterBadge, { backgroundColor: t.primary }]}>
                <Text style={s.filterBadgeTxt}>{activeTotal}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: 32 + insets.bottom },
          ]}
        >
          {/* ============= TITRE HERO ============= */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={s.heroBlock}
          >
            <Text style={[s.heroTitle, { color: t.text }]}>
              Trouvez votre artisan
            </Text>
            <Text
              style={[s.heroSub, { color: t.textSecondary }]}
              numberOfLines={2}
            >
              {totalCount} pros vérifiés · {CATEGORIES.length} métiers
              disponibles
            </Text>
          </Animated.View>

          {/* ============= FILTRES ACTIFS (pills) ============= */}
          {activeTotal > 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={s.activePills}
            >
              {onlyAvailable && (
                <ActivePill
                  label="Disponibles maintenant"
                  icon="flash"
                  onClear={() => setOnlyAvailable(false)}
                  t={t}
                />
              )}
              {onlyVerified && (
                <ActivePill
                  label="Vérifiés"
                  icon="shield-checkmark"
                  onClear={() => setOnlyVerified(false)}
                  t={t}
                />
              )}
              {showTopRated && (
                <ActivePill
                  label="Mieux notés"
                  icon="star"
                  onClear={() => setShowTopRated(false)}
                  t={t}
                />
              )}
              <Pressable onPress={resetAll} hitSlop={6}>
                <Text style={[s.clearAllTxt, { color: t.primary }]}>
                  Tout effacer
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ============= GRILLE UNIFIÉE ============= */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(450)}
          >
            <View style={s.metierGrid}>
              {sortedCategories.map((cat) => {
                const c = countByCategory.get(cat.id) ?? {
                  total: 0,
                  available: 0,
                };
                const tagline = CATEGORY_TAGLINE[cat.id] ?? "";
                const colors = CATEGORY_COLORS[cat.id] ?? {
                  bg: t.primaryMuted,
                  icon: t.primary,
                };
                const disabled = c.total === 0;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() =>
                      !disabled && openCategory(cat.id, cat.name)
                    }
                    disabled={disabled}
                    style={({ pressed }) => [
                      s.metierCard,
                      {
                        backgroundColor: t.surface,
                        borderColor: t.border,
                        opacity: disabled ? 0.45 : 1,
                      },
                      pressed && !disabled && s.pressed,
                    ]}
                  >
                    <View
                      style={[s.metierIcon, { backgroundColor: colors.bg }]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={24}
                        color={colors.icon}
                      />
                    </View>

                    <Text
                      style={[s.metierName, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>

                    {tagline && (
                      <Text
                        style={[s.metierTagline, { color: t.textSecondary }]}
                        numberOfLines={2}
                      >
                        {tagline}
                      </Text>
                    )}

                    <View style={s.metierFooter}>
                      <View
                        style={[
                          s.availDot,
                          {
                            backgroundColor:
                              c.available > 0 ? "#10B981" : t.textTertiary,
                          },
                        ]}
                      />
                      <Text
                        style={[s.metierCount, { color: t.textSecondary }]}
                        numberOfLines={1}
                      >
                        {c.total} pro{c.total > 1 ? "s" : ""}
                        {c.available > 0
                          ? ` · ${c.available} dispo`
                          : ""}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ============= TRUST FOOTER ============= */}
          <Animated.View
            entering={FadeInDown.delay(440).duration(400)}
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
                <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.trustTitle}>
                  Artisans 100% vérifiés
                </Text>
                <Text style={s.trustSub}>
                  Identité, assurance et Kbis contrôlés à
                  l&apos;inscription.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ============= MODAL FILTRES ============= */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setFilterOpen(false)}
        >
          <Pressable
            style={[
              s.modalSheet,
              {
                backgroundColor: t.surface,
                paddingBottom: insets.bottom + 20,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[s.modalHandle, { backgroundColor: t.border }]} />

            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.text }]}>
                Affiner les résultats
              </Text>
              {activeTotal > 0 && (
                <Pressable onPress={resetAll} hitSlop={6}>
                  <Text style={[s.modalReset, { color: t.primary }]}>
                    Réinitialiser
                  </Text>
                </Pressable>
              )}
            </View>

            <FilterToggle
              icon="flash"
              title="Disponibles maintenant"
              sub="Artisans pouvant intervenir aujourd'hui"
              active={onlyAvailable}
              onToggle={() => setOnlyAvailable(!onlyAvailable)}
              t={t}
            />
            <FilterToggle
              icon="shield-checkmark"
              title="Vérifiés uniquement"
              sub="Identité, assurance et Kbis contrôlés"
              active={onlyVerified}
              onToggle={() => setOnlyVerified(!onlyVerified)}
              t={t}
            />
            <FilterToggle
              icon="star"
              title="Mieux notés"
              sub="Note moyenne supérieure à 4,7"
              active={showTopRated}
              onToggle={() => setShowTopRated(!showTopRated)}
              t={t}
            />

            <Pressable
              onPress={() => setFilterOpen(false)}
              style={({ pressed }) => [
                s.modalCtaWrap,
                pressed && s.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={
                  najdaGradient as unknown as [string, string, ...string[]]
                }
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.modalCta}
              >
                <Text style={s.modalCtaTxt}>
                  Voir {totalCount} résultat{totalCount > 1 ? "s" : ""}
                </Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// =====================================================
// Active filter pill (closable)
// =====================================================
function ActivePill({
  label,
  icon,
  onClear,
  t,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onClear: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        s.activePill,
        { backgroundColor: t.primary },
      ]}
    >
      <Ionicons name={icon} size={11} color="#FFFFFF" />
      <Text style={s.activePillTxt} numberOfLines={1}>
        {label}
      </Text>
      <Pressable onPress={onClear} hitSlop={4}>
        <Ionicons name="close" size={13} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// =====================================================
// Filter toggle row (modal)
// =====================================================
function FilterToggle({
  icon,
  title,
  sub,
  active,
  onToggle,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  active: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        s.toggleRow,
        { backgroundColor: t.surfaceMuted, borderColor: t.border },
      ]}
    >
      <View
        style={[s.toggleIcon, { backgroundColor: t.primaryMuted }]}
      >
        <Ionicons name={icon} size={18} color={t.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.toggleTitle, { color: t.text }]}>{title}</Text>
        <Text style={[s.toggleSub, { color: t.textSecondary }]}>{sub}</Text>
      </View>
      <View
        style={[
          s.switchTrack,
          { backgroundColor: active ? t.primary : t.borderStrong },
        ]}
      >
        <View style={[s.switchThumb, { left: active ? 22 : 2 }]} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  topHalo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: space.sm,
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
  filterIconBtn: {
    flexDirection: "row",
    width: undefined,
    paddingHorizontal: 14,
    gap: 6,
  },
  filterTxt: { fontSize: 13, fontWeight: "700" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeTxt: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  // ===== SCROLL =====
  scroll: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },

  // ===== HERO =====
  heroBlock: { paddingTop: 4 },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 36,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },

  // ===== ACTIVE PILLS =====
  activePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  activePillTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  clearAllTxt: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    textDecorationLine: "underline",
  },

  // ===== SECTION =====
  sectionHead: { marginBottom: 12 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },

  // ===== MÉTIERS GRID =====
  metierGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  metierCard: {
    width: "48.5%",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minHeight: 150,
  },
  metierIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  metierName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  metierTagline: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
    flex: 1,
  },
  metierFooter: { flexDirection: "row", alignItems: "center", gap: 5 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  metierCount: { fontSize: 11, fontWeight: "600", flex: 1 },

  // ===== TRUST =====
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    ...shadow.md,
  },
  trustIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  trustSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    lineHeight: 17,
  },

  // ===== MODAL FILTRES =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,15,24,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  modalReset: { fontSize: 13, fontWeight: "700" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  toggleSub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  switchThumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  modalCtaWrap: { marginTop: 12, borderRadius: 16, ...shadow.lg },
  modalCta: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCtaTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
