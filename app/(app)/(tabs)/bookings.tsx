import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import {
  getMyBookings,
  cancelBooking,
  bookingStatusLabel,
  bookingStatusColor,
  type Booking,
} from "@/lib/api";

type Tab = "upcoming" | "past";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_NAMES = [
  "janv.", "févr.", "mars", "avril", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.title}>Mes rendez-vous</Text>
        <Text style={s.subtitle}>Gérez vos prestations en un coup d&apos;œil</Text>
      </View>

      <View style={s.tabs}>
        <Pressable style={s.tab} onPress={() => setTab("upcoming")}>
          <Text style={[s.tabTxt, tab === "upcoming" && s.tabTxtActive]}>
            À venir
          </Text>
          {tab === "upcoming" && <View style={s.tabBar} />}
        </Pressable>
        <Pressable style={s.tab} onPress={() => setTab("past")}>
          <Text style={[s.tabTxt, tab === "past" && s.tabTxtActive]}>
            Passés
          </Text>
          {tab === "past" && <View style={s.tabBar} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.primary500}
          />
        }
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={brand.primary500} />
          </View>
        ) : error ? (
          <View style={s.empty}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={brand.danger500}
            />
            <Text style={s.emptyTitle}>Une erreur est survenue</Text>
            <Text style={s.emptySub}>{error}</Text>
            <Pressable
              style={({ pressed }) => [s.cta, pressed && s.ctaP]}
              onPress={fetchBookings}
            >
              <Text style={s.ctaTxt}>Réessayer</Text>
            </Pressable>
          </View>
        ) : bookings.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={s.empty}>
            <View style={s.emptyIconCircle}>
              <Ionicons
                name={tab === "upcoming" ? "calendar-outline" : "time-outline"}
                size={32}
                color={brand.primary400}
              />
            </View>
            <Text style={s.emptyTitle}>
              {tab === "upcoming"
                ? "Aucun rendez-vous à venir"
                : "Aucun rendez-vous passé"}
            </Text>
            <Text style={s.emptySub}>
              {tab === "upcoming"
                ? "Réservez un artisan et votre prochain rendez-vous apparaîtra ici."
                : "L'historique de vos prestations s'affichera ici."}
            </Text>
            {tab === "upcoming" && (
              <Pressable
                style={({ pressed }) => [s.cta, pressed && s.ctaP]}
                onPress={() => router.push("/(app)/(tabs)")}
              >
                <Ionicons name="search" size={18} color={brand.white} />
                <Text style={s.ctaTxt}>Trouver un artisan</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          bookings.map((booking, idx) => (
            <Animated.View
              key={booking.id}
              entering={FadeInDown.delay(idx * 60).duration(400)}
            >
              <Pressable
                style={({ pressed }) => [s.card, pressed && s.cardP]}
                onPress={() => {
                  if (booking.artisan) {
                    router.push({
                      pathname: "/(app)/artisan/[id]",
                      params: { id: booking.artisan.id },
                    });
                  }
                }}
              >
                <View style={s.cardTop}>
                  <View style={s.dateBox}>
                    <Text style={s.dateDay}>
                      {new Date(booking.bookingDate).getDate()}
                    </Text>
                    <Text style={s.dateMonth}>
                      {MONTH_NAMES[new Date(booking.bookingDate).getMonth()]}
                    </Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.svcName}>{booking.service}</Text>
                    {booking.artisan && (
                      <Text style={s.artName}>
                        {booking.artisan.firstName} {booking.artisan.lastName}
                      </Text>
                    )}
                    <View style={s.timeRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={brand.gray500}
                      />
                      <Text style={s.timeTxt}>
                        {formatDate(booking.bookingDate)} · {booking.bookingTime}
                      </Text>
                    </View>
                  </View>
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
                  <Text style={s.desc} numberOfLines={2}>
                    « {booking.description} »
                  </Text>
                ) : null}

                <View style={s.cardFooter}>
                  <Text style={s.priceTxt}>{booking.priceEstimate}</Text>
                  {tab === "upcoming" && booking.status !== "cancelled" && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancel(booking);
                      }}
                      hitSlop={8}
                    >
                      <Text style={s.cancelLink}>Annuler</Text>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    backgroundColor: brand.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: { ...T.sm, color: brand.gray500 },

  tabs: {
    flexDirection: "row",
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
    paddingHorizontal: space.lg,
  },
  tab: {
    paddingVertical: space.md,
    marginRight: space.lg,
    alignItems: "center",
  },
  tabTxt: { ...T.base, fontWeight: "600", color: brand.gray500 },
  tabTxtActive: { color: brand.primary500 },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: brand.primary500,
    borderRadius: 1,
  },

  scroll: { padding: space.lg, minHeight: 400 },

  loader: {
    paddingVertical: 80,
    alignItems: "center",
  },

  empty: {
    backgroundColor: brand.white,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.lg,
    ...shadow.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.sm,
  },
  emptyTitle: {
    ...T.lg,
    fontWeight: "700",
    color: brand.gray900,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySub: {
    ...T.sm,
    color: brand.gray500,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: space.md,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: brand.primary500,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: radius.full,
    ...shadow.lg,
  },
  ctaP: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaTxt: { ...T.base, fontWeight: "600", color: brand.white },

  card: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: 10,
    gap: 10,
    ...shadow.sm,
  },
  cardP: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
  },
  dateDay: {
    fontSize: 22,
    fontWeight: "700",
    color: brand.primary700,
    letterSpacing: -0.5,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "600",
    color: brand.primary600,
  },
  cardInfo: { flex: 1, gap: 2 },
  svcName: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.2,
  },
  artName: { ...T.sm, color: brand.gray600, fontWeight: "500" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timeTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusTxt: { ...T.xs, fontWeight: "700" },

  desc: {
    ...T.sm,
    color: brand.gray600,
    fontStyle: "italic",
    paddingHorizontal: 4,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: brand.gray100,
  },
  priceTxt: { ...T.sm, fontWeight: "700", color: brand.primary500 },
  cancelLink: { ...T.sm, color: brand.danger600, fontWeight: "600" },
});
