import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

/**
 * Écran d'authentification par email.
 *
 * Permet à la fois la connexion (signin) et l'inscription (signup) selon
 * le mode actif. Sur inscription, Supabase envoie un email de confirmation
 * que l'utilisateur doit valider avant de pouvoir se connecter.
 */
export default function EmailAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === "signup";

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === "signup" ? "signin" : "signup"));
  };

  const validate = (): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Saisis ton adresse email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Cette adresse email ne semble pas valide.";
    if (!password) return "Saisis un mot de passe.";
    if (isSignUp && password.length < 8)
      return "Le mot de passe doit contenir au moins 8 caractères.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
        Alert.alert(
          "Vérifie ta boîte mail",
          `Un email de confirmation a été envoyé à ${email.trim()}. Clique sur le lien pour activer ton compte, puis reviens te connecter.`,
          [{ text: "OK", onPress: () => setMode("signin") }],
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw signInError;
        }
        // La redirection se fera automatiquement via le layout (auth)
        // dès que la session sera détectée.
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? translateError(err.message)
          : "Une erreur inattendue est survenue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bouton retour */}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedSubtle,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={Colors.brand.gray900}
              />
            </Pressable>
          </View>

          {/* Titre */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>
              {isSignUp ? "Créer un compte" : "Bon retour"}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? "Quelques secondes suffisent pour rejoindre Najda."
                : "Connecte-toi pour retrouver tes artisans et tes RDV."}
            </Text>
          </View>

          {/* Champs */}
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.brand.gray400}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="prenom@email.com"
                  placeholderTextColor={Colors.brand.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.brand.gray400}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isSignUp ? "8 caractères minimum" : "Ton mot de passe"}
                  placeholderTextColor={Colors.brand.gray400}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  textContentType={isSignUp ? "newPassword" : "password"}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={Colors.brand.danger500}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Bouton principal */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? "Créer mon compte" : "Se connecter"}
            style={({ pressed }) => [
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.brand.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? "Créer mon compte" : "Se connecter"}
              </Text>
            )}
          </Pressable>

          {/* Toggle mode */}
          <Pressable
            onPress={toggleMode}
            disabled={loading}
            style={({ pressed }) => [
              styles.toggleRow,
              pressed && styles.pressedSubtle,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Tu as déjà un compte ?  "
                : "Pas encore de compte ?  "}
              <Text style={styles.toggleLink}>
                {isSignUp ? "Se connecter" : "S'inscrire"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Traduit les messages d'erreur Supabase en français lisible.
 */
function translateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (lower.includes("user already registered"))
    return "Un compte existe déjà avec cet email. Essaie de te connecter.";
  if (lower.includes("email not confirmed"))
    return "Tu dois d'abord confirmer ton email. Vérifie ta boîte mail.";
  if (lower.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (lower.includes("rate limit"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (lower.includes("network"))
    return "Connexion internet instable. Vérifie ton réseau.";
  return message;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  pressedSubtle: {
    opacity: 0.6,
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.brand.gray600,
    fontWeight: "400",
  },
  fields: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.brand.gray800,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand.gray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.brand.gray900,
    paddingVertical: 0,
    fontWeight: "400",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand.danger50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.brand.danger100,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.brand.danger700,
    fontWeight: "500",
    lineHeight: 18,
  },
  submitButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.primary700,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.brand.white,
    letterSpacing: -0.2,
  },
  toggleRow: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.brand.gray600,
    fontWeight: "400",
  },
  toggleLink: {
    color: Colors.brand.primary500,
    fontWeight: "600",
  },
});
