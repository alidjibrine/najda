import { useMemo } from "react";
import {
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
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { brand, space, radius, shadow, text as T, comp } from "@/constants/theme";

type Service = {
  id: string;
  name: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  iconColor: string;
  urgent?: boolean;
};

const SERVICES: Service[] = [
  { id: "plomberie", name: "Plomberie", sub: "Fuites · Robinets · Canalisations", icon: "water", colors: ["#3B82F6", "#1D4ED8"], iconColor: "#fff", urgent: true },
  { id: "serrurerie", name: "Serrurerie", sub: "Portes · Serrures · Blindage", icon: "key", colors: ["#EF4444", "#B91C1C"], iconColor: "#fff", urgent: true },
  { id: "electricite", name: "Électricité", sub: "Pannes · Prises · Tableaux", icon: "flash", colors: ["#F59E0B", "#B45309"], iconColor: "#fff", urgent: true },
  { id: "chauffage", name: "Chauffage", sub: "Chaudières · Radiateurs", icon: "flame", colors: ["#F97316", "#C2410C"], iconColor: "#fff", urgent: true },
  { id: "peinture", name: "Peinture", sub: "Intérieur · Extérieur", icon: "color-palette-outline", colors: ["#EDE9FE", "#EDE9FE"], iconColor: "#6D28D9" },
  { id: "menuiserie", name: "Menuiserie", sub: "Portes · Fenêtres", icon: "hammer-outline", colors: ["#FDF9EE", "#FDF9EE"], iconColor: "#A88F3E" },
  { id: "maconnerie", name: "Maçonnerie", sub: "Murs · Terrasses", icon: "cube-outline", colors: ["#F3F4F6", "#F3F4F6"], iconColor: "#374151" },
  { id: "carrelage", name: "Carrelage", sub: "Sols · Murs", icon: "grid-outline", colors: ["#D1FAE5", "#D1FAE5"], iconColor: "#047857" },
  { id: "climatisation", name: "Climatisation", sub: "Installation · Entretien", icon: "snow-outline", colors: ["#E0F2FE", "#E0F2FE"], iconColor: "#0369A1" },
  { id: "jardinage", name: "Jardinage", sub: "Entretien · Élagage", icon: "leaf-outline", colors: ["#DCFCE7", "#DCFCE7"], iconColor: "#15803D" },
];

function deriveInitial(email: string | undefined): string {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const initial = useMemo(() => deriveInitial(user?.email), [user]);

  const urgent = SERVICES.filter((sv) => sv.urgent);
  const other = SERVICES.filter((sv) => !sv.urgent);

  const tap = (svc: Service) =>
    router.push({
      pathname: "/(app)/artisans",
      params: { category: svc.id, categoryName: svc.name },
    });
  const tapSearch = () =>
    Alert.alert("Recherche", "La recherche sera activée prochainement.");
  const tapProfile = () => router.push("/(app)/(tabs)/profile");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.hLogo}>
            <Ionicons name="construct" size={14} color={brand.white} />
          </View>
          <Text style={s.hName}>Najda</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.avatar, pressed && s.op]}
          onPress={tapProfile}
          accessibilityRole="button"
        >
          <Text style={s.avatarTxt}>{initial}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Pressable
            onPress={tapSearch}
            style={({ pressed }) => [s.search, pressed && s.searchP]}
            accessibilityRole="search"
          >
            <View style={s.searchIcon}>
              <Ionicons name="search" size={18} color={brand.primary500} />
            </View>
            <Text style={s.searchTxt}>Quel artisan cherchez-vous ?</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={s.secHead}>
            <View style={s.secHeadL}>
              <View style={s.redDot} />
              <Text style={s.secTitle}>Urgences 24/7</Text>
            </View>
            <Text style={s.secCap}>Intervention rapide</Text>
          </View>

          <View style={s.urgGrid}>
            {urgent.map((svc) => (
              <Pressable
                key={svc.id}
                style={({ pressed }) => [pressed && s.cardP]}
                onPress={() => tap(svc)}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={svc.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.urgCard}
                >
                  <Ionicons name={svc.icon} size={28} color="rgba(255,255,255,0.9)" />
                  <View style={s.urgTxt}>
                    <Text style={s.urgName}>{svc.name}</Text>
                    <Text style={s.urgSub}>{svc.sub}</Text>
                  </View>
                  <View style={s.urgBadge}>
                    <Text style={s.urgBadgeTxt}>24/7</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Tous les services</Text>
          </View>

          <View style={s.grid}>
            {other.map((svc) => (
              <Pressable
                key={svc.id}
                style={({ pressed }) => [s.gCard, pressed && s.cardP]}
                onPress={() => tap(svc)}
                accessibilityRole="button"
              >
                <View style={[s.gIcon, { backgroundColor: svc.colors[0] }]}>
                  <Ionicons name={svc.icon} size={24} color={svc.iconColor} />
                </View>
                <Text style={s.gName}>{svc.name}</Text>
                <Text style={s.gSub}>{svc.sub}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={s.sig}>
          <View style={s.sigL} />
          <Ionicons name="shield-checkmark" size={13} color={brand.gold500} />
          <Text style={s.sigT}>Artisans vérifiés</Text>
          <View style={s.sigL} />
        </View>
      </ScrollView>
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
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  hLogo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  hName: { ...T.xl, fontWeight: "700", color: brand.gray900, letterSpacing: -0.6 },
  avatar: {
    width: comp.avatarSm,
    height: comp.avatarSm,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 15, fontWeight: "700", color: brand.white },
  op: { opacity: 0.7 },

  scroll: { padding: space.lg, paddingTop: space.md },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    backgroundColor: brand.white,
    borderRadius: radius.xl,
    paddingHorizontal: space.md,
    marginBottom: space.xl,
    ...shadow.md,
  },
  searchP: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  searchIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
  },
  searchTxt: { ...T.base, color: brand.gray400, flex: 1 },

  secHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  secHeadL: { flexDirection: "row", alignItems: "center", gap: 8 },
  secTitle: { ...T.lg, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },
  secCap: { ...T.xs, color: brand.gray400, fontWeight: "500" },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.danger500 },

  urgGrid: { gap: 10, marginBottom: space.xl },
  urgCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radius.xl,
    minHeight: 76,
  },
  urgTxt: { flex: 1 },
  urgName: { fontSize: 16, fontWeight: "700", color: brand.white, letterSpacing: -0.3 },
  urgSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  urgBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  urgBadgeTxt: { fontSize: 11, fontWeight: "700", color: brand.white },
  cardP: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: space.xl,
  },
  gCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow.sm,
  },
  gIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
  },
  gName: {
    ...T.base,
    fontWeight: "600",
    color: brand.gray900,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  gSub: { ...T.xs, color: brand.gray500 },

  sig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: space.lg,
  },
  sigL: { flex: 1, height: 1, backgroundColor: brand.gray200 },
  sigT: { ...T.xs, fontWeight: "500", color: brand.gray400 },
});
