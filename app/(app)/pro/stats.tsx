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
  getProStats,
  getProMonthlyStats,
  getProTopServices,
  type ProStats,
  type MonthlyStat,
  type TopService,
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

export default function ProStatsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<ProStats>(EMPTY_STATS);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, m, top] = await Promise.all([
        getProStats().catch(() => EMPTY_STATS),
        getProMonthlyStats(6).catch(() => [] as MonthlyStat[]),
        getProTopServices().catch(() => [] as TopService[]),
      ]);
      setStats(s ?? EMPTY_STATS);
      setMonthly(Array.isArray(m) ? m : []);
      setTopServices(Array.isArray(top) ? top : []);
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

  // Calculs pour le graphique
  const maxRevenue = Math.max(...monthly.map((m) => m.revenueEur), 1);
  const totalMissions = monthly.reduce((acc, m) => acc + m.missions, 0);
  const totalRevenue = monthly.reduce((acc, m) => acc + m.revenueEur, 0);

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
            <Text style={s.heroLabel}>Statistiques</Text>
            <View style={s.heroIcon}>
              <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={s.heroTitle}>{formatEur(stats.earnedAllTimeEur)}</Text>
          <Text style={s.heroSub}>
            Revenus totaux · {monthly.reduce((a, m) => a + m.missions, 0)} mission
            {monthly.reduce((a, m) => a + m.missions, 0) > 1 ? "s" : ""} sur 6 mois
          </Text>

          <View style={s.heroStatsRow}>
            <HeroStat
              value={`${stats.rating > 0 ? stats.rating.toFixed(1) : "—"}`}
              label="Note moyenne"
              icon="star"
            />
            <View style={s.heroStatSep} />
            <HeroStat
              value={String(stats.reviewCount)}
              label="Avis reçus"
              icon="chatbubbles-outline"
            />
            <View style={s.heroStatSep} />
            <HeroStat
              value={`${stats.completionPct}%`}
              label="Profil"
              icon="ribbon-outline"
            />
          </View>
        </LinearGradient>

        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : (
          <>
            {/* ============= GRAPHIQUE 6 MOIS ============= */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionTitle, { color: t.text }]}>
                Revenus sur 6 mois
              </Text>
              <View
                style={[
                  s.chartCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.chartRow}>
                  {monthly.map((m, idx) => {
                    const heightPct =
                      maxRevenue > 0 ? (m.revenueEur / maxRevenue) * 100 : 0;
                    const isCurrent = idx === monthly.length - 1;
                    return (
                      <View key={m.month} style={s.barWrap}>
                        <View style={s.barContainer}>
                          {m.revenueEur > 0 ? (
                            <View
                              style={[
                                s.barFillBg,
                                { height: `${Math.max(heightPct, 5)}%` },
                              ]}
                            >
                              <LinearGradient
                                colors={
                                  najdaGradient as unknown as [
                                    string,
                                    string,
                                    ...string[],
                                  ]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={s.barFill}
                              />
                            </View>
                          ) : (
                            <View
                              style={[
                                s.barEmpty,
                                { backgroundColor: t.surfaceMuted },
                              ]}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            s.barAmount,
                            { color: isCurrent ? t.primary : t.text },
                          ]}
                        >
                          {m.revenueEur > 0
                            ? formatEurShort(m.revenueEur)
                            : "—"}
                        </Text>
                        <Text
                          style={[
                            s.barLabel,
                            {
                              color: isCurrent ? t.primary : t.textTertiary,
                              fontWeight: isCurrent ? "800" : "600",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {m.monthLabel.split(" ")[0]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={[s.chartFooter, { borderTopColor: t.border }]}>
                  <View style={s.footerItem}>
                    <Text
                      style={[s.footerLabel, { color: t.textSecondary }]}
                    >
                      Total 6 mois
                    </Text>
                    <Text style={[s.footerValue, { color: t.text }]}>
                      {formatEur(totalRevenue)}
                    </Text>
                  </View>
                  <View
                    style={[s.footerSep, { backgroundColor: t.border }]}
                  />
                  <View style={s.footerItem}>
                    <Text
                      style={[s.footerLabel, { color: t.textSecondary }]}
                    >
                      Missions
                    </Text>
                    <Text style={[s.footerValue, { color: t.text }]}>
                      {totalMissions}
                    </Text>
                  </View>
                  <View
                    style={[s.footerSep, { backgroundColor: t.border }]}
                  />
                  <View style={s.footerItem}>
                    <Text
                      style={[s.footerLabel, { color: t.textSecondary }]}
                    >
                      Panier moyen
                    </Text>
                    <Text style={[s.footerValue, { color: t.text }]}>
                      {totalMissions > 0
                        ? formatEur(totalRevenue / totalMissions)
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ============= TOP SERVICES ============= */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionTitle, { color: t.text }]}>
                Top services
              </Text>
              {topServices.length === 0 ? (
                <View
                  style={[
                    s.emptyCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  <View
                    style={[s.emptyIcon, { backgroundColor: t.primaryMuted }]}
                  >
                    <Ionicons name="trophy-outline" size={20} color={t.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.emptyTitle, { color: t.text }]}>
                      Pas encore de mission accomplie
                    </Text>
                    <Text style={[s.emptySub, { color: t.textSecondary }]}>
                      Les services les plus demandés s&apos;afficheront ici.
                    </Text>
                  </View>
                </View>
              ) : (
                topServices.map((svc, idx) => (
                  <View
                    key={svc.service}
                    style={[
                      s.serviceCard,
                      { backgroundColor: t.surface, borderColor: t.border },
                    ]}
                  >
                    <View
                      style={[
                        s.rankBadge,
                        { backgroundColor: rankColor(idx) },
                      ]}
                    >
                      <Text style={s.rankTxt}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[s.serviceName, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {svc.service}
                      </Text>
                      <Text
                        style={[s.serviceCount, { color: t.textSecondary }]}
                      >
                        {svc.count} mission{svc.count > 1 ? "s" : ""} ·{" "}
                        {formatEur(svc.revenueEur)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Animated.View>

            {/* ============= MOIS DÉTAILLÉS ============= */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionTitle, { color: t.text }]}>
                Détail mensuel
              </Text>
              {monthly
                .slice()
                .reverse()
                .map((m) => (
                  <View
                    key={m.month}
                    style={[
                      s.monthRow,
                      { backgroundColor: t.surface, borderColor: t.border },
                    ]}
                  >
                    <View style={s.monthLeft}>
                      <Text style={[s.monthName, { color: t.text }]}>
                        {m.monthLabel}
                      </Text>
                      <Text
                        style={[s.monthMissions, { color: t.textSecondary }]}
                      >
                        {m.missions} mission{m.missions > 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Text style={[s.monthRevenue, { color: t.text }]}>
                      {m.revenueEur > 0 ? formatEur(m.revenueEur) : "—"}
                    </Text>
                  </View>
                ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function HeroStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.heroStat}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.85)" />
      <Text style={s.heroStatValue}>{value}</Text>
      <Text style={s.heroStatLabel}>{label}</Text>
    </View>
  );
}

function formatEur(amount: number): string {
  if (amount === 0) return "0 €";
  if (amount < 1000) return `${Math.round(amount)} €`;
  return `${(amount / 1000).toFixed(1).replace(".", ",")} k€`;
}

function formatEurShort(amount: number): string {
  if (amount < 1000) return `${Math.round(amount)}€`;
  return `${(amount / 1000).toFixed(1).replace(".", ",")}k`;
}

function rankColor(idx: number): string {
  switch (idx) {
    case 0:
      return "#FBBF24"; // or
    case 1:
      return "#94A3B8"; // argent
    case 2:
      return "#D97706"; // bronze
    default:
      return "#7C8FFF";
  }
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loaderWrap: { paddingVertical: 60, alignItems: "center" },

  // HERO
  hero: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    marginBottom: space.lg,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  heroStat: { flex: 1, alignItems: "center", gap: 3 },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  heroStatSep: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  // SECTION
  section: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },

  // CHART
  chartCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 140,
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    height: "100%",
  },
  barContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barFillBg: {
    width: "75%",
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: {
    flex: 1,
    width: "100%",
    minHeight: 4,
  },
  barEmpty: {
    width: "75%",
    height: 4,
    borderRadius: 2,
  },
  barAmount: { fontSize: 10, fontWeight: "800" },
  barLabel: { fontSize: 10, letterSpacing: 0.2 },

  chartFooter: {
    flexDirection: "row",
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  footerItem: { flex: 1, alignItems: "center", gap: 3 },
  footerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  footerValue: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  footerSep: { width: 0.5, height: 30 },

  // TOP SERVICES
  emptyCard: {
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

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  rankTxt: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  serviceName: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  serviceCount: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  // MONTH ROWS
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  monthLeft: { flex: 1 },
  monthName: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  monthMissions: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  monthRevenue: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
});
