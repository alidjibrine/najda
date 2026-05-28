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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import { getMyProfile, type Profile } from "@/lib/api";

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
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
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getMyProfile().then((p) => {
        if (mounted) setProfile(p);
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

  const placeholder = (label: string) => () =>
    Alert.alert(label, "Cette fonctionnalité sera disponible prochainement.");

  const accountItems: MenuItem[] = [
    {
      id: "info",
      label: "Mes informations",
      icon: "person-outline",
      onPress: () => router.push("/(app)/profile-edit"),
    },
    {
      id: "payment",
      label: "Moyens de paiement",
      icon: "card-outline",
      onPress: placeholder("Moyens de paiement"),
    },
  ];

  const preferencesItems: MenuItem[] = [
    { id: "notif", label: "Notifications", icon: "notifications-outline", onPress: placeholder("Notifications") },
    { id: "lang", label: "Langue", icon: "language-outline", onPress: placeholder("Langue") },
    { id: "favs", label: "Mes favoris", icon: "heart-outline", onPress: placeholder("Favoris") },
  ];

  const supportItems: MenuItem[] = [
    { id: "help", label: "Centre d'aide", icon: "help-circle-outline", onPress: placeholder("Centre d'aide") },
    { id: "contact", label: "Nous contacter", icon: "mail-outline", onPress: placeholder("Nous contacter") },
    { id: "about", label: "À propos de Najda", icon: "information-circle-outline", onPress: placeholder("À propos") },
    { id: "legal", label: "Mentions légales", icon: "document-text-outline", onPress: placeholder("Mentions légales") },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[brand.primary500, brand.primary700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
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
            <Pressable
              style={({ pressed }) => [s.editBtn, pressed && s.op]}
              onPress={() => router.push("/(app)/profile-edit")}
            >
              <Ionicons name="create-outline" size={14} color={brand.white} />
              <Text style={s.editBtnTxt}>Modifier mon profil</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={s.sectionTitle}>Compte</Text>
          <View style={s.menuCard}>
            {accountItems.map((item, idx) => (
              <MenuRow
                key={item.id}
                item={item}
                isLast={idx === accountItems.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={s.sectionTitle}>Préférences</Text>
          <View style={s.menuCard}>
            {preferencesItems.map((item, idx) => (
              <MenuRow
                key={item.id}
                item={item}
                isLast={idx === preferencesItems.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={s.sectionTitle}>Aide & informations</Text>
          <View style={s.menuCard}>
            {supportItems.map((item, idx) => (
              <MenuRow
                key={item.id}
                item={item}
                isLast={idx === supportItems.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable
            style={({ pressed }) => [s.logoutBtn, pressed && s.logoutP]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={brand.danger600} />
            <Text style={s.logoutTxt}>Se déconnecter</Text>
          </Pressable>
        </Animated.View>

        <Text style={s.version}>Najda v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, !isLast && s.rowBorder, pressed && s.rowP]}
      onPress={item.onPress}
      accessibilityRole="button"
    >
      <View style={s.rowIcon}>
        <Ionicons name={item.icon} size={20} color={brand.gray700} />
      </View>
      <Text style={s.rowLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={brand.gray300} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },
  scroll: { padding: space.lg, paddingTop: space.md },

  heroCard: {
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: "center",
    marginBottom: space.xl,
    ...shadow.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: space.md,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  avatarTxt: { fontSize: 28, fontWeight: "700", color: brand.white },
  name: {
    ...T.lg,
    fontWeight: "700",
    color: brand.white,
    marginBottom: 2,
    maxWidth: 280,
    textAlign: "center",
  },
  email: {
    ...T.sm,
    color: "rgba(255,255,255,0.7)",
    marginBottom: space.md,
    maxWidth: 280,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  editBtnTxt: {
    ...T.xs,
    fontWeight: "600",
    color: brand.white,
  },
  op: { opacity: 0.7 },

  sectionTitle: {
    ...T.xs,
    fontWeight: "700",
    color: brand.gray500,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: space.sm,
    marginLeft: 4,
  },

  menuCard: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    marginBottom: space.lg,
    ...shadow.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  rowP: { opacity: 0.6, backgroundColor: brand.gray50 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    ...T.base,
    flex: 1,
    color: brand.gray800,
    fontWeight: "500",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: brand.danger50,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: brand.danger100,
  },
  logoutP: { opacity: 0.7 },
  logoutTxt: {
    ...T.base,
    fontWeight: "600",
    color: brand.danger600,
  },

  version: {
    ...T.xs,
    color: brand.gray400,
    textAlign: "center",
    paddingVertical: space.md,
  },
});
