import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import {
  getArtisan,
  getArtisanReviews,
  availabilityLabel,
  availabilityColor,
  type Artisan,
  type Review,
} from "@/lib/api";

export default function ArtisanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getArtisan(id), getArtisanReviews(id)])
      .then(([a, r]) => {
        if (!mounted) return;
        setArtisan(a);
        setReviews(r);
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
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={brand.primary500} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !artisan) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loader}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={brand.danger500}
          />
          <Text style={s.errorTxt}>{error ?? "Artisan introuvable."}</Text>
          <Pressable onPress={() => router.back()} style={s.errorBtn}>
            <Text style={s.errorBtnTxt}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleBook = () => {
    router.push({
      pathname: "/(app)/booking/[artisanId]",
      params: { artisanId: artisan.id },
    });
  };

  const handleCall = () =>
    Alert.alert("Appel", "La fonction appel sera disponible prochainement.");
  const handleMessage = () =>
    Alert.alert("Message", "La messagerie sera disponible prochainement.");

  const stats = [
    { label: "Avis", value: String(artisan.reviewCount), icon: "star" as const },
    { label: "Expérience", value: `${artisan.yearsExp} ans`, icon: "ribbon" as const },
    { label: "Distance", value: `${artisan.distance} km`, icon: "location" as const },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.hBtn, pressed && s.op]}
          onPress={() => router.back()}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <Text style={s.hTitle}>Profil artisan</Text>
        <Pressable
          style={({ pressed }) => [s.hBtn, pressed && s.op]}
          onPress={() =>
            Alert.alert("Partager", "Le partage sera disponible prochainement.")
          }
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={20} color={brand.gray800} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.hero}>
          <View style={s.avatarLg}>
            <Text style={s.avatarLgTxt}>{artisan.initials}</Text>
          </View>
          <View style={s.heroInfo}>
            <View style={s.heroNameRow}>
              <Text style={s.heroName}>
                {artisan.firstName} {artisan.lastName}
              </Text>
              {artisan.verified && (
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={brand.primary500}
                />
              )}
            </View>
            <View style={s.heroMeta}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={s.heroRating}>{artisan.rating}</Text>
              <Text style={s.heroDot}>·</Text>
              <Text style={s.heroSub}>{artisan.reviewCount} avis</Text>
            </View>
            <View style={s.availRow}>
              <View
                style={[
                  s.availDot,
                  { backgroundColor: availabilityColor[artisan.availability] },
                ]}
              />
              <Text style={s.availTxt}>
                {availabilityLabel[artisan.availability]}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.badges}>
          {artisan.verified && (
            <View style={s.badge}>
              <Ionicons name="shield-checkmark" size={14} color={brand.primary500} />
              <Text style={s.badgeTxt}>Vérifié</Text>
            </View>
          )}
          {artisan.insured && (
            <View style={s.badge}>
              <Ionicons name="document-text-outline" size={14} color={brand.primary500} />
              <Text style={s.badgeTxt}>Assuré</Text>
            </View>
          )}
          <View style={s.badge}>
            <Ionicons name="cash-outline" size={14} color={brand.primary500} />
            <Text style={s.badgeTxt}>{artisan.priceRange}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={s.statsRow}>
          {stats.map((st) => (
            <View key={st.label} style={s.statCard}>
              <Ionicons name={st.icon} size={18} color={brand.primary400} />
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={s.quickActions}>
          <Pressable
            style={({ pressed }) => [s.qaBtn, pressed && s.op]}
            onPress={handleCall}
          >
            <View style={s.qaIcon}>
              <Ionicons name="call-outline" size={20} color={brand.primary500} />
            </View>
            <Text style={s.qaTxt}>Appeler</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.qaBtn, pressed && s.op]}
            onPress={handleMessage}
          >
            <View style={s.qaIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={brand.primary500} />
            </View>
            <Text style={s.qaTxt}>Message</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.qaBtn, pressed && s.op]}
            onPress={() => Alert.alert("Favori", "Ajouté à vos favoris.")}
          >
            <View style={s.qaIcon}>
              <Ionicons name="heart-outline" size={20} color={brand.primary500} />
            </View>
            <Text style={s.qaTxt}>Favori</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={s.secTitle}>À propos</Text>
          <View style={s.bioCard}>
            <Text style={s.bioTxt}>{artisan.bio}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(400)}>
          <Text style={s.secTitle}>Services proposés</Text>
          <View style={s.servicesWrap}>
            {artisan.services.map((svc) => (
              <View key={svc} style={s.svcChip}>
                <Text style={s.svcTxt}>{svc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(420).duration(400)}>
          <View style={s.secHeadRow}>
            <Text style={s.secTitle}>Avis clients</Text>
            <Text style={s.secCount}>{artisan.reviewCount} avis</Text>
          </View>
          {reviews.length === 0 ? (
            <View style={s.noReviews}>
              <Text style={s.noReviewsTxt}>Aucun avis pour l&apos;instant.</Text>
            </View>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={s.reviewCard}>
                <View style={s.reviewTop}>
                  <Text style={s.reviewAuthor}>{rev.author}</Text>
                  <View style={s.reviewStars}>
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={s.reviewTxt}>{rev.text}</Text>
                <Text style={s.reviewDate}>{rev.date}</Text>
              </View>
            ))
          )}
        </Animated.View>

        <View style={s.spacer} />
      </ScrollView>

      <View style={s.ctaBar}>
        <View style={s.ctaInfo}>
          <Text style={s.ctaPrice}>{artisan.priceRange}</Text>
          <Text style={s.ctaSub}>Tarif indicatif</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.ctaBtn, pressed && s.ctaBtnP]}
          onPress={handleBook}
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={18} color={brand.white} />
          <Text style={s.ctaBtnTxt}>Réserver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.white },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: space.md,
    padding: space.xl,
  },
  errorTxt: {
    ...T.base,
    color: brand.gray700,
    textAlign: "center",
  },
  errorBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.primary500,
    borderRadius: radius.md,
    marginTop: space.md,
  },
  errorBtnTxt: { ...T.base, fontWeight: "600", color: brand.white },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  hBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  op: { opacity: 0.6 },
  hTitle: { ...T.base, fontWeight: "600", color: brand.gray900 },

  scroll: { paddingHorizontal: space.lg, paddingTop: space.lg },

  hero: { flexDirection: "row", gap: 16, marginBottom: space.lg },
  avatarLg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.lg,
  },
  avatarLgTxt: { fontSize: 24, fontWeight: "700", color: brand.white },
  heroInfo: { flex: 1, justifyContent: "center", gap: 6 },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: {
    ...T.xl,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.4,
  },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroRating: { ...T.sm, fontWeight: "700", color: brand.gray900 },
  heroDot: { ...T.sm, color: brand.gray300 },
  heroSub: { ...T.sm, color: brand.gray500 },
  availRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },

  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: space.lg,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: brand.primary50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  badgeTxt: { ...T.xs, fontWeight: "600", color: brand.primary600 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: space.xl },
  statCard: {
    flex: 1,
    backgroundColor: brand.gray50,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statVal: { ...T.lg, fontWeight: "700", color: brand.gray900 },
  statLabel: { ...T.xs, color: brand.gray500, fontWeight: "500" },

  quickActions: { flexDirection: "row", gap: 12, marginBottom: space.xl },
  qaBtn: { flex: 1, alignItems: "center", gap: 8 },
  qaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
  },
  qaTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },

  secTitle: {
    ...T.lg,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.3,
    marginBottom: space.md,
  },
  secHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  secCount: { ...T.sm, color: brand.gray400, fontWeight: "500" },

  bioCard: {
    backgroundColor: brand.gray50,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.xl,
  },
  bioTxt: { ...T.base, color: brand.gray700, lineHeight: 22 },

  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space.xl,
  },
  svcChip: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.gray200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  svcTxt: { ...T.sm, fontWeight: "500", color: brand.gray700 },

  noReviews: {
    padding: space.md,
    alignItems: "center",
  },
  noReviewsTxt: { ...T.sm, color: brand.gray500 },

  reviewCard: {
    backgroundColor: brand.gray50,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewAuthor: { ...T.sm, fontWeight: "600", color: brand.gray900 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewTxt: { ...T.sm, color: brand.gray700, lineHeight: 20, marginBottom: 6 },
  reviewDate: { ...T.xs, color: brand.gray400 },

  spacer: { height: 100 },

  ctaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.gray100,
    ...shadow.md,
  },
  ctaInfo: { gap: 2 },
  ctaPrice: { ...T.lg, fontWeight: "700", color: brand.gray900 },
  ctaSub: { ...T.xs, color: brand.gray500 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: brand.primary500,
    paddingHorizontal: 28,
    height: 50,
    borderRadius: radius.md,
    ...shadow.lg,
  },
  ctaBtnP: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaBtnTxt: { ...T.base, fontWeight: "600", color: brand.white },
});
