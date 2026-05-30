import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";
import {
  searchArtisans,
  availabilityLabel,
  availabilityColor,
  type Artisan,
  type SearchFilters,
} from "@/lib/api";
import { CATEGORIES, getCategory } from "@/constants/categories";

const POPULAR_SEARCHES = [
  "Plombier",
  "Serrurier",
  "Électricien",
  "Fuite d'eau",
  "Dépannage",
  "Chauffage",
];

type QuickFilter = "now" | "verified" | "topRated";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query, setQuery] = useState(params.q ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(params.category ?? null);
  const [activeFilters, setActiveFilters] = useState<Set<QuickFilter>>(new Set());
  const [results, setResults] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  // Recherche debouncée à chaque changement
  useEffect(() => {
    const hasInput =
      query.trim().length >= 2 ||
      !!categoryId ||
      activeFilters.size > 0;

    if (!hasInput) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const filters: SearchFilters = {
          query: query.trim(),
          categoryId: categoryId ?? undefined,
          availableNow: activeFilters.has("now"),
          verifiedOnly: activeFilters.has("verified"),
          topRated: activeFilters.has("topRated"),
        };
        const list = await searchArtisans(filters);
        setResults(list);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, categoryId, activeFilters]);

  const toggleFilter = useCallback((f: QuickFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  const toggleCategory = (id: string) => {
    setCategoryId((prev) => (prev === id ? null : id));
  };

  const resetAll = () => {
    setQuery("");
    setCategoryId(null);
    setActiveFilters(new Set());
  };

  const activeCategory = useMemo(
    () => (categoryId ? getCategory(categoryId) : null),
    [categoryId],
  );

  const hasActiveFilters = !!categoryId || activeFilters.size > 0;

  const renderArtisan = ({ item, index }: { item: Artisan; index: number }) => {
    const cat = getCategory(item.categoryId);
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <Pressable
          style={({ pressed }) => [s.card, pressed && s.cardP]}
          onPress={() =>
            router.push({
              pathname: "/(app)/artisan/[id]",
              params: { id: item.id },
            })
          }
        >
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

          <View style={s.cardInfo}>
            <View style={s.nameRow}>
              <Text style={s.name}>
                {item.firstName} {item.lastName.charAt(0)}.
              </Text>
              {item.verified && (
                <Ionicons
                  name="shield-checkmark"
                  size={13}
                  color={brand.primary500}
                />
              )}
            </View>
            {cat && (
              <View style={s.catPill}>
                <Ionicons name={cat.icon} size={10} color={cat.iconColor} />
                <Text style={s.catPillTxt}>{cat.name}</Text>
              </View>
            )}
            <View style={s.metaRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.metaTxt}>
                {item.rating} ({item.reviewCount})
              </Text>
              <Text style={s.metaDot}>·</Text>
              <Text style={s.metaTxt}>{item.distance} km</Text>
              <Text style={s.metaDot}>·</Text>
              <View style={s.availInline}>
                <View
                  style={[
                    s.dot,
                    { backgroundColor: availabilityColor[item.availability] },
                  ]}
                />
                <Text style={s.metaTxt}>
                  {availabilityLabel[item.availability]}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color={brand.gray300} />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER avec recherche */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <View style={s.inputBox}>
          <Ionicons name="search" size={18} color={brand.gray400} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Plombier, fuite, serrure…"
            placeholderTextColor={brand.gray400}
            style={s.input}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={brand.gray400} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Catégories en chips horizontaux */}
      <View style={s.chipsBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          <Pressable
            style={[s.catChip, !categoryId && s.catChipActive]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={[s.catChipTxt, !categoryId && s.catChipTxtActive]}>
              Toutes
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[s.catChip, active && s.catChipActive]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={active ? brand.white : cat.iconColor}
                />
                <Text
                  style={[s.catChipTxt, active && s.catChipTxtActive]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick filters en pilules */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.quickRow}
        >
          <QuickPill
            icon="flash"
            color={brand.danger500}
            label="Dispo maintenant"
            active={activeFilters.has("now")}
            onPress={() => toggleFilter("now")}
          />
          <QuickPill
            icon="shield-checkmark"
            color={brand.primary500}
            label="Vérifiés"
            active={activeFilters.has("verified")}
            onPress={() => toggleFilter("verified")}
          />
          <QuickPill
            icon="star"
            color={brand.gold700}
            label="Mieux notés"
            active={activeFilters.has("topRated")}
            onPress={() => toggleFilter("topRated")}
          />
        </ScrollView>
      </View>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && (
        <View style={s.filterBar}>
          <Text style={s.filterCount}>
            {activeCategory ? `${activeCategory.name}` : "Tous"} ·{" "}
            {activeFilters.size > 0
              ? `${activeFilters.size} filtre${activeFilters.size > 1 ? "s" : ""}`
              : "sans filtre"}
          </Text>
          <Pressable onPress={resetAll} hitSlop={8}>
            <Text style={s.resetTxt}>Réinitialiser</Text>
          </Pressable>
        </View>
      )}

      {/* Contenu */}
      {query.trim().length < 2 && !hasActiveFilters ? (
        <Animated.View entering={FadeIn.duration(300)} style={s.suggestBlock}>
          <Text style={s.suggestTitle}>Recherches populaires</Text>
          <View style={s.suggestRow}>
            {POPULAR_SEARCHES.map((term) => (
              <Pressable
                key={term}
                style={({ pressed }) => [s.suggestChip, pressed && s.op]}
                onPress={() => setQuery(term)}
              >
                <Ionicons name="trending-up" size={13} color={brand.primary500} />
                <Text style={s.suggestTxt}>{term}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.tipCard}>
            <Ionicons name="bulb-outline" size={18} color={brand.gold700} />
            <Text style={s.tipTxt}>
              Tapez un mot-clé, choisissez une catégorie ou activez des
              filtres pour trouver l&apos;artisan parfait.
            </Text>
          </View>
        </Animated.View>
      ) : loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="small" color={brand.primary500} />
        </View>
      ) : results.length === 0 && hasSearched ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={36} color={brand.gray400} />
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <Text style={s.emptySub}>
            Modifiez votre recherche ou désactivez certains filtres.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderArtisan}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={s.resultsCount}>
                {results.length} résultat{results.length > 1 ? "s" : ""}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function QuickPill({
  icon,
  color,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[s.quickPill, active && s.quickPillActive]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={13} color={active ? brand.white : color} />
      <Text style={[s.quickPillTxt, active && s.quickPillTxtActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: comp.inputHeight,
    backgroundColor: brand.gray50,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  input: { flex: 1, ...T.base, color: brand.gray900, paddingVertical: 0 },

  chipsBlock: {
    backgroundColor: brand.white,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
    gap: 6,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  catChipActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  catChipTxt: { ...T.sm, fontWeight: "600", color: brand.gray700 },
  catChipTxtActive: { color: brand.white },

  quickRow: {
    gap: 8,
    paddingHorizontal: space.lg,
    paddingVertical: 4,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  quickPillActive: {
    backgroundColor: brand.gray900,
    borderColor: brand.gray900,
  },
  quickPillTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },
  quickPillTxtActive: { color: brand.white },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    backgroundColor: brand.primary50,
    borderBottomWidth: 1,
    borderBottomColor: brand.primary100,
  },
  filterCount: { ...T.xs, fontWeight: "600", color: brand.primary700 },
  resetTxt: { ...T.xs, fontWeight: "700", color: brand.primary500 },

  suggestBlock: { padding: space.lg },
  suggestTitle: {
    ...T.xs,
    fontWeight: "700",
    color: brand.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: space.md,
  },
  suggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space.xl,
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: brand.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  suggestTxt: { ...T.sm, fontWeight: "600", color: brand.gray700 },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: brand.gold50,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: brand.gold100,
    alignItems: "center",
  },
  tipTxt: {
    flex: 1,
    ...T.xs,
    color: brand.gold900,
    lineHeight: 18,
  },

  loader: { padding: space["2xl"], alignItems: "center" },
  empty: {
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
    marginTop: 40,
  },
  emptyTitle: { ...T.lg, fontWeight: "700", color: brand.gray800 },
  emptySub: {
    ...T.sm,
    color: brand.gray500,
    textAlign: "center",
    maxWidth: 280,
  },

  list: { padding: space.lg, paddingTop: space.md },
  resultsCount: {
    ...T.xs,
    color: brand.gray500,
    fontWeight: "500",
    marginBottom: space.md,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.sm,
  },
  cardP: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 16, fontWeight: "700", color: brand.white },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { ...T.sm, fontWeight: "700", color: brand.gray900 },

  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: brand.gray50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  catPillTxt: {
    fontSize: 10,
    fontWeight: "600",
    color: brand.gray700,
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  metaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  metaDot: { ...T.xs, color: brand.gray300 },
  availInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
