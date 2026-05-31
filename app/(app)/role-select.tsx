import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
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
import { NajdaLogo } from "@/components/NajdaLogo";
import { setMyRole, type UserRole } from "@/lib/api-extras";

export default function RoleSelectScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (role: UserRole) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelected(role);
  };

  const handleContinue = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await setMyRole(selected);
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // L'onboarding s'occupera de la suite
      router.replace("/(app)/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Halo subtil */}
      <LinearGradient
        colors={[
          "rgba(155,181,255,0.22)",
          "rgba(168,155,255,0.10)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.halo, { height: 300 + insets.top }]}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* HERO */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={s.hero}
        >
          <NajdaLogo size={64} withShadow />
          <Text style={[s.title, { color: t.text }]}>
            Bienvenue sur Najda
          </Text>
          <Text style={[s.sub, { color: t.textSecondary }]}>
            Comment souhaitez-vous utiliser l&apos;application ?
          </Text>
        </Animated.View>

        {/* CHOICES */}
        <View style={s.choices}>
          <Animated.View entering={FadeInDown.delay(150).duration(450)}>
            <RoleCard
              role="client"
              icon="search"
              title="Je cherche un artisan"
              description="Trouvez un pro vérifié pour vos besoins du quotidien."
              perks={[
                "Recherche géolocalisée",
                "Réservation en quelques clics",
                "Messagerie directe avec l'artisan",
              ]}
              active={selected === "client"}
              onPress={() => handleSelect("client")}
              t={t}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(450)}>
            <RoleCard
              role="pro"
              icon="construct"
              title="Je suis un artisan"
              description="Recevez des demandes près de chez vous et gérez votre planning."
              perks={[
                "Profil professionnel mis en avant",
                "Demandes filtrées par zone",
                "Planning et messagerie intégrés",
              ]}
              active={selected === "pro"}
              onPress={() => handleSelect("pro")}
              t={t}
            />
          </Animated.View>
        </View>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(450)}
          style={s.bottom}
        >
          <Pressable
            onPress={handleContinue}
            disabled={!selected || submitting}
            style={({ pressed }) => [
              s.ctaWrap,
              (!selected || submitting) && { opacity: 0.45 },
              pressed && selected && !submitting && s.pressed,
            ]}
          >
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.cta}
            >
              <Text style={s.ctaTxt}>
                {submitting ? "Validation…" : "Continuer"}
              </Text>
              {!submitting && (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Pressable>

          <Text style={[s.note, { color: t.textTertiary }]}>
            Vous pourrez le modifier plus tard depuis votre profil.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// =====================================================
// Carte de choix de rôle
// =====================================================
function RoleCard({
  role,
  icon,
  title,
  description,
  perks,
  active,
  onPress,
  t,
}: {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  perks: string[];
  active: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.roleCard,
        {
          backgroundColor: active ? t.primaryMuted : t.surface,
          borderColor: active ? t.primary : t.border,
          borderWidth: active ? 2 : 1,
        },
        pressed && s.pressed,
      ]}
    >
      <View style={s.roleHead}>
        <View
          style={[
            s.roleIcon,
            { backgroundColor: active ? t.primary : t.primaryMuted },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={active ? "#FFFFFF" : t.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.roleTitle, { color: t.text }]}>{title}</Text>
          <Text style={[s.roleDesc, { color: t.textSecondary }]}>
            {description}
          </Text>
        </View>
        <View
          style={[
            s.radio,
            {
              backgroundColor: active ? t.primary : "transparent",
              borderColor: active ? t.primary : t.borderStrong,
            },
          ]}
        >
          {active && (
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          )}
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: t.border }]} />

      <View style={s.perksWrap}>
        {perks.map((p) => (
          <View key={p} style={s.perkRow}>
            <Ionicons name="checkmark-circle" size={13} color={t.primary} />
            <Text
              style={[s.perkTxt, { color: t.textSecondary }]}
              numberOfLines={1}
            >
              {p}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: space.lg },
  halo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  hero: {
    alignItems: "center",
    paddingTop: space.lg,
    paddingBottom: space.lg,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 6,
  },
  sub: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

  choices: { gap: 12, flex: 1 },

  roleCard: {
    padding: 14,
    borderRadius: 18,
  },
  roleHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  roleDesc: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  divider: { height: 0.5, marginVertical: 12 },

  perksWrap: { gap: 7 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  perkTxt: { fontSize: 12, fontWeight: "500", flex: 1 },

  bottom: { gap: 10, paddingBottom: space.md },
  ctaWrap: { borderRadius: 16, ...shadow.lg },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  ctaTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  note: { fontSize: 11, textAlign: "center" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
