import { useState } from "react";
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [loading] = useState(false);

  const handleApple = () =>
    Alert.alert("Bientôt", "La connexion Apple sera disponible prochainement.");
  const handleGoogle = () =>
    Alert.alert("Bientôt", "La connexion Google sera disponible prochainement.");
  const handleEmail = () => router.push("/(auth)/email");
  const handleEmergency = () =>
    Alert.alert("Accès urgence", "Le dépannage sans inscription arrive bientôt.");

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Logo centré */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.logoBlock}>
        <View style={s.logoMark}>
          <Ionicons name="construct" size={28} color={brand.white} />
        </View>
        <Text style={s.logoName}>Najda</Text>
        <Text style={s.logoSlogan}>
          L&apos;artisan qu&apos;il vous faut,{"\n"}quand il vous faut.
        </Text>
      </Animated.View>

      {/* Confiance */}
      <Animated.View entering={FadeInDown.delay(250).duration(400)} style={s.trustRow}>
        <TrustBadge icon="shield-checkmark" label="Vérifiés" color={brand.primary500} />
        <TrustBadge icon="star" label="Notés" color={brand.gold700} />
        <TrustBadge icon="flash" label="Rapides" color={brand.danger500} />
      </Animated.View>

      {/* Boutons */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.btn, s.btnDark, pressed && s.btnP]}
          onPress={handleApple}
          disabled={loading}
          accessibilityRole="button"
        >
          <Ionicons name="logo-apple" size={20} color={brand.white} />
          <Text style={s.btnDarkTxt}>Continuer avec Apple</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.btn, s.btnLight, pressed && s.btnP]}
          onPress={handleGoogle}
          disabled={loading}
          accessibilityRole="button"
        >
          <Ionicons name="logo-google" size={18} color={brand.gray700} />
          <Text style={s.btnLightTxt}>Continuer avec Google</Text>
        </Pressable>

        <View style={s.sep}>
          <View style={s.sepLine} />
          <Text style={s.sepTxt}>ou</Text>
          <View style={s.sepLine} />
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, s.btnBrand, pressed && s.btnP]}
          onPress={handleEmail}
          disabled={loading}
          accessibilityRole="button"
        >
          <Ionicons name="mail-outline" size={18} color={brand.white} />
          <Text style={s.btnBrandTxt}>Continuer avec un email</Text>
        </Pressable>
      </Animated.View>

      {/* Footer */}
      <View style={s.footer}>
        <Pressable onPress={handleEmergency} hitSlop={12}>
          <Text style={s.emergLink}>
            <Ionicons name="flash" size={12} color={brand.danger500} />
            {"  "}Besoin d&apos;un dépannage urgent ?
          </Text>
        </Pressable>
        <Text style={s.legal}>
          En continuant, vous acceptez nos CGU et notre{"\n"}politique de
          confidentialité.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function TrustBadge({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={s.badge}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={s.badgeTxt}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brand.white,
    paddingHorizontal: space.lg,
  },

  logoBlock: {
    alignItems: "center",
    paddingTop: space["3xl"],
    paddingBottom: space.lg,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
    ...shadow.lg,
  },
  logoName: {
    fontSize: 30,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -1,
    marginBottom: 8,
  },
  logoSlogan: {
    ...T.sm,
    color: brand.gray500,
    textAlign: "center",
    lineHeight: 20,
  },

  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingBottom: space.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: brand.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: brand.gray100,
  },
  badgeTxt: {
    ...T.xs,
    fontWeight: "600",
    color: brand.gray700,
  },

  actions: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: comp.buttonHeight,
    borderRadius: radius.md,
  },
  btnP: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  btnDark: { backgroundColor: brand.gray900 },
  btnDarkTxt: { ...T.base, fontWeight: "600", color: brand.white },
  btnLight: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  btnLightTxt: { ...T.base, fontWeight: "600", color: brand.gray800 },
  btnBrand: { backgroundColor: brand.primary500, ...shadow.lg },
  btnBrandTxt: { ...T.base, fontWeight: "600", color: brand.white },

  sep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 2,
  },
  sepLine: { flex: 1, height: 1, backgroundColor: brand.gray200 },
  sepTxt: { ...T.sm, color: brand.gray400 },

  footer: {
    alignItems: "center",
    gap: space.md,
    paddingBottom: space.sm,
    paddingTop: space.md,
  },
  emergLink: { ...T.sm, color: brand.danger600, fontWeight: "600" },
  legal: {
    ...T.xs,
    color: brand.gray400,
    textAlign: "center",
    lineHeight: 16,
  },
});
