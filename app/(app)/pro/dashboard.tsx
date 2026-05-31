import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
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
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, type Profile } from "@/lib/api";
import {
  getProIncomingBookings,
  countUnreadNotifications,
  getProStats,
  getMyProProfile,
  type ProStats,
  type ProProfile,
} from "@/lib/api-extras";
import { CATEGORIES } from "@/constants/categories";

interface ProBooking {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
}

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

export default function ProDashboardScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [unread, setUnread] = useState(0);
  const [stats, setStats] = useState<ProStats>(EMPTY_STATS);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      // Chaque fetch est wrappé pour ne JAMAIS faire planter Promise.all
      // et pour toujours retourner une valeur safe.
      const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
        p.catch(() => fallback);

      Promise.all([
        safe(getMyProfile(), null),
        safe(getMyProProfile(), null),
        safe(getProIncomingBookings(), [] as ProBooking[]),
        safe(countUnreadNotifications(), 0),
        safe(getProStats(), EMPTY_STATS),
      ])
        .then(([p, pp, b, n, st]) => {
          if (!mounted) return;
          setProfile(p);
          setProProfile(pp);
          setBookings(Array.isArray(b) ? (b as ProBooking[]) : []);
          setUnread(typeof n === "number" ? n : 0);
          setStats(st ?? EMPTY_STATS);
        })
        .catch(() => {
          if (!mounted) return;
          setBookings([]);
          setStats(EMPTY_STATS);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  // ===== Identité affichée =====
  const firstName = profile?.firstName?.trim() ?? "";
  const lastName = profile?.lastName?.trim() ?? "";
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : (user?.email?.split("@")[0] ?? "Pro Najda");
  const initial = (firstName.charAt(0) || user?.email?.charAt(0) || "?").toUpperCase();
  const category = CATEGORIES.find((c) => c.id === proProfile?.categoryId);
  const greeting = greetingFor(new Date().getHours());

  // ===== Today (safe array access) =====
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = safeBookings
    .filter(
      (b) =>
        b.date === todayStr &&
        (b.status === "accepted" || b.status === "in_progress"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const pendingBookings = safeBookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const incompleteProfile = stats.completionPct < 100;

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      >
        {/* ============= HERO IDENTITÉ ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 14 }]}
        >
          {/* Ligne 1 : Badge mode + Cloche */}
          <View style={s.heroTopBar}>
            <View style={s.modePill}>
              <Ionicons name="construct" size={11} color="#FFFFFF" />
              <Text style={s.modePillTxt}>Mode Artisan</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(app)/notifications")}
              hitSlop={10}
              style={({ pressed }) => [s.bellBtn, pressed && s.pressed]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#FFFFFF"
              />
              {unread > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeTxt}>
                    {unread > 9 ? "9+" : unread}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Ligne 2 : Avatar + identité */}
          <View style={s.heroIdRow}>
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={s.avatarImg}
              />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInit}>{initial}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={s.heroGreeting}>{greeting},</Text>
              <Text style={s.heroName} numberOfLines={1}>
                {fullName}
              </Text>
              {category ? (
                <View style={s.metierRow}>
                  <View style={s.metierIcon}>
                    <Ionicons name={category.icon} size={11} color="#FFFFFF" />
                  </View>
                  <Text style={s.metierTxt}>{category.name}</Text>
                  {stats.rating > 0 && (
                    <>
                      <View style={s.dotSep} />
                      <Ionicons name="star" size={11} color="#FBBF24" />
                      <Text style={s.metierTxt}>
                        {stats.rating.toFixed(1)}
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <Text style={s.heroSub} numberOfLines={1}>
                  Complétez votre profil pour être visible
                </Text>
              )}
            </View>
          </View>

          {/* Ligne 3 : Stats */}
          <Animated.View
            entering={FadeIn.delay(150).duration(450)}
            style={s.statsRow}
          >
            <StatCard
              icon="hourglass-outline"
              value={stats.pendingCount}
              label="En attente"
            />
            <StatCard
              icon="checkmark-circle-outline"
              value={stats.confirmedCount}
              label="Confirmées"
            />
            <StatCard
              icon="today-outline"
              value={stats.todayCount}
              label="Aujourd'hui"
            />
          </Animated.View>
        </LinearGradient>

        {/* ============= AUJOURD'HUI ============= */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={s.section}
        >
          <View style={s.sectionHead}>
            <Text style={[s.sectionTitle, { color: t.text }]}>
              Aujourd&apos;hui
            </Text>
            <Text style={[s.sectionDate, { color: t.textSecondary }]}>
              {formatToday()}
            </Text>
          </View>

          {todayBookings.length === 0 ? (
            <View
              style={[
                s.emptyTodayCard,
                { backgroundColor: t.surface, borderColor: t.border },
              ]}
            >
              <View
                style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons
                  name="sunny-outline"
                  size={20}
                  color={t.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.emptyTitle, { color: t.text }]}>
                  Pas d&apos;intervention prévue
                </Text>
                <Text style={[s.emptySub, { color: t.textSecondary }]}>
                  Profitez-en pour mettre à jour votre planning.
                </Text>
              </View>
            </View>
          ) : (
            todayBookings.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push("/(app)/pro/requests")}
                style={({ pressed }) => [
                  s.todayCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && s.pressed,
                ]}
              >
                <View
                  style={[s.todayTime, { backgroundColor: t.primaryMuted }]}
                >
                  <Text style={[s.todayTimeTxt, { color: t.primary }]}>
                    {b.time}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.todaySvc, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {b.service}
                  </Text>
                  <View style={s.confirmedRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#10B981"
                    />
                    <Text style={s.confirmedTxt}>Confirmé</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={t.textTertiary}
                />
              </Pressable>
            ))
          )}
        </Animated.View>

        {/* ============= À TRAITER ============= */}
        {pendingBookings.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(220).duration(400)}
            style={s.section}
          >
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: t.text }]}>
                À traiter
              </Text>
              <Pressable
                onPress={() => router.push("/(app)/pro/requests")}
                hitSlop={6}
              >
                <Text style={[s.sectionLink, { color: t.primary }]}>
                  Voir tout
                </Text>
              </Pressable>
            </View>

            {pendingBookings.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push("/(app)/pro/requests")}
                style={({ pressed }) => [
                  s.pendingCard,
                  { backgroundColor: t.surface, borderColor: "#F59E0B" },
                  pressed && s.pressed,
                ]}
              >
                <View
                  style={[
                    s.pendingDate,
                    { backgroundColor: "rgba(245,158,11,0.12)" },
                  ]}
                >
                  <Text style={s.pendingDay}>
                    {new Date(b.date).getDate()}
                  </Text>
                  <Text style={s.pendingMonth}>
                    {monthAbbr(new Date(b.date).getMonth())}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.pendingSvc, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {b.service}
                  </Text>
                  <Text
                    style={[s.pendingTime, { color: t.textSecondary }]}
                  >
                    {b.time} · Nouveau client
                  </Text>
                </View>
                <View style={s.pendingPill}>
                  <Text style={s.pendingPillTxt}>Répondre</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* ============= REVENUS + NOTE (compact) ============= */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={s.section}
        >
          <View style={s.kpiRow}>
            <View
              style={[
                s.kpiCard,
                { backgroundColor: t.surface, borderColor: t.border },
              ]}
            >
              <View
                style={[s.kpiIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons name="wallet" size={16} color={t.primary} />
              </View>
              <Text style={[s.kpiLabel, { color: t.textSecondary }]}>
                Revenus du mois
              </Text>
              <Text style={[s.kpiValue, { color: t.text }]}>
                {formatEur(stats.earnedThisMonthEur)}
              </Text>
              <Text style={[s.kpiSub, { color: t.textTertiary }]}>
                {stats.completedThisMonth} mission
                {stats.completedThisMonth > 1 ? "s" : ""}
              </Text>
            </View>

            <View
              style={[
                s.kpiCard,
                { backgroundColor: t.surface, borderColor: t.border },
              ]}
            >
              <View
                style={[
                  s.kpiIcon,
                  { backgroundColor: "rgba(251,191,36,0.16)" },
                ]}
              >
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <Text style={[s.kpiLabel, { color: t.textSecondary }]}>
                Note moyenne
              </Text>
              <Text style={[s.kpiValue, { color: t.text }]}>
                {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
              </Text>
              <Text style={[s.kpiSub, { color: t.textTertiary }]}>
                {stats.reviewCount > 0
                  ? `${stats.reviewCount} avis`
                  : "aucun avis"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ============= PROGRESSION PROFIL ============= */}
        {incompleteProfile && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={s.section}
          >
            <Pressable
              onPress={() => router.push("/(app)/pro/profile")}
              style={({ pressed }) => [
                s.completionCard,
                { backgroundColor: t.surface, borderColor: t.primary },
                pressed && s.pressed,
              ]}
            >
              <View style={s.completionTop}>
                <View
                  style={[s.completionIcon, { backgroundColor: t.primary }]}
                >
                  <Ionicons name="rocket" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.completionTitle, { color: t.text }]}>
                    Profil complété à {stats.completionPct}%
                  </Text>
                  <Text
                    style={[s.completionSub, { color: t.textSecondary }]}
                  >
                    Atteignez 100% pour être référencé en priorité.
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={t.textSecondary}
                />
              </View>
              <View
                style={[
                  s.progressTrack,
                  { backgroundColor: t.borderStrong },
                ]}
              >
                <LinearGradient
                  colors={
                    najdaGradient as unknown as [string, string, ...string[]]
                  }
                  start={najdaGradientDirection.start}
                  end={najdaGradientDirection.end}
                  style={[
                    s.progressFill,
                    { width: `${stats.completionPct}%` },
                  ]}
                />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* ============= VUE PUBLIQUE ============= */}
        <Animated.View
          entering={FadeInDown.delay(340).duration(400)}
          style={s.section}
        >
          <Pressable
            onPress={() => router.push("/(app)/pro/profile")}
            style={({ pressed }) => [s.previewCard, pressed && s.pressed]}
          >
            <LinearGradient
              colors={
                najdaGradient as unknown as [string, string, ...string[]]
              }
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.previewInner}
            >
              <View style={s.previewIcon}>
                <Ionicons name="eye-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewTitle}>Voir mon profil public</Text>
                <Text style={s.previewSub}>
                  Comment les clients vous voient sur Najda.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// Sub-components
// =====================================================
function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.85)" />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// =====================================================
// Utils
// =====================================================
function monthAbbr(m: number): string {
  return [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ][m];
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatEur(amount: number): string {
  if (amount === 0) return "0 €";
  if (amount < 1000) return `${Math.round(amount)} €`;
  return `${(amount / 1000).toFixed(1).replace(".", ",")} k€`;
}

function formatToday(): string {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const months = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  const d = new Date();
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // ===== HERO =====
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  modePillTxt: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeTxt: { fontSize: 9, fontWeight: "800", color: "#7C8FFF" },

  // ===== IDENTITÉ =====
  heroIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: space.lg,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInit: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.2,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.82)",
    marginTop: 4,
  },
  metierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  metierIcon: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  metierTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginHorizontal: 3,
  },

  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  // ===== SECTION =====
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  sectionLink: { fontSize: 13, fontWeight: "700" },
  sectionDate: { fontSize: 12, fontWeight: "600" },

  // ===== AUJOURD'HUI =====
  emptyTodayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  emptySub: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  todayTime: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 56,
    alignItems: "center",
  },
  todayTimeTxt: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  todaySvc: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  confirmedTxt: { fontSize: 11, fontWeight: "800", color: "#10B981" },

  // ===== À TRAITER =====
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  pendingDate: {
    width: 48,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDay: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: -0.4,
  },
  pendingMonth: {
    fontSize: 9,
    fontWeight: "700",
    color: "#F59E0B",
    textTransform: "lowercase",
  },
  pendingSvc: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  pendingTime: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  pendingPill: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  pendingPillTxt: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // ===== KPI =====
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 1,
  },
  kpiSub: { fontSize: 11, fontWeight: "500" },

  // ===== PROGRESSION PROFIL =====
  completionCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  completionTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  completionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  completionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  completionSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  // ===== VUE PUBLIQUE =====
  previewCard: { borderRadius: 18, overflow: "hidden", ...shadow.md },
  previewInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  previewSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    lineHeight: 16,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
