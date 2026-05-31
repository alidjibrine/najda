import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme, useIsDark } from "@/hooks/useTheme";
import { NajdaLogo } from "@/components/NajdaLogo";
import { supabase } from "@/lib/supabase";

type Mode = "signup" | "signin";
type Role = "client" | "pro";

export default function LoginScreen() {
  const t = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  // ===== State =====
  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const passwordRef = useRef<TextInput>(null);

  // ===== Breathing logo =====
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breath]);
  const logoBreath = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.03 }],
  }));

  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === "ios") Haptics.impactAsync(style);
  };

  const switchMode = (m: Mode) => {
    haptic();
    setMode(m);
    setError(null);
    setRole(m === "signup" ? null : null);
  };

  const pickRole = (r: Role) => {
    haptic();
    setRole(r);
    setError(null);
  };

  const handleForgot = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(
        "Email requis",
        "Saisissez d'abord votre adresse email puis tapez à nouveau sur \"Mot de passe oublié\".",
      );
      return;
    }
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (e) throw e;
      Alert.alert(
        "Email envoyé",
        `Si un compte existe pour ${email.trim()}, vous recevrez un lien pour réinitialiser votre mot de passe.`,
      );
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer l'email de réinitialisation. Réessayez.",
      );
    }
  };

  // ===== Validate + Submit =====
  const validate = (): string | null => {
    const trimmed = email.trim();
    if (mode === "signup" && !role) return "Choisissez d'abord votre type de compte.";
    if (!trimmed) return "Veuillez saisir votre adresse email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Cette adresse email ne semble pas valide.";
    if (!password) return "Veuillez saisir un mot de passe.";
    if (mode === "signup" && password.length < 8)
      return "Le mot de passe doit contenir au moins 8 caractères.";
    return null;
  };

  const handleSubmit = async () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Le trigger Postgres lira ce rôle pour créer le profile
            data: { role: role ?? "client" },
          },
        });
        if (e) throw e;
        Alert.alert(
          "Vérifiez votre boîte mail",
          `Un email de confirmation a été envoyé à ${email.trim()}. Cliquez sur le lien pour activer votre compte, puis revenez ici pour vous connecter.`,
          [
            {
              text: "Compris",
              onPress: () => {
                setMode("signin");
                setPassword("");
              },
            },
          ],
        );
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (e) throw e;
        // Le routing prendra le relais
      }
    } catch (err: unknown) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const msg =
        err instanceof Error ? translateError(err.message) : "Erreur inattendue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Conditions d'affichage des inputs en mode signup
  const showInputsForSignup = mode === "signup" && role !== null;
  const showInputs = mode === "signin" || showInputsForSignup;

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent />

      {/* Halo subtil */}
      <View style={s.haloWrap} pointerEvents="none">
        <LinearGradient
          colors={[
            "rgba(155,181,255,0.22)",
            "rgba(168,155,255,0.10)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={s.halo}
        />
      </View>

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* HEADER : langue */}
            <View style={s.topBar}>
              <Pressable
                style={({ pressed }) => [
                  s.langPill,
                  { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  pressed && s.pressed,
                ]}
                onPress={() => {
                  haptic();
                  Alert.alert("Bientôt", "Le choix de langue arrive bientôt.");
                }}
                hitSlop={8}
              >
                <Text style={[s.langTxt, { color: t.text }]}>🇫🇷  FR</Text>
                <Ionicons name="chevron-down" size={12} color={t.textSecondary} />
              </Pressable>
            </View>

            {/* LOGO + branding */}
            <Animated.View entering={FadeIn.duration(500)} style={s.brand}>
              <Animated.View style={logoBreath}>
                <NajdaLogo size={80} withShadow />
              </Animated.View>
              <Text style={[s.brandName, { color: t.text }]}>Najda</Text>
              <Text style={[s.brandTagline, { color: t.text }]}>
                L&apos;artisan qu&apos;il vous faut,{"\n"}quand il vous faut.
              </Text>
            </Animated.View>

            {/* TABS Connexion / Inscription */}
            <View
              style={[
                s.tabs,
                { backgroundColor: t.surfaceMuted, borderColor: t.border },
              ]}
            >
              <Pressable
                onPress={() => switchMode("signup")}
                style={[
                  s.tab,
                  mode === "signup" && {
                    backgroundColor: t.surface,
                    ...shadow.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    s.tabTxt,
                    {
                      color: mode === "signup" ? t.text : t.textSecondary,
                      fontWeight: mode === "signup" ? "800" : "600",
                    },
                  ]}
                >
                  Créer un compte
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode("signin")}
                style={[
                  s.tab,
                  mode === "signin" && {
                    backgroundColor: t.surface,
                    ...shadow.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    s.tabTxt,
                    {
                      color: mode === "signin" ? t.text : t.textSecondary,
                      fontWeight: mode === "signin" ? "800" : "600",
                    },
                  ]}
                >
                  Se connecter
                </Text>
              </Pressable>
            </View>

            {/* MODE SIGNUP : cartes de choix de rôle */}
            {mode === "signup" && (
              <Animated.View
                key={`signup-${role}`}
                entering={FadeInDown.duration(300)}
                style={s.signupBlock}
              >
                <Text style={[s.choicesLabel, { color: t.textSecondary }]}>
                  Vous êtes…
                </Text>

                <Pressable
                  onPress={() => pickRole("client")}
                  style={({ pressed }) => [
                    s.roleCardWrap,
                    pressed && s.pressed,
                  ]}
                >
                  {role === "client" ? (
                    <LinearGradient
                      colors={najdaGradient as unknown as [string, string, ...string[]]}
                      start={najdaGradientDirection.start}
                      end={najdaGradientDirection.end}
                      style={s.roleCard}
                    >
                      <View style={s.roleIcon}>
                        <Ionicons name="search" size={22} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.roleTitle}>Particulier</Text>
                        <Text style={s.roleSub}>
                          Je cherche un artisan
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        s.roleCardIdle,
                        { backgroundColor: t.surface, borderColor: t.border },
                      ]}
                    >
                      <View
                        style={[
                          s.roleIconIdle,
                          { backgroundColor: t.primaryMuted },
                        ]}
                      >
                        <Ionicons name="search" size={22} color={t.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.roleTitleDark, { color: t.text }]}>
                          Particulier
                        </Text>
                        <Text style={[s.roleSubDark, { color: t.textSecondary }]}>
                          Je cherche un artisan
                        </Text>
                      </View>
                      <View
                        style={[s.radio, { borderColor: t.borderStrong }]}
                      />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => pickRole("pro")}
                  style={({ pressed }) => [
                    s.roleCardWrap,
                    pressed && s.pressed,
                  ]}
                >
                  {role === "pro" ? (
                    <LinearGradient
                      colors={najdaGradient as unknown as [string, string, ...string[]]}
                      start={najdaGradientDirection.start}
                      end={najdaGradientDirection.end}
                      style={s.roleCard}
                    >
                      <View style={s.roleIcon}>
                        <Ionicons name="construct" size={22} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.roleTitle}>Professionnel</Text>
                        <Text style={s.roleSub}>
                          Je propose mes services
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        s.roleCardIdle,
                        { backgroundColor: t.surface, borderColor: t.border },
                      ]}
                    >
                      <View
                        style={[
                          s.roleIconIdle,
                          { backgroundColor: t.primaryMuted },
                        ]}
                      >
                        <Ionicons name="construct" size={22} color={t.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.roleTitleDark, { color: t.text }]}>
                          Professionnel
                        </Text>
                        <Text style={[s.roleSubDark, { color: t.textSecondary }]}>
                          Je propose mes services
                        </Text>
                      </View>
                      <View
                        style={[s.radio, { borderColor: t.borderStrong }]}
                      />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            )}

            {/* CHAMPS email/password — apparaissent quand le rôle est choisi (signup) ou direct (signin) */}
            {showInputs && (
              <Animated.View
                key={`fields-${mode}-${role}`}
                entering={FadeInDown.duration(350)}
                style={s.fieldsBlock}
              >
                <View style={s.fieldGroup}>
                  <Text style={[s.label, { color: t.textSecondary }]}>
                    Adresse email
                  </Text>
                  <View
                    style={[
                      s.inputRow,
                      {
                        backgroundColor: t.surface,
                        borderColor:
                          focused === "email"
                            ? t.primary
                            : error && !email.trim()
                              ? t.danger
                              : t.border,
                        borderWidth: focused === "email" ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={focused === "email" ? t.primary : t.textSecondary}
                      style={s.inputIcon}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="vous@exemple.com"
                      placeholderTextColor={t.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      style={[s.input, { color: t.text }]}
                      editable={!loading}
                    />
                    {email.length > 0 &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                      )}
                  </View>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={[s.label, { color: t.textSecondary }]}>
                    Mot de passe
                  </Text>
                  <View
                    style={[
                      s.inputRow,
                      {
                        backgroundColor: t.surface,
                        borderColor:
                          focused === "password"
                            ? t.primary
                            : error && !password
                              ? t.danger
                              : t.border,
                        borderWidth: focused === "password" ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={focused === "password" ? t.primary : t.textSecondary}
                      style={s.inputIcon}
                    />
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder={
                        mode === "signup" ? "Minimum 8 caractères" : "Votre mot de passe"
                      }
                      placeholderTextColor={t.textTertiary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      textContentType={
                        mode === "signup" ? "newPassword" : "password"
                      }
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      style={[s.input, { color: t.text }]}
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
                        color={t.textSecondary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Mot de passe oublié (uniquement en signin) */}
                {mode === "signin" && (
                  <Pressable
                    onPress={handleForgot}
                    hitSlop={6}
                    style={({ pressed }) => [s.forgotWrap, pressed && s.pressed]}
                  >
                    <Text style={[s.forgotTxt, { color: t.primary }]}>
                      Mot de passe oublié ?
                    </Text>
                  </Pressable>
                )}

                {error && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={[
                      s.errorBox,
                      { backgroundColor: t.dangerMuted, borderColor: t.danger },
                    ]}
                  >
                    <Ionicons name="alert-circle" size={16} color={t.danger} />
                    <Text style={[s.errorTxt, { color: t.danger }]}>{error}</Text>
                  </Animated.View>
                )}

                {/* SUBMIT */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={({ pressed }) => [
                    s.submitWrap,
                    loading && { opacity: 0.65 },
                    pressed && !loading && s.ctaPressed,
                  ]}
                >
                  <LinearGradient
                    colors={najdaGradient as unknown as [string, string, ...string[]]}
                    start={najdaGradientDirection.start}
                    end={najdaGradientDirection.end}
                    style={s.submit}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={s.submitTxt}>
                          {mode === "signup"
                            ? "Créer mon compte"
                            : "Se connecter"}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* CGU en bas */}
            <Text style={[s.legal, { color: t.textTertiary }]}>
              En continuant, vous acceptez nos{" "}
              <Text style={[s.legalLink, { color: t.textSecondary }]}>CGU</Text>{" "}
              et notre{" "}
              <Text style={[s.legalLink, { color: t.textSecondary }]}>
                politique de confidentialité
              </Text>
              .
            </Text>

            <View style={{ height: insets.bottom }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// =====================================================
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
  if (l.includes("database error"))
    return "Une erreur est survenue côté serveur. Réessayez dans un instant.";
  return message;
}

const s = StyleSheet.create({
  root: { flex: 1 },

  haloWrap: {
    position: "absolute",
    top: "5%",
    left: "50%",
    width: 600,
    height: 600,
    marginLeft: -300,
  },
  halo: { flex: 1, borderRadius: 300 },

  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: 0,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: space.sm,
    marginBottom: space.md,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  langTxt: { ...T.sm, fontWeight: "700" },

  // ===== BRAND =====
  brand: { alignItems: "center", marginBottom: space.lg },
  brandName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.4,
    marginTop: 12,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
    textAlign: "center",
    lineHeight: 21,
  },

  // ===== TABS =====
  tabs: {
    flexDirection: "row",
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 2,
    marginBottom: space.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabTxt: { fontSize: 14, letterSpacing: -0.2 },

  // ===== SIGNUP role cards =====
  signupBlock: { gap: 10, marginBottom: space.md },
  choicesLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 4,
  },

  roleCardWrap: { borderRadius: 16 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    ...shadow.md,
  },
  roleCardIdle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  roleIconIdle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  roleSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  roleTitleDark: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  roleSubDark: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },

  // ===== FIELDS =====
  fieldsBlock: { gap: 12, marginBottom: space.md },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 0 },
  eyeBtn: { padding: 4, marginLeft: 8 },

  forgotWrap: { alignSelf: "flex-end", paddingVertical: 2 },
  forgotTxt: { fontSize: 13, fontWeight: "700" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  errorTxt: { flex: 1, fontSize: 13, fontWeight: "600" },

  submitWrap: { borderRadius: 16, ...shadow.lg, marginTop: 4 },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  submitTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: space.sm,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  legalLink: { textDecorationLine: "underline" },

  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
