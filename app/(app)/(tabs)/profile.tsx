import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  space,
  radius,
  shadow,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getMyBookings, getMyProfile, type Profile } from "@/lib/api";
import { getMyFavorites, setMyRole } from "@/lib/api-extras";

type MenuItem = {
  id: string;
  label: string;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  onPress?: () => void;
};

function deriveInitial(profile: Profile | null, email: string | undefined): string {
  if (profile?.firstName) return profile.firstName.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    upcoming: 0,
    past: 0,
    favorites: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([
        getMyProfile(),
        getMyBookings("upcoming"),
        getMyBookings("past"),
        getMyFavorites(),
      ]).then(([p, upc, past, favs]) => {
        if (!mounted) return;
        setProfile(p);
        setStats({
          upcoming: upc.length,
          past: past.length,
          favorites: favs.length,
        });
      });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const initial = useMemo(
    () => deriveInitial(profile, user?.email),
    [profile, user],
  );

  const displayName = useMemo(() => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return user?.email ?? "Membre Najda";
  }, [profile, user]);

  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = () => {
    if (!profile || switching) return;
    const targetRole = profile.role === "pro" ? "client" : "pro";
    const label =
      targetRole === "pro"
        ? "Passer en mode Artisan ?"
        : "Passer en mode Particulier ?";
    const message =
      targetRole === "pro"
        ? "Vous aurez accès au tableau de bord pro, à la gestion des demandes et au planning. Vous pourrez aussi compléter votre fiche artisan publique."
        : "Vous reviendrez à la recherche d'artisans, vos réservations et favoris.";
    Alert.alert(label, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        style: "default",
        onPress: async () => {
          setSwitching(true);
          try {
            await setMyRole(targetRole);
            // Force le re-routing au prochain rendu de _layout
            if (targetRole === "pro") {
              router.replace("/(app)/pro/dashboard");
            } else {
              router.replace("/(app)/(tabs)");
            }
          } catch (e: unknown) {
            Alert.alert(
              "Erreur",
              e instanceof Error ? e.message : "Impossible de changer de mode.",
            );
          } finally {
            setSwitching(false);
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Se déconnecter ?",
      "Vous devrez vous reconnecter pour retrouver votre compte.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: () => signOut(),
        },
      ],
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: "info",
      label: "Mes informations",
      sub: "Coordonnées, photo de profil",
      icon: "person-outline",
      onPress: () => router.push("/(app)/profile-edit"),
    },
    {
      id: "bookings",
      label: "Mes rendez-vous",
      sub: `${stats.upcoming} à venir · ${stats.past} passés`,
      icon: "calendar-outline",
      badge: stats.upcoming,
      onPress: () => router.push("/(app)/(tabs)/bookings"),
    },
    {
      id: "favs",
      label: "Mes favoris",
      sub: `${stats.favorites} artisan${stats.favorites > 1 ? "s" : ""} sauvegardé${stats.favorites > 1 ? "s" : ""}`,
      icon: "heart-outline",
      onPress: () => router.push("/(app)/favorites"),
    },
    {
      id: "notif",
      label: "Notifications",
      sub: "Historique de vos alertes",
      icon: "notifications-outline",
      onPress: () => router.push("/(app)/notifications"),
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 110 },
        ]}
      >
        {/* ============= HERO CARD ============= */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={najdaGradient as unknown as [string, string, ...string[]]}
            start={najdaGradientDirection.start}
            end={najdaGradientDirection.end}
            style={[s.heroCard, { paddingTop: insets.top + 14 }]}
          >
            <View style={s.heroTopBar}>
              <Text style={s.heroLabel}>Mon profil</Text>
              <Pressable
                onPress={() => router.push("/(app)/profile-edit")}
                hitSlop={10}
                style={s.editIcon}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={s.heroBody}>
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={s.avatarImg}
                />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{initial}</Text>
                </View>
              )}
              <Text style={s.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={s.email} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>

            {/* ===== STATS ===== */}
            <View style={s.statsRow}>
              <StatChip
                value={stats.upcoming}
                label="À venir"
                icon="time-outline"
              />
              <View style={s.statSep} />
              <StatChip
                value={stats.past}
                label="Passés"
                icon="checkmark-done-outline"
              />
              <View style={s.statSep} />
              <StatChip
                value={stats.favorites}
                label="Favoris"
                icon="heart-outline"
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ============= MODE CARD (client / pro) ============= */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={s.modeWrap}
        >
          <View
            style={[
              s.modeCard,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
              },
            ]}
          >
            <View
              style={[
                s.modeIcon,
                { backgroundColor: t.primaryMuted },
              ]}
            >
              <Ionicons
                name={profile?.role === "pro" ? "construct" : "person"}
                size={20}
                color={t.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.modeLabel, { color: t.textSecondary }]}>
                Mode actuel
              </Text>
              <Text style={[s.modeValue, { color: t.text }]}>
                {profile?.role === "pro" ? "Artisan" : "Particulier"}
              </Text>
            </View>
            <Pressable
              onPress={handleSwitchRole}
              disabled={switching || !profile}
              style={({ pressed }) => [
                s.modeBtn,
                { borderColor: t.primary },
                (pressed || switching) && { opacity: 0.7 },
              ]}
            >
              <Text style={[s.modeBtnTxt, { color: t.primary }]}>
                {switching
                  ? "…"
                  : profile?.role === "pro"
                    ? "Mode Particulier"
                    : "Mode Artisan"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ============= MENU ============= */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={s.menuWrap}
        >
          {menuItems.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                s.row,
                {
                  backgroundColor: t.surface,
                  borderColor: t.border,
                },
                idx > 0 && { marginTop: 8 },
                pressed && s.rowP,
              ]}
            >
              <View
                style={[s.rowIcon, { backgroundColor: t.primaryMuted }]}
              >
                <Ionicons name={item.icon} size={20} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowLabel, { color: t.text }]}>
                  {item.label}
                </Text>
                {item.sub && (
                  <Text
                    style={[s.rowSub, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.sub}
                  </Text>
                )}
              </View>
              {item.badge !== undefined && item.badge > 0 ? (
                <View style={[s.badge, { backgroundColor: t.primary }]}>
                  <Text style={s.badgeTxt}>{item.badge}</Text>
                </View>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={t.textTertiary}
              />
            </Pressable>
          ))}
        </Animated.View>

        {/* ============= LOGOUT — Toujours visible avec icône ============= */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable
            style={({ pressed }) => [
              s.logoutBtn,
              {
                backgroundColor: t.surface,
                borderColor: t.danger,
              },
              pressed && s.logoutP,
            ]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={t.danger} />
            <Text style={[s.logoutTxt, { color: t.danger }]}>
              Se déconnecter
            </Text>
          </Pressable>
        </Animated.View>

        <Text style={[s.version, { color: t.textTertiary }]}>
          Najda · v1.0
        </Text>
      </ScrollView>
    </View>
  );
}

// =====================================================
// Stat chip dans le hero
// =====================================================
function StatChip({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.statChip}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: space.lg },

  // ===== HERO =====
  heroCard: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    alignItems: "center",
    ...shadow.lg,
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: space.lg,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  heroBody: { alignItems: "center", marginBottom: space.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  avatarTxt: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    maxWidth: 280,
    textAlign: "center",
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    maxWidth: 280,
  },

  // ===== STATS =====
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    width: "100%",
  },
  statChip: { flex: 1, alignItems: "center", gap: 2 },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  // ===== MODE CARD =====
  modeWrap: { paddingHorizontal: space.lg },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  modeValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2, marginTop: 2 },
  modeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  modeBtnTxt: { fontSize: 12, fontWeight: "800", letterSpacing: -0.2 },

  // ===== MENU =====
  menuWrap: { paddingHorizontal: space.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  rowP: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  rowLabel: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  rowSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // ===== LOGOUT (toujours visible) =====
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: space.lg,
  },
  logoutP: { opacity: 0.7 },
  logoutTxt: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  version: {
    fontSize: 11,
    textAlign: "center",
  },
});
