import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
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
  getArtisan,
  getArtisanReviews,
  availabilityLabel,
  type Artisan,
  type Review,
} from "@/lib/api";
import { getCategory } from "@/constants/categories";
import { getMyFavorites, toggleFavorite } from "@/lib/api-extras";

function isAvailable(a: Artisan) {
  return a.availability === "now" || a.availability === "today";
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Aujourd'hui";
  if (days < 7) return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function ArtisanDetailScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    Promise.all([getArtisan(id), getArtisanReviews(id), getMyFavorites()])
      .then(([a, r, favs]) => {
        if (!mounted) return;
        setArtisan(a);
        setReviews(r);
        setIsFav(favs.includes(id));
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

  const handleToggleFavorite = async () => {
    try {
      const now = await toggleFavorite(id);
      setIsFav(now);
    } catch (err: unknown) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
    }
  };

  const handleShare = async () => {
    if (!artisan) return;
    try {
      await Share.share({
        title: `${artisan.firstName} ${artisan.lastName} sur Najda`,
        message: `Je te recommande ${artisan.firstName} ${artisan.lastName} (${cat?.name ?? "Artisan"}) sur Najda. Note : ${artisan.rating.toFixed(1)}/5\n\nnajda://artisan/${artisan.id}`,
      });
    } catch {
      // L'utilisateur a annulé
    }
  };

  const cat = artisan ? getCategory(artisan.categoryId) : null;

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !artisan) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <Ionicons name="alert-circle-outline" size={32} color={t.danger} />
          <Text style={[s.errorTxt, { color: t.text }]}>
            {error ?? "Artisan introuvable."}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[
              s.errorBtn,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <Text style={[s.errorBtnTxt, { color: t.text }]}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const openBooking = () =>
    router.push({
      pathname: "/(app)/booking/[artisanId]",
      params: { artisanId: artisan.id },
    });

  const openMessage = () =>
    Alert.alert("Messagerie", "La conversation s'ouvrira après réservation.");

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: 120 + insets.bottom }]}
      >
        {/* ============= HERO COMPACT ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={s.heroTop}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [s.heroIconBtn, pressed && s.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={s.heroTopRight}>
              <Pressable
                onPress={handleToggleFavorite}
                hitSlop={12}
                style={({ pressed }) => [s.heroIconBtn, pressed && s.pressed]}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? "#FFE38A" : "#FFFFFF"}
                />
              </Pressable>
              <Pressable
                onPress={handleShare}
                hitSlop={12}
                style={({ pressed }) => [s.heroIconBtn, pressed && s.pressed]}
              >
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={s.heroInfo}>
            <Animated.View entering={FadeIn.duration(400)} style={s.heroAvatarWrap}>
              {artisan.avatarUrl ? (
                <Image source={{ uri: artisan.avatarUrl }} style={s.heroAvatar} />
              ) : (
                <View style={[s.heroAvatar, s.heroAvatarFallback]}>
                  <Text style={s.heroAvatarInitials}>{artisan.initials}</Text>
                </View>
              )}
              {isAvailable(artisan) && (
                <View style={s.availPill}>
                  <View style={s.availPillDot} />
                </View>
              )}
            </Animated.View>

            <View style={s.heroIdentity}>
              <Animated.View
                entering={FadeInDown.delay(80).duration(400)}
                style={s.heroNameRow}
              >
                <Text style={s.heroName} numberOfLines={1}>
                  {artisan.firstName} {artisan.lastName}
                </Text>
                {artisan.verified && (
                  <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                )}
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(140).duration(400)}
                style={s.heroJob}
              >
                {cat?.name ?? "Artisan"}
                {artisan.city ? ` · ${artisan.city}` : ""}
              </Animated.Text>

              {/* Badges */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={s.heroBadges}
              >
                {artisan.rating >= 4.7 && (
                  <View style={s.heroBadge}>
                    <Ionicons name="star" size={10} color="#FFE38A" />
                    <Text style={s.heroBadgeTxt}>Top noté</Text>
                  </View>
                )}
                {artisan.yearsExp >= 10 && (
                  <View style={s.heroBadge}>
                    <Ionicons name="ribbon" size={10} color="#FFE38A" />
                    <Text style={s.heroBadgeTxt}>Expert</Text>
                  </View>
                )}
                {artisan.insured && (
                  <View style={s.heroBadge}>
                    <Ionicons name="lock-closed" size={10} color="#FFE38A" />
                    <Text style={s.heroBadgeTxt}>Assuré</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>
        </LinearGradient>

        {/* ============= STATS BAR (3 colonnes) ============= */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={[
            s.statsBar,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <StatCol
            value={artisan.rating.toFixed(1)}
            label={`${artisan.reviewCount} avis`}
            icon="star"
            iconColor="#C9A961"
            t={t}
          />
          <View style={[s.statDivider, { backgroundColor: t.border }]} />
          <StatCol
            value={`${artisan.yearsExp}`}
            label={`an${artisan.yearsExp > 1 ? "s" : ""} d'expérience`}
            icon="briefcase-outline"
            iconColor={t.primary}
            t={t}
          />
          <View style={[s.statDivider, { backgroundColor: t.border }]} />
          <StatCol
            value={artisan.priceRange}
            label="Tarifs"
            icon="pricetag-outline"
            iconColor={t.primary}
            t={t}
          />
        </Animated.View>

        {/* ============= DISPONIBILITÉ ============= */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(400)}
          style={[
            s.dispoCard,
            {
              backgroundColor: isAvailable(artisan)
                ? "rgba(16,185,129,0.08)"
                : t.primaryMuted,
              borderColor: isAvailable(artisan)
                ? "rgba(16,185,129,0.30)"
                : t.primary + "30",
            },
          ]}
        >
          <View
            style={[
              s.dispoIcon,
              {
                backgroundColor: isAvailable(artisan)
                  ? "rgba(16,185,129,0.18)"
                  : "rgba(124,143,255,0.18)",
              },
            ]}
          >
            <Ionicons
              name={isAvailable(artisan) ? "flash" : "calendar-outline"}
              size={18}
              color={isAvailable(artisan) ? "#10B981" : t.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                s.dispoValue,
                { color: isAvailable(artisan) ? "#059669" : t.text },
              ]}
            >
              {availabilityLabel[artisan.availability]}
            </Text>
            <Text style={[s.dispoSub, { color: t.textSecondary }]}>
              Réponse moyenne sous 30 minutes
            </Text>
          </View>
        </Animated.View>

        {/* ============= BIO ============= */}
        {artisan.bio && (
          <Animated.View
            entering={FadeInDown.delay(380).duration(400)}
            style={s.section}
          >
            <Text style={[s.sectionTitle, { color: t.text }]}>À propos</Text>
            <Text style={[s.bioTxt, { color: t.textSecondary }]}>
              {artisan.bio}
            </Text>
          </Animated.View>
        )}

        {/* ============= SERVICES ============= */}
        {artisan.services.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(440).duration(400)}
            style={s.section}
          >
            <Text style={[s.sectionTitle, { color: t.text }]}>
              Services proposés
            </Text>
            <View style={s.servicesGrid}>
              {artisan.services.map((svc) => (
                <View
                  key={svc}
                  style={[
                    s.serviceChip,
                    {
                      backgroundColor: t.primaryMuted,
                      borderColor: t.primary + "30",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={t.primary}
                  />
                  <Text style={[s.serviceChipTxt, { color: t.primary }]}>
                    {svc}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ============= POURQUOI CHOISIR ============= */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={s.section}
        >
          <Text style={[s.sectionTitle, { color: t.text }]}>
            Pourquoi le choisir
          </Text>
          <View style={s.trustRow}>
            <TrustItem
              icon="shield-checkmark"
              label="Identité vérifiée"
              sub="Pièce d'identité contrôlée"
              active={artisan.verified}
              t={t}
            />
            <TrustItem
              icon="lock-closed"
              label="Assurance décennale"
              sub="Protégé en cas de sinistre"
              active={artisan.insured}
              t={t}
            />
            <TrustItem
              icon="document-text"
              label="Kbis à jour"
              sub="Entreprise déclarée"
              active={artisan.verified}
              t={t}
            />
          </View>
        </Animated.View>

        {/* ============= AVIS ============= */}
        {reviews.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(560).duration(400)}
            style={s.section}
          >
            <View style={s.reviewsHead}>
              <Text style={[s.sectionTitle, { color: t.text, marginBottom: 0 }]}>
                Avis clients
              </Text>
              <View style={s.reviewsScore}>
                <Ionicons name="star" size={13} color="#C9A961" />
                <Text style={[s.reviewsScoreVal, { color: t.text }]}>
                  {artisan.rating.toFixed(1)}
                </Text>
                <Text style={[s.reviewsScoreCount, { color: t.textSecondary }]}>
                  · {artisan.reviewCount}
                </Text>
              </View>
            </View>

            {reviews.slice(0, 3).map((r) => (
              <View
                key={r.id}
                style={[
                  s.reviewCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.reviewHeader}>
                  <View
                    style={[
                      s.reviewAvatar,
                      { backgroundColor: t.primaryMuted },
                    ]}
                  >
                    <Text style={[s.reviewAvatarTxt, { color: t.primary }]}>
                      {r.author.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reviewAuthor, { color: t.text }]}>
                      {r.author}
                    </Text>
                    <Text style={[s.reviewDate, { color: t.textTertiary }]}>
                      {timeAgo(r.createdAt)}
                    </Text>
                  </View>
                  <View style={s.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={11}
                        color={star <= r.rating ? "#C9A961" : t.borderStrong}
                      />
                    ))}
                  </View>
                </View>
                {r.text && (
                  <Text style={[s.reviewText, { color: t.textSecondary }]}>
                    « {r.text} »
                  </Text>
                )}
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* ============= STICKY BOTTOM ============= */}
      <View
        style={[
          s.bottomBar,
          {
            backgroundColor: t.surface,
            borderTopColor: t.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          onPress={openMessage}
          style={({ pressed }) => [
            s.messageBtn,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
            pressed && s.pressed,
          ]}
        >
          <Ionicons name="chatbubble-outline" size={20} color={t.text} />
        </Pressable>

        <Pressable
          onPress={openBooking}
          style={({ pressed }) => [s.bookBtn, pressed && s.ctaPressed]}
        >
          <LinearGradient
            colors={najdaGradient as unknown as [string, string, ...string[]]}
            start={najdaGradientDirection.start}
            end={najdaGradientDirection.end}
            style={s.bookBtnInner}
          >
            <Text style={s.bookBtnTxt}>Réserver maintenant</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================
// Stat column
// =====================================================
function StatCol({
  value,
  label,
  icon,
  iconColor,
  t,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={s.statCol}>
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text style={[s.statValue, { color: t.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text
        style={[s.statLabel, { color: t.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// =====================================================
// Trust item
// =====================================================
function TrustItem({
  icon,
  label,
  sub,
  active,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  active: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        s.trustItem,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          opacity: active ? 1 : 0.45,
        },
      ]}
    >
      <View
        style={[s.trustIcon, { backgroundColor: t.primaryMuted }]}
      >
        <Ionicons name={icon} size={18} color={t.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.trustLabel, { color: t.text }]}>{label}</Text>
        <Text style={[s.trustSub, { color: t.textSecondary }]}>{sub}</Text>
      </View>
      {active && (
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {},

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: space.lg,
  },
  errorTxt: { ...T.base, textAlign: "center" },
  errorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  errorBtnTxt: { ...T.sm, fontWeight: "700" },

  // ============= HERO =============
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl + 4,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  heroTopRight: { flexDirection: "row", gap: 8 },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  heroInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroAvatarWrap: {
    position: "relative",
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatarInitials: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  availPill: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  availPillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },

  heroIdentity: { flex: 1 },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  heroJob: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 8,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroBadgeTxt: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // ============= STATS BAR =============
  statsBar: {
    flexDirection: "row",
    marginHorizontal: space.lg,
    marginTop: -22,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...shadow.md,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  statDivider: { width: 0.5, marginVertical: 4 },

  // ============= DISPO =============
  dispoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dispoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  dispoValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  dispoSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  // ============= SECTIONS =============
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  bioTxt: { fontSize: 14, lineHeight: 22, fontWeight: "500" },

  // ============= SERVICES =============
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  serviceChip: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  serviceChipTxt: { fontSize: 12, fontWeight: "700", letterSpacing: -0.1 },

  // ============= TRUST =============
  trustRow: { gap: 8 },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  trustLabel: { fontSize: 13, fontWeight: "700", letterSpacing: -0.1 },
  trustSub: { fontSize: 11, fontWeight: "500", marginTop: 1 },

  // ============= AVIS =============
  reviewsHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewsScore: { flexDirection: "row", alignItems: "center", gap: 3 },
  reviewsScoreVal: { fontSize: 13, fontWeight: "800" },
  reviewsScoreCount: { fontSize: 12, fontWeight: "500" },
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarTxt: { fontSize: 14, fontWeight: "800" },
  reviewAuthor: { fontSize: 14, fontWeight: "700" },
  reviewDate: { fontSize: 11, fontWeight: "500" },
  reviewStars: { flexDirection: "row", gap: 1 },
  reviewText: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },

  // ============= CTA =============
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  messageBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookBtn: { flex: 1, borderRadius: 16, ...shadow.lg },
  bookBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  bookBtnTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
