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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Radius, Spacing } from "@/constants/theme";

/**
 * Écran d'accueil / connexion de Najda.
 * Propose les méthodes d'auth (Apple, Google, Email) et l'accès rapide
 * au mode dépannage 24/7.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [loading] = useState(false);

  const handleGoogleLogin = () => {
    Alert.alert(
      "Bientôt disponible",
      "La connexion Google arrive dans une prochaine version.",
    );
  };

  const handleAppleLogin = () => {
    Alert.alert(
      "Bientôt disponible",
      "La connexion Apple arrive dans une prochaine version.",
    );
  };

  const handleEmailLogin = () => {
    router.push("/(auth)/email");
  };

  const handleEmergency = () => {
    Alert.alert(
      "Mode urgence",
      "Le mode dépannage 24/7 arrive dans une prochaine version.",
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Hero — logo, nom et slogan */}
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Ionicons name="construct" size={42} color={Colors.brand.gold500} />
          <View style={styles.logoAccent} />
        </View>
        <Text style={styles.brandName}>Najda</Text>
        <Text style={styles.tagline}>
          L&apos;artisan qu&apos;il vous faut,{"\n"}quand il vous faut.
        </Text>
      </View>

      {/* Section actions */}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuer avec Apple"
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAppleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={20} color={Colors.brand.white} />
          <Text style={styles.buttonPrimaryText}>Continuer avec Apple</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuer avec Google"
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={20} color={Colors.brand.gray900} />
          <Text style={styles.buttonSecondaryText}>Continuer avec Google</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuer par email"
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEmailLogin}
          disabled={loading}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={Colors.brand.gray900}
          />
          <Text style={styles.buttonSecondaryText}>Continuer par email</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mode dépannage 24 heures sur 24"
          style={({ pressed }) => [
            styles.emergencyCard,
            pressed && styles.emergencyCardPressed,
          ]}
          onPress={handleEmergency}
        >
          <View style={styles.emergencyIconBox}>
            <Ionicons name="flash" size={22} color={Colors.brand.danger500} />
          </View>
          <View style={styles.emergencyTextBox}>
            <Text style={styles.emergencyTitle}>Dépannage 24/7</Text>
            <Text style={styles.emergencySubtitle}>
              Sans inscription · réponse en 30 min
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.brand.danger500}
          />
        </Pressable>
      </View>

      {/* Footer — mentions légales */}
      <View style={styles.footer}>
        <Text style={styles.legal}>
          En continuant, vous acceptez nos{" "}
          <Text style={styles.legalLink}>CGU</Text>
          {" et notre "}
          <Text style={styles.legalLink}>politique de confidentialité</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  logoMark: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: Colors.brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.primary700,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoAccent: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.brand.gold500,
    opacity: 0.18,
  },
  brandName: {
    fontSize: 44,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -1.4,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.brand.gray600,
    textAlign: "center",
    fontWeight: "400",
    maxWidth: 320,
  },
  actions: {
    gap: 10,
    paddingBottom: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  buttonPrimary: {
    backgroundColor: Colors.brand.gray900,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.brand.white,
    letterSpacing: -0.2,
  },
  buttonSecondary: {
    backgroundColor: Colors.brand.white,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.brand.gray900,
    letterSpacing: -0.2,
  },
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.brand.danger50,
    borderRadius: 14,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brand.danger100,
  },
  emergencyCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  emergencyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand.danger100,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyTextBox: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.brand.danger700,
    letterSpacing: -0.2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: Colors.brand.danger700,
    opacity: 0.75,
    marginTop: 2,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.brand.gray400,
    textAlign: "center",
  },
  legalLink: {
    color: Colors.brand.gray800,
    fontWeight: "500",
  },
});
