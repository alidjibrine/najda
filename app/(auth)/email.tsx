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
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function EmailAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === "signup";

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === "signup" ? "signin" : "signup"));
  };

  const validate = (): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Veuillez saisir votre adresse email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Cette adresse email ne semble pas valide.";
    if (!password) return "Veuillez saisir un mot de passe.";
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
        const { error: e } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (e) throw e;
        Alert.alert(
          "Vérifiez votre boîte mail",
          `Un email de confirmation a été envoyé à ${email.trim()}. Cliquez sur le lien pour activer votre compte.`,
          [{ text: "Compris", onPress: () => setMode("signin") }],
        );
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (e) throw e;
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

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert(
        "Email requis",
        "Saisissez d'abord votre adresse email dans le champ ci-dessus, puis appuyez à nouveau sur \"Mot de passe oublié\".",
      );
      return;
    }
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (e) throw e;
      Alert.alert(
        "Email envoyé",
        `Si un compte existe pour ${trimmed}, vous recevrez un lien pour réinitialiser votre mot de passe.`,
      );
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer l'email de réinitialisation. Réessayez.",
      );
    }
  };

  const emailBorder =
    focused === "email"
      ? brand.primary400
      : error && !email.trim()
        ? brand.danger500
        : brand.gray200;

  const passwordBorder =
    focused === "password"
      ? brand.primary400
      : error && !password
        ? brand.danger500
        : brand.gray200;

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={16}
              onPress={() => router.back()}
              style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
            >
              <Ionicons name="arrow-back" size={22} color={brand.gray800} />
            </Pressable>
          </View>

          {/* Titre */}
          <Text style={s.title}>
            {isSignUp ? "Créer votre compte" : "Content de vous revoir"}
          </Text>
          <Text style={s.subtitle}>
            {isSignUp
              ? "Rejoignez Najda pour accéder à des artisans vérifiés."
              : "Connectez-vous pour retrouver vos artisans et rendez-vous."}
          </Text>

          {/* Champs */}
          <View style={s.fields}>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Adresse email</Text>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="vous@exemple.com"
                placeholderTextColor={brand.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={[s.input, { borderColor: emailBorder }]}
                editable={!loading}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Mot de passe</Text>
              <View style={[s.inputRow, { borderColor: passwordBorder }]}>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    isSignUp ? "Minimum 8 caractères" : "Votre mot de passe"
                  }
                  placeholderTextColor={brand.gray400}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={
                    isSignUp ? "new-password" : "current-password"
                  }
                  textContentType={isSignUp ? "newPassword" : "password"}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={s.inputInner}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                  style={s.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={brand.gray400}
                  />
                </Pressable>
              </View>
            </View>

            {/* Remember me + Forgot password */}
            <View style={s.optionsRow}>
              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                style={s.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View
                  style={[
                    s.checkbox,
                    rememberMe && s.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color={brand.white} />
                  )}
                </View>
                <Text style={s.checkboxLabel}>Se souvenir de moi</Text>
              </Pressable>

              {!isSignUp && (
                <Pressable
                  onPress={handleForgotPassword}
                  hitSlop={8}
                  style={({ pressed }) => pressed && s.pressed}
                >
                  <Text style={s.forgotLink}>Mot de passe oublié ?</Text>
                </Pressable>
              )}
            </View>

            {/* Erreur */}
            {error && (
              <View style={s.errorBox}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={brand.danger600}
                />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Submit */}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              s.submitBtn,
              loading && s.submitBtnDisabled,
              pressed && !loading && s.btnPressed,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={brand.white} />
            ) : (
              <Text style={s.submitBtnText}>
                {isSignUp ? "Créer mon compte" : "Se connecter"}
              </Text>
            )}
          </Pressable>

          {/* Toggle */}
          <Pressable
            onPress={toggleMode}
            disabled={loading}
            style={({ pressed }) => [s.toggle, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Text style={s.toggleText}>
              {isSignUp
                ? "Vous avez déjà un compte ?  "
                : "Pas encore de compte ?  "}
              <Text style={s.toggleLink}>
                {isSignUp ? "Se connecter" : "S'inscrire"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function translateError(message: string): string {
  const l = message.toLowerCase();
  if (l.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (l.includes("user already registered"))
    return "Un compte existe déjà avec cet email.";
  if (l.includes("email not confirmed"))
    return "Veuillez d'abord confirmer votre email.";
  if (l.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (l.includes("rate limit"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (l.includes("network"))
    return "Connexion instable. Vérifiez votre réseau.";
  return message;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.white },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  header: { paddingTop: space.sm, paddingBottom: space.xl },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -4,
  },
  pressed: { opacity: 0.6 },
  title: {
    ...T["3xl"],
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.8,
    marginBottom: space.sm,
  },
  subtitle: {
    ...T.base,
    color: brand.gray500,
    marginBottom: space.xl,
    maxWidth: 320,
  },
  fields: { gap: space.md, marginBottom: space.xl },
  fieldGroup: { gap: 8 },
  label: { ...T.sm, fontWeight: "600", color: brand.gray700 },
  input: {
    height: comp.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: brand.white,
    paddingHorizontal: 16,
    ...T.base,
    color: brand.gray900,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: comp.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: brand.white,
    paddingHorizontal: 16,
  },
  inputInner: {
    flex: 1,
    ...T.base,
    color: brand.gray900,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: brand.gray300,
    backgroundColor: brand.white,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  checkboxLabel: {
    ...T.sm,
    color: brand.gray700,
    fontWeight: "500",
  },
  forgotLink: {
    ...T.sm,
    color: brand.primary500,
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: brand.danger50,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    ...T.sm,
    color: brand.danger700,
    fontWeight: "500",
  },
  submitBtn: {
    height: comp.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
    ...shadow.lg,
  },
  submitBtnDisabled: { opacity: 0.65 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  submitBtnText: { ...T.base, fontWeight: "600", color: brand.white },
  toggle: { alignItems: "center", paddingVertical: space.sm },
  toggleText: { ...T.sm, color: brand.gray500 },
  toggleLink: { color: brand.primary500, fontWeight: "600" },
});
