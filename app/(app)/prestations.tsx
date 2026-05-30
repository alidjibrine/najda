import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import {
  getAllArtisans,
  availabilityLabel,
  availabilityColor,
  type Artisan,
} from "@/lib/api";
import { CATEGORIES, getSubcategories } from "@/constants/categories";

const URGENT_GRADIENTS: Record<string, [string, string]> = {
  plomberie: ["#3B82F6", "#1D4ED8"],
  serrurerie: ["#EF4444", "#B91C1C"],
  electricite: ["#F59E0B", "#B45309"],
  chauffage: ["#F97316", "#C2410C"],
};

type Filter = "all" | "now" | "verified";

export default function PrestationsScreen() {
  const router = useRouter();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

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

  const filteredArtisans = useMemo(() => {
    let list = artisans;
    if (filter === "now") {
      list = list.filter(
        (a) => a.availability === "now" || a.availability === "today",
      );
    } else if (filter === "verified") {
      list = list.filter((a) => a.verified);
    }
    return list;
  }, [artisans, filter]);

  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    filteredArtisans.forEach((a) => {
      m.set(a.categoryId, (m.get(a.categoryId) ?? 0) + 1);
    });
    return m;
  }, [filteredArtisans]);

  const topArtisans = useMemo(
    () =>
      [...filteredArtisans]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6),
    [filteredArtisans],
  );

  const urgentCats = CATEGORIES.filter((c) => c.urgent);
  const otherCats = CATEGORIES.filter((c) => !c.urgent);

  const openCategory = (id: string, name: string) =>
    router.push({
      pathname: "/(app)/artisans",
      params: { category: id, categoryName: name },
    });

  const openArtisan = (id: string) =>
    router.push({ pathname: "/(app)/artisan/[id]", params: { id } });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.title}>Nos prestations</Text>
          <Text style={s.subtitle}>
            {filteredArtisans.length} artisans · 10 services
          </Text>
        </View>
        <View style={s.backBtn} />
      </View>

      <View style={s.filterBar}>
        <Pressable
          style={[s.filterChip, filter === "all" && s.filterActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[s.filterTxt, filter === "all" && s.filterTxtActive]}
          >
            Tous
          </Text>
        </Pressable>
        <Pressable
          style={[s.filterChip, filter === "now" && s.filterActive]}
          onPress={() => setFilter("now")}
        >
          <Ionicons
            name="flash"
            size={13}
            color={filter === "now" ? brand.white : brand.danger500}
          />
          <Text
            style={[s.filterTxt, filter === "now" && s.filterTxtActive]}
          >
            Dispo maintenant
          </Text>
        </Pressable>
        <Pressable
          style={[s.filterChip, filter === "verified" && s.filterActive]}
          onPress={() => setFilter("verified")}
        >
          <Ionicons
            name="shield-checkmark"
            size={13}
            color={filter === "verified" ? brand.white : brand.primary500}
          />
          <Text
            style={[s.filterTxt, filter === "verified" && s.filterTxtActive]}
          >
            Vérifiés
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={brand.primary500} />
          </View>
        ) : (
          <>
            {/* URGENCES 24/7 */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)}>
              <View style={s.secHead}>
                <View style={s.secHeadL}>
                  <View style={s.urgentDot} />
                  <Text style={s.secTitle}>Urgences 24/7</Text>
                </View>
                <Text style={s.secCap}>Intervention rapide</Text>
              </View>

              <View style={s.urgGrid}>
                {urgentCats.map((cat) => {
                  const count = countByCategory.get(cat.id) ?? 0;
                  return (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [pressed && s.cardP]}
                      onPress={() => openCategory(cat.id, cat.name)}
                    >
                      <LinearGradient
                        colors={URGENT_GRADIENTS[cat.id] ?? [brand.primary500, brand.primary700]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.urgCard}
                      >
                        <View style={s.urgBadge}>
                          <Text style={s.urgBadgeTxt}>24/7</Text>
                        </View>
                        <Ionicons
                          name={cat.icon}
                          size={28}
                          color="rgba(255,255,255,0.95)"
                        />
                        <View>
                          <Text style={s.urgName}>{cat.name}</Text>
                          <Text style={s.urgCount}>
                            {count} artisan{count > 1 ? "s" : ""}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* AUTRES SERVICES */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <View style={s.secHead}>
                <Text style={s.secTitle}>Nos autres services</Text>
              </View>

              <View style={s.otherGrid}>
                {otherCats.map((cat) => {
                  const count = countByCategory.get(cat.id) ?? 0;
                  const subs = getSubcategories(cat.id);
                  const preview = subs.slice(0, 2).join(" · ");
                  return (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [s.otherCard, pressed && s.cardP]}
                      onPress={() => openCategory(cat.id, cat.name)}
                    >
                      <View style={[s.otherIcon, { backgroundColor: cat.bg }]}>
                        <Ionicons name={cat.icon} size={24} color={cat.iconColor} />
                      </View>
                      <View style={s.otherInfo}>
                        <Text style={s.otherName}>{cat.name}</Text>
                        {preview ? (
                          <Text style={s.otherPreview} numberOfLines={1}>
                            {preview}
                          </Text>
                        ) : null}
                        <View style={s.otherCountRow}>
                          <Ionicons name="people" size={11} color={brand.gray500} />
                          <Text style={s.otherCount}>
                            {count} artisan{count > 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={brand.gray300} />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* MIEUX NOTÉS */}
            {topArtisans.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                <View style={s.secHead}>
                  <View style={s.secHeadL}>
                    <Ionicons name="star" size={16} color={brand.gold700} />
                    <Text style={s.secTitle}>Mieux notés</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.topList}
                >
                  {topArtisans.map((a) => (
                    <Pressable
                      key={a.id}
                      style={({ pressed }) => [s.topCard, pressed && s.cardP]}
                      onPress={() => openArtisan(a.id)}
                    >
                      <View style={s.topAvatar}>
                        <Text style={s.topAvatarTxt}>{a.initials}</Text>
                      </View>
                      <View style={s.topNameRow}>
                        <Text style={s.topName}>
                          {a.firstName} {a.lastName.charAt(0)}.
                        </Text>
                        {a.verified && (
                          <Ionicons
                            name="shield-checkmark"
                            size={11}
                            color={brand.primary500}
                          />
                        )}
                      </View>
                      <View style={s.topMeta}>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text style={s.topMetaTxt}>
                          {a.rating} · {a.reviewCount}
                        </Text>
                      </View>
                      <View style={s.topAvail}>
                        <View
                          style={[
                            s.dot,
                            { backgroundColor: availabilityColor[a.availability] },
                          ]}
                        />
                        <Text style={s.topAvailTxt} numberOfLines={1}>
                          {availabilityLabel[a.availability]}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            <View style={s.footer}>
              <Ionicons name="shield-checkmark" size={13} color={brand.gold500} />
              <Text style={s.footerTxt}>
                Tous nos artisans sont vérifiés et assurés
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  op: { opacity: 0.6 },
  headerCenter: { alignItems: "center", gap: 2 },
  title: { ...T.lg, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },
  subtitle: { ...T.xs, color: brand.gray500, fontWeight: "500" },

  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  filterActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  filterTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },
  filterTxtActive: { color: brand.white },

  scroll: { paddingBottom: space["2xl"] },
  loader: { padding: space["3xl"], alignItems: "center" },

  secHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  secHeadL: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.danger500 },
  secTitle: { ...T.lg, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },
  secCap: { ...T.xs, color: brand.gray400, fontWeight: "500" },

  cardP: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  // Urgences (2x2 grid gradient)
  urgGrid: {
    paddingHorizontal: space.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  urgCard: {
    width: "100%",
    minHeight: 130,
    borderRadius: radius.xl,
    padding: space.md,
    justifyContent: "space-between",
    ...shadow.md,
  },
  urgBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  urgBadgeTxt: { fontSize: 10, fontWeight: "700", color: brand.white },
  urgName: {
    fontSize: 17,
    fontWeight: "700",
    color: brand.white,
    letterSpacing: -0.3,
  },
  urgCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    fontWeight: "500",
  },

  // Autres services (cards horizontales)
  otherGrid: {
    paddingHorizontal: space.lg,
    gap: 8,
  },
  otherCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow.sm,
  },
  otherIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  otherInfo: { flex: 1, gap: 2 },
  otherName: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.2,
  },
  otherPreview: { fontSize: 11, color: brand.gray500, fontWeight: "500" },
  otherCountRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  otherCount: { fontSize: 11, color: brand.gray500, fontWeight: "600" },

  // Top artisans
  topList: { gap: 10, paddingHorizontal: space.lg, paddingBottom: space.lg },
  topCard: {
    width: 132,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 4,
    ...shadow.sm,
  },
  topAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  topAvatarTxt: { fontSize: 14, fontWeight: "700", color: brand.white },
  topNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  topName: { ...T.sm, fontWeight: "700", color: brand.gray900 },
  topMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  topMetaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  topAvail: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  topAvailTxt: { ...T.xs, fontWeight: "600", color: brand.gray600, flex: 1 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
  },
  footerTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
});
