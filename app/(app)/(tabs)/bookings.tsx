import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  space,
  radius,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getMyBookings,
  cancelBooking,
  bookingStatusLabel,
  bookingStatusColor,
  type Booking,
} from "@/lib/api";
import { Avatar } from "@/components/Avatar";

type Tab = "upcoming" | "past";

const MONTH_NAMES = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const DAY_NAMES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export default function BookingsScreen() {
  const router = useRouter();
  const t = useTheme();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Tab slider animation =====
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabX = useSharedValue(0);

  useEffect(() => {
    tabX.value = withSpring(tab === "past" ? 1 : 0, {
      damping: 18,
      stiffness: 200,
    });
  }, [tab, tabX]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const halfWidth = (tabsWidth - 8) / 2;
    return {
      transform: [{ translateX: tabX.value * halfWidth }],
      width: halfWidth,
    };
  });

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const list = await getMyBookings(tab);
      setBookings(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      fetchBookings().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }, [fetchBookings]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      "Annuler ce rendez-vous ?",
      "L'acompte vous sera remboursé si l'annulation a lieu au moins 24h avant.",
      [
        { text: "Non, garder", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              await fetchBookings();
            } catch (err: unknown) {
              Alert.alert(
                "Erreur",
                err instanceof Error ? err.message : "Erreur inconnue",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[s.safe, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* ===== HEADER ===== */}
      <View style={s.header}>
        <Text style={[s.title, { color: t.text }]}>Rendez-vous</Text>
        <Text style={[s.subtitle, { color: t.textSecondary }]}>
          Vos prestations en un coup d&apos;œil
        </Text>
      </View>

      {/* ===== TABS dégradé ===== */}
      <View style={s.tabsWrap}>
        <View
          onLayout={(e: LayoutChangeEvent) =>
            setTabsWidth(e.nativeEvent.layout.width)
          }
          style={[
            s.tabs,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
          ]}
        >
          {tabsWidth > 0 && (
            <Animated.View style={[s.tabIndicator, tabIndicatorStyle]}>
              <LinearGradient
                colors={najdaGradient as unknown as [string, string, ...string[]]}
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.tabIndicatorFill}
              />
            </Animated.View>
          )}

          <Pressable style={s.tab} onPress={() => setTab("upcoming")}>
            <Text
              style={[
                s.tabTxt,
                { color: tab === "upcoming" ? "#FFFFFF" : t.textSecondary },
              ]}
            >
              À venir
            </Text>
          </Pressable>
          <Pressable style={s.tab} onPress={() => setTab("past")}>
            <Text
              style={[
                s.tabTxt,
                { color: tab === "past" ? "#FFFFFF" : t.textSecondary },
              ]}
            >
              Passés
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.primary}
          />
        }
      >
        {loading ? (
          <LoadingBlock t={t} />
        ) : error ? (
          <EmptyBlock
            t={t}
            title="Une erreur est survenue"
            subtitle={error}
            actionLabel="Réessayer"
            onAction={fetchBookings}
          />
        ) : bookings.length === 0 ? (
          <EmptyBlock
            t={t}
            title={
              tab === "upcoming"
                ? "Aucun rendez-vous à venir"
                : "Aucun rendez-vous passé"
            }
            subtitle={
              tab === "upcoming"
                ? "Réservez un artisan et votre prochain rendez-vous apparaîtra ici."
                : "L'historique de vos prestations s'affichera ici."
            }
            actionLabel={tab === "upcoming" ? "Trouver un artisan" : undefined}
            onAction={
              tab === "upcoming" ? () => router.push("/(app)/(tabs)") : undefined
            }
          />
        ) : (
          bookings.map((booking, idx) => (
            <Animated.View
              key={booking.id}
              entering={FadeInDown.delay(idx * 50).duration(300)}
            >
              <Pressable
                onPress={() => {
                  if (booking.artisan) {
                    router.push({
                      pathname: "/(app)/artisan/[id]",
                      params: { id: booking.artisan.id },
                    });
                  }
                }}
                style={({ pressed }) => [
                  s.bookingCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && s.pressed,
                ]}
              >
                <View style={s.cardTop}>
                  {/* Date box */}
                  <View
                    style={[
                      s.dateBox,
                      { backgroundColor: t.primaryMuted },
                    ]}
                  >
                    <Text style={[s.dateDay, { color: t.primary }]}>
                      {new Date(booking.bookingDate).getDate()}
                    </Text>
                    <Text style={[s.dateMonth, { color: t.primary }]}>
                      {MONTH_NAMES[new Date(booking.bookingDate).getMonth()]}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={s.cardInfo}>
                    <Text
                      style={[s.svcName, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {booking.service}
                    </Text>
                    {booking.artisan && (
                      <View style={s.artRow}>
                        <Avatar
                          uri={booking.artisan.avatarUrl}
                          initials={booking.artisan.initials}
                          size={20}
                        />
                        <Text
                          style={[s.artName, { color: t.textSecondary }]}
                          numberOfLines={1}
                        >
                          {booking.artisan.firstName} {booking.artisan.lastName}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[s.timeTxt, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {formatDate(booking.bookingDate)} · {booking.bookingTime}
                    </Text>
                  </View>

                  {/* Status */}
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: bookingStatusColor[booking.status] + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        s.statusTxt,
                        { color: bookingStatusColor[booking.status] },
                      ]}
                    >
                      {bookingStatusLabel[booking.status]}
                    </Text>
                  </View>
                </View>

                {booking.description ? (
                  <Text
                    style={[s.desc, { color: t.textSecondary }]}
                    numberOfLines={2}
                  >
                    « {booking.description} »
                  </Text>
                ) : null}

                <View style={[s.cardFooter, { borderTopColor: t.border }]}>
                  <Text style={[s.priceTxt, { color: t.text }]}>
                    {booking.priceEstimate}
                  </Text>
                  {tab === "upcoming" && booking.status !== "cancelled" && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancel(booking);
                      }}
                      hitSlop={8}
                    >
                      <Text style={[s.cancelLink, { color: t.danger }]}>
                        Annuler
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// Loading
// =====================================================
function LoadingBlock({ t }: { t: ReturnType<typeof useTheme> }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.loadingBlock}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            s.skeleton,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
          ]}
        />
      ))}
    </Animated.View>
  );
}

// =====================================================
// Empty state
// =====================================================
function EmptyBlock({
  t,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  t: ReturnType<typeof useTheme>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={s.emptyBlock}
    >
      <View
        style={[
          s.emptyIcon,
          { backgroundColor: t.primaryMuted },
        ]}
      >
        <Ionicons name="calendar-outline" size={26} color={t.primary} />
      </View>
      <Text style={[s.emptyTitle, { color: t.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[s.emptySub, { color: t.textSecondary }]}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [s.emptyBtn, pressed && s.pressed]}
        >
          <LinearGradient
            colors={najdaGradient as unknown as [string, string, ...string[]]}
            start={najdaGradientDirection.start}
            end={najdaGradientDirection.end}
            style={s.emptyBtnInner}
          >
            <Text style={s.emptyBtnTxt}>{actionLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  // ===== HEADER =====
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8, marginBottom: 4 },
  subtitle: { ...T.sm, fontWeight: "500" },

  // ===== TABS =====
  tabsWrap: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  tabIndicatorFill: { flex: 1 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabTxt: { ...T.sm, fontWeight: "600" },

  // ===== SCROLL =====
  scroll: {
    padding: space.lg,
    gap: 10,
    minHeight: 400,
  },

  // ===== BOOKING CARD =====
  bookingCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBox: {
    width: 56,
    height: 60,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dateDay: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  dateMonth: { fontSize: 10, fontWeight: "700", textTransform: "lowercase" },
  cardInfo: { flex: 1, gap: 4 },
  svcName: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  artRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  artName: { ...T.sm, fontWeight: "500", flex: 1 },
  timeTxt: { fontSize: 12, fontWeight: "500" },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusTxt: { fontSize: 11, fontWeight: "700" },

  desc: {
    ...T.sm,
    fontStyle: "italic",
    paddingHorizontal: 4,
    marginTop: 10,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
  },
  priceTxt: { ...T.sm, fontWeight: "700" },
  cancelLink: { ...T.sm, fontWeight: "600" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  // ===== LOADING =====
  loadingBlock: { gap: 10 },
  skeleton: {
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
  },

  // ===== EMPTY =====
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: space.lg,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptySub: {
    ...T.sm,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 12,
    borderRadius: radius.full,
  },
  emptyBtnInner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyBtnTxt: { ...T.sm, fontWeight: "700", color: "#FFFFFF" },
});
