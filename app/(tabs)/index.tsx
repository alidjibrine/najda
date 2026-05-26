import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const [loading] = useState(false);

  const handleGoogleLogin = () => {
    Alert.alert("Bientôt disponible", "La connexion Google arrive bientôt.");
  };

  const handleAppleLogin = () => {
    Alert.alert("Bientôt disponible", "La connexion Apple arrive bientôt.");
  };

  const handleEmailLogin = () => {
    Alert.alert("Bientôt disponible", "La connexion par email arrive bientôt.");
  };

  const handleEmergency = () => {
    Alert.alert(
      "Mode urgence",
      "Le mode dépannage 24/7 sera bientôt disponible.",
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header avec logo et slogan */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="construct" size={32} color={Colors.brand.white} />
          </View>
          <Text style={styles.logoText}>Najda</Text>
        </View>
        <Text style={styles.tagline}>
          L&apos;artisan qu&apos;il vous faut, quand il vous faut
        </Text>
      </View>

      {/* Boutons de connexion */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonGoogle,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={20} color={Colors.brand.gray900} />
          <Text style={styles.buttonTextDark}>Continuer avec Google</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonApple,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAppleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={22} color={Colors.brand.white} />
          <Text style={styles.buttonTextLight}>Continuer avec Apple</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonEmail,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEmailLogin}
          disabled={loading}
        >
          <Ionicons name="mail" size={20} color={Colors.brand.gray900} />
          <Text style={styles.buttonTextDark}>Continuer par email</Text>
        </Pressable>

        {/* Séparateur OU */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OU</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Bouton urgence */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.buttonEmergency,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEmergency}
        >
          <Ionicons name="warning" size={20} color={Colors.brand.danger700} />
          <Text style={styles.buttonTextEmergency}>
            Urgence — accès rapide
          </Text>
        </Pressable>
      </View>

      {/* Mentions légales en bas */}
      <Text style={styles.legal}>
        En continuant, vous acceptez nos{"\n"}
        CGU et notre politique de confidentialité.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  logoIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.brand.primary500,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: FontSize.xxxl,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.brand.gray600,
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  buttonsContainer: {
    gap: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonGoogle: {
    backgroundColor: Colors.brand.white,
    borderColor: Colors.brand.gray200,
  },
  buttonApple: {
    backgroundColor: Colors.brand.gray900,
    borderColor: Colors.brand.gray900,
  },
  buttonEmail: {
    backgroundColor: Colors.brand.white,
    borderColor: Colors.brand.gray200,
  },
  buttonEmergency: {
    backgroundColor: Colors.brand.danger50,
    borderColor: Colors.brand.danger50,
  },
  buttonTextDark: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.brand.gray900,
  },
  buttonTextLight: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.brand.white,
  },
  buttonTextEmergency: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.brand.danger700,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.brand.gray200,
  },
  separatorText: {
    fontSize: FontSize.xs,
    color: Colors.brand.gray400,
    fontWeight: "500",
  },
  legal: {
    fontSize: FontSize.xs,
    color: Colors.brand.gray400,
    textAlign: "center",
    lineHeight: 16,
  },
});
