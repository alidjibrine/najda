import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";

type Tab = "upcoming" | "past";

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.title}>Mes rendez-vous</Text>
        <Text style={s.subtitle}>Gérez vos prestations en un coup d&apos;œil</Text>
      </View>

      <View style={s.tabs}>
        <Pressable
          style={[s.tab, tab === "upcoming" && s.tabActive]}
          onPress={() => setTab("upcoming")}
        >
          <Text style={[s.tabTxt, tab === "upcoming" && s.tabTxtActive]}>
            À venir
          </Text>
          {tab === "upcoming" && <View style={s.tabBar} />}
        </Pressable>
        <Pressable
          style={[s.tab, tab === "past" && s.tabActive]}
          onPress={() => setTab("past")}
        >
          <Text style={[s.tabTxt, tab === "past" && s.tabTxtActive]}>
            Passés
          </Text>
          {tab === "past" && <View style={s.tabBar} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
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
              accessibilityRole="button"
            >
              <Ionicons name="search" size={18} color={brand.white} />
              <Text style={s.ctaTxt}>Trouver un artisan</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Helper info */}
        {tab === "upcoming" && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={s.tipCard}
          >
            <View style={s.tipIcon}>
              <Ionicons name="bulb-outline" size={18} color={brand.gold700} />
            </View>
            <View style={s.tipText}>
              <Text style={s.tipTitle}>Comment réserver ?</Text>
              <Text style={s.tipBody}>
                Choisissez un artisan dans l&apos;accueil, consultez son profil,
                puis cliquez sur Réserver pour fixer un créneau.
              </Text>
            </View>
          </Animated.View>
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
  tabActive: {},
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

  scroll: { padding: space.lg },

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
});
