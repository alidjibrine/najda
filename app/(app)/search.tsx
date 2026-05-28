import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";
import {
  searchArtisans,
  availabilityLabel,
  availabilityColor,
  type Artisan,
} from "@/lib/api";

const POPULAR_SEARCHES = [
  "Plombier",
  "Serrurier",
  "Électricien",
  "Fuite",
  "Dépannage",
  "Chauffage",
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setTimeout(inputRef.current?.focus.bind(inputRef.current), 250);
    return () => clearTimeout(id);
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const list = await searchArtisans(query);
        setResults(list);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const renderArtisan = ({ item }: { item: Artisan }) => (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardP]}
      onPress={() => {
        router.push({
          pathname: "/(app)/artisan/[id]",
          params: { id: item.id },
        });
      }}
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
        <View style={s.metaRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={s.metaTxt}>
            {item.rating} · {item.reviewCount} avis
          </Text>
          <Text style={s.metaDot}>·</Text>
          <Text style={s.metaTxt}>{item.distance} km</Text>
        </View>
        <View style={s.availRow}>
          <View
            style={[
              s.dot,
              { backgroundColor: availabilityColor[item.availability] },
            ]}
          />
          <Text style={s.availTxt}>
            {availabilityLabel[item.availability]}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={brand.gray300} />
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Barre de recherche */}
      <View style={s.searchHeader}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          onPress={() => router.back()}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={brand.gray400} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un artisan ou un service"
            placeholderTextColor={brand.gray400}
            style={s.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={brand.gray400}
              />
            </Pressable>
          )}
        </View>
      </View>

      {query.trim().length < 2 ? (
        // État initial : suggestions
        <Animated.View entering={FadeIn.duration(300)} style={s.suggestBlock}>
          <Text style={s.suggestTitle}>Recherches populaires</Text>
          <View style={s.suggestRow}>
            {POPULAR_SEARCHES.map((term) => (
              <Pressable
                key={term}
                style={({ pressed }) => [s.suggestChip, pressed && s.op]}
                onPress={() => setQuery(term)}
              >
                <Ionicons
                  name="trending-up"
                  size={13}
                  color={brand.primary500}
                />
                <Text style={s.suggestTxt}>{term}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.tipCard}>
            <View style={s.tipIcon}>
              <Ionicons
                name="bulb-outline"
                size={18}
                color={brand.gold700}
              />
            </View>
            <View style={s.tipText}>
              <Text style={s.tipTitle}>Astuce</Text>
              <Text style={s.tipBody}>
                Saisissez un métier (« plombier »), un service (« fuite »)
                ou un nom d&apos;artisan pour démarrer.
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="small" color={brand.primary500} />
        </View>
      ) : results.length === 0 && hasSearched ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={32} color={brand.gray400} />
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <Text style={s.emptySub}>
            Essayez avec un autre mot-clé ou une catégorie.
          </Text>
        </View>
      ) : (
        <>
          <View style={s.resultsHead}>
            <Text style={s.resultsTxt}>
              {results.length} résultat{results.length > 1 ? "s" : ""} pour «{" "}
              <Text style={s.resultsQuery}>{query}</Text> »
            </Text>
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderArtisan}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  searchHeader: {
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
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: brand.gray50,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: comp.inputHeight,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  searchInput: {
    flex: 1,
    ...T.base,
    color: brand.gray900,
    paddingVertical: 0,
  },

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
    gap: 12,
    backgroundColor: brand.gold50,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: brand.gold100,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: brand.gold100,
    justifyContent: "center",
    alignItems: "center",
  },
  tipText: { flex: 1 },
  tipTitle: {
    ...T.sm,
    fontWeight: "700",
    color: brand.gold900,
    marginBottom: 2,
  },
  tipBody: { ...T.xs, color: brand.gold900, lineHeight: 18 },

  loader: { padding: space.xl, alignItems: "center" },

  empty: {
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
    marginTop: 60,
  },
  emptyTitle: { ...T.base, fontWeight: "700", color: brand.gray800 },
  emptySub: { ...T.sm, color: brand.gray500, textAlign: "center" },

  resultsHead: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 4 },
  resultsTxt: { ...T.sm, color: brand.gray600 },
  resultsQuery: { fontWeight: "700", color: brand.gray900 },

  list: { padding: space.lg, paddingTop: space.sm },

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
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 15, fontWeight: "700", color: brand.white },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { ...T.sm, fontWeight: "700", color: brand.gray900 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  metaDot: { ...T.xs, color: brand.gray300 },

  availRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  availTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },
});
