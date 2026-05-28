import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T, comp } from "@/constants/theme";
import {
  ARTISANS,
  availabilityLabel,
  availabilityColor,
  type Artisan,
} from "@/constants/mockData";

type Filter = "all" | "now" | "rating" | "closest";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "now", label: "Dispo maintenant" },
  { key: "rating", label: "Mieux notés" },
  { key: "closest", label: "Les plus proches" },
];

export default function ArtisansScreen() {
  const router = useRouter();
  const { category, categoryName } = useLocalSearchParams<{
    category: string;
    categoryName: string;
  }>();
  const [filter, setFilter] = useState<Filter>("all");

  const artisans = useMemo(() => {
    let list = ARTISANS.filter((a) => a.categoryId === category);

    switch (filter) {
      case "now":
        list = list.filter(
          (a) => a.availability === "now" || a.availability === "today",
        );
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "closest":
        list = [...list].sort((a, b) => a.distance - b.distance);
        break;
    }

    return list;
  }, [category, filter]);

  const renderArtisan = ({ item, index }: { item: Artisan; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        style={({ pressed }) => [s.card, pressed && s.cardP]}
        onPress={() =>
          router.push({
            pathname: "/(app)/artisan/[id]",
            params: { id: item.id },
          })
        }
        accessibilityRole="button"
      >
        {/* Avatar */}
        <View
          style={[
            s.avatar,
            {
              backgroundColor:
                item.availability === "now" || item.availability === "today"
                  ? brand.primary500
                  : brand.gray400,
            },
          ]}
        >
          <Text style={s.avatarTxt}>{item.initials}</Text>
        </View>

        {/* Infos */}
        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name}>
              {item.firstName} {item.lastName.charAt(0)}.
            </Text>
            {item.verified && (
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={brand.primary500}
              />
            )}
          </View>

          <View style={s.metaRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={s.metaTxt}>
              {item.rating} ({item.reviewCount})
            </Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaTxt}>{item.distance} km</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaTxt}>{item.yearsExp} ans</Text>
          </View>

          <View style={s.bottomRow}>
            <View style={s.availBadge}>
              <View
                style={[
                  s.availDot,
                  { backgroundColor: availabilityColor[item.availability] },
                ]}
              />
              <Text style={s.availTxt}>
                {availabilityLabel[item.availability]}
              </Text>
            </View>
            <Text style={s.price}>{item.priceRange}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={brand.gray300} />
      </Pressable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>{categoryName ?? "Artisans"}</Text>
        <View style={s.backBtn} />
      </View>

      {/* Filtres */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                s.filterTxt,
                filter === f.key && s.filterTxtActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Nombre de résultats */}
      <View style={s.resultRow}>
        <Text style={s.resultTxt}>
          {artisans.length} artisan{artisans.length > 1 ? "s" : ""} disponible
          {artisans.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={artisans}
        keyExtractor={(item) => item.id}
        renderItem={renderArtisan}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={32} color={brand.gray400} />
            <Text style={s.emptyTxt}>
              Aucun artisan disponible pour ce filtre.
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    ...T.lg,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.3,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    borderWidth: 1,
    borderColor: brand.gray100,
  },
  filterChipActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  filterTxt: { ...T.xs, fontWeight: "600", color: brand.gray600 },
  filterTxtActive: { color: brand.white },

  resultRow: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  resultTxt: { ...T.sm, color: brand.gray500, fontWeight: "500" },

  list: { paddingHorizontal: space.lg, paddingBottom: space.xl },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
    ...shadow.sm,
  },
  cardP: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 16, fontWeight: "700", color: brand.white },

  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    ...T.base,
    fontWeight: "600",
    color: brand.gray900,
    letterSpacing: -0.2,
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  metaDot: { ...T.xs, color: brand.gray300 },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },
  price: { ...T.xs, fontWeight: "600", color: brand.primary500 },

  empty: {
    alignItems: "center",
    paddingVertical: space["3xl"],
    gap: space.md,
  },
  emptyTxt: { ...T.base, color: brand.gray500, textAlign: "center" },
});
