import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { setMyRole, type UserRole } from "@/lib/api-extras";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

type Mode = "signin" | "signup";

export default function EmailAuthScreen() {
  const router = useRouter();
  const t = useTheme();
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ mode?: string; role?: string }>();

  const initialMode: Mode = params.mode === "signin" ? "signin" : "signup";
  const presetRole: UserRole | null =
    params.role === "pro" ? "pro" : params.role === "client" ? "client" : null;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === "signup";

  // ====== Tab slider animation ======
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabX = useSharedValue(0); // 0 = signin (gauche), 1 = signup (droite)

  useEffect(() => {
    tabX.value = withSpring(isSignUp ? 1 : 0, {
      damping: 18,
      stiffness: 200,
    });
  }, [isSignUp, tabX]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const halfWidth = (tabsWidth - 8) / 2;
    return {
      transform: [{ translateX: tabX.value * halfWidth }],
      width: halfWidth,
    };
  });

  // ====== Password strength (signup only) ======
  const strength = useMemo(() => computeStrength(password), [password]);
  const strengthAnim = useSharedValue(0);

  useEffect(() => {
    strengthAnim.value = withTiming(strength.score / 4, { duration: 300 });
  }, [strength.score, strengthAnim]);

  const strengthBarStyle = useAnimatedStyle(() => ({
    width: `${strengthAnim.value * 100}%`,
    backgroundColor:
      strength.score >= 3
        ? "#10B981"
        : strength.score >= 2
          ? "#F59E0B"
          : strength.score >= 1
            ? "#F87171"
            : "transparent",
  }));

  // ====== Handlers ======
  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === "ios") Haptics.impactAsync(style);
  };

  const setModeAnd = (m: Mode) => {
    haptic();
    setError(null);
    setMode(m);
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
    haptic(Haptics.ImpactFeedbackStyle.Medium);
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
        // Pré-enregistrer le rôle choisi à l'écran login
        // (le routing évitera le passage par role-select)
        if (presetRole) {
          try {
            await setMyRole(presetRole);
          } catch {
            // L'utilisateur devra valider son email avant. Le role sera
            // appliqué au premier login via le fallback role-select.
          }
        }
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
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
    haptic();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert(
        "Email requis",
        "Saisissez d'abord votre adresse email, puis appuyez à nouveau sur \"Mot de passe oublié\".",
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
      Alert.alert("Erreur", "Impossible d'envoyer l'email de réinitialisation. Réessayez.");
    }
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent />

      {/* Halo très doux — diffus, sans cercle visible */}
      <View pointerEvents="none" style={s.haloWrap}>
        <LinearGradient
          colors={
            isDark
              ? ["rgba(155,181,255,0)", "rgba(168,155,255,0.12)", "rgba(197,139,236,0)"]
              : ["rgba(155,181,255,0)", "rgba(168,155,255,0.14)", "rgba(197,139,236,0)"]
          }
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={s.halo}
        />
      </View>

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.flex}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ========== HEADER ========== */}
            <Animated.View entering={FadeIn.duration(400)} style={s.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                hitSlop={12}
                onPress={() => {
                  haptic();
                  router.back();
                }}
                style={({ pressed }) => [
                  s.backBtn,
                  { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  pressed && s.pressed,
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={t.text} />
              </Pressable>

              <View style={s.brandMini}>
                <NajdaLogo size={32} />
                <Text style={[s.brandMiniWord, { color: t.text }]}>Najda</Text>
              </View>

              <View style={{ width: 44 }} />
            </Animated.View>

            {/* ========== TABS animées ========== */}
            <Animated.View
              entering={FadeIn.delay(100).duration(400)}
              onLayout={(e: LayoutChangeEvent) => setTabsWidth(e.nativeEvent.layout.width)}
              style={[
                s.tabs,
                { backgroundColor: t.surfaceMuted, borderColor: t.border },
              ]}
            >
              {/* Indicateur dégradé qui slide */}
              {tabsWidth > 0 && (
                <Animated.View style={[s.tabIndicator, tabIndicatorStyle]}>
                  <LinearGradient
                    colors={najdaGradient as unknown as [string, string, ...string[]]}
                    start={najdaGradientDirection.start}
                    end={najdaGradientDirection.end}
                    style={s.tabIndicatorFill}
                  />
                </Animated.View>
              )}

              <Pressable
                style={s.tab}
                onPress={() => setModeAnd("signin")}
              >
                <Text
                  style={[
                    s.tabTxt,
                    { color: !isSignUp ? "#FFFFFF" : t.textSecondary },
                  ]}
                >
                  Se connecter
                </Text>
              </Pressable>

              <Pressable
                style={s.tab}
                onPress={() => setModeAnd("signup")}
              >
                <Text
                  style={[
                    s.tabTxt,
                    { color: isSignUp ? "#FFFFFF" : t.textSecondary },
                  ]}
                >
                  Créer un compte
                </Text>
              </Pressable>
            </Animated.View>

            {/* ========== BADGE rôle (si signup avec preset) ========== */}
            {isSignUp && presetRole && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={[
                  s.roleBadge,
                  { backgroundColor: t.primaryMuted },
                ]}
              >
                <Ionicons
                  name={presetRole === "pro" ? "construct" : "search"}
                  size={13}
                  color={t.primary}
                />
                <Text style={[s.roleBadgeTxt, { color: t.primary }]}>
                  {presetRole === "pro"
                    ? "Compte professionnel"
                    : "Compte particulier"}
                </Text>
              </Animated.View>
            )}

            {/* ========== TITRE ========== */}
            <Animated.Text
              key={`title-${mode}`}
              entering={FadeInDown.duration(350)}
              style={[s.title, { color: t.text }]}
            >
              {isSignUp ? "Bienvenue chez Najda." : "Content de vous revoir."}
            </Animated.Text>
            <Animated.Text
              key={`sub-${mode}`}
              entering={FadeInDown.delay(60).duration(350)}
              style={[s.subtitle, { color: t.textSecondary }]}
            >
              {isSignUp
                ? "Créez votre compte en 30 secondes pour accéder à des artisans vérifiés."
                : "Connectez-vous pour retrouver vos artisans et rendez-vous."}
            </Animated.Text>

            {/* ========== CHAMPS ========== */}
            <View style={s.fields}>
              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Adresse email
                </Text>
                <View
                  style={[
                    s.inputRow,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                    focused === "email" && { borderColor: t.primary, backgroundColor: t.surface },
                    error && !email.trim() && { borderColor: t.danger },
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
                    style={[s.inputInner, { color: t.text }]}
                    editable={!loading}
                  />
                  {email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  )}
                </View>
              </View>

              {/* Mot de passe */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Mot de passe
                </Text>
                <View
                  style={[
                    s.inputRow,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                    focused === "password" && { borderColor: t.primary, backgroundColor: t.surface },
                    error && !password && { borderColor: t.danger },
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
                      isSignUp ? "Minimum 8 caractères" : "Votre mot de passe"
                    }
                    placeholderTextColor={t.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    textContentType={isSignUp ? "newPassword" : "password"}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={[s.inputInner, { color: t.text }]}
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

                {/* Indicateur de force (signup uniquement) */}
                {isSignUp && password.length > 0 && (
                  <View style={s.strengthRow}>
                    <View style={[s.strengthTrack, { backgroundColor: t.surfaceMuted }]}>
                      <Animated.View style={[s.strengthFill, strengthBarStyle]} />
                    </View>
                    <Text
                      style={[
                        s.strengthLabel,
                        {
                          color:
                            strength.score >= 3
                              ? "#10B981"
                              : strength.score >= 2
                                ? "#D97706"
                                : "#EF4444",
                        },
                      ]}
                    >
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Remember + Forgot */}
              <View style={s.optionsRow}>
                <Pressable
                  onPress={() => {
                    haptic();
                    setRememberMe(!rememberMe);
                  }}
                  style={s.checkboxRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View
                    style={[
                      s.checkbox,
                      { backgroundColor: t.surfaceMuted, borderColor: t.borderStrong },
                      rememberMe && { backgroundColor: t.primary, borderColor: t.primary },
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color={t.primaryText} />
                    )}
                  </View>
                  <Text style={[s.checkboxLabel, { color: t.textSecondary }]}>
                    Se souvenir de moi
                  </Text>
                </Pressable>

                {!isSignUp && (
                  <Pressable
                    onPress={handleForgotPassword}
                    hitSlop={8}
                    style={({ pressed }) => pressed && s.pressed}
                  >
                    <Text style={[s.forgotLink, { color: t.primary }]}>
                      Mot de passe oublié ?
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Error */}
              {error && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[
                    s.errorBox,
                    { backgroundColor: t.dangerMuted, borderColor: t.danger },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color={t.danger} />
                  <Text style={[s.errorText, { color: t.danger }]}>{error}</Text>
                </Animated.View>
              )}
            </View>

            {/* ========== SUBMIT ========== */}
            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                s.submitWrap,
                loading && s.submitDisabled,
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
                      {isSignUp ? "Créer mon compte" : "Se connecter"}
                    </Text>
                    <View style={s.submitArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* ========== TOGGLE bas ========== */}
            <Pressable
              onPress={() => setModeAnd(isSignUp ? "signin" : "signup")}
              disabled={loading}
              style={({ pressed }) => [s.toggle, pressed && s.pressed]}
              accessibilityRole="button"
              hitSlop={6}
            >
              <Text style={[s.toggleText, { color: t.textSecondary }]}>
                {isSignUp
                  ? "Vous avez déjà un compte ?  "
                  : "Pas encore de compte ?  "}
                <Text style={[s.toggleLink, { color: t.primary }]}>
                  {isSignUp ? "Se connecter" : "S'inscrire"}
                </Text>
              </Text>
            </Pressable>

            <Text style={[s.legal, { color: t.textTertiary }]}>
              En continuant, vous acceptez nos{" "}
              <Text style={[s.legalLink, { color: t.textSecondary }]}>CGU</Text>
              {" "}et notre{" "}
              <Text style={[s.legalLink, { color: t.textSecondary }]}>
                politique de confidentialité
              </Text>
              .
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// =====================================================
// Password strength
// =====================================================
function computeStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
  return { score, label: labels[score] };
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
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },

  haloWrap: {
    position: "absolute",
    top: "5%",
    right: "-50%",
    width: 700,
    height: 700,
  },
  halo: { flex: 1, borderRadius: 350 },

  // ============= HEADER =============
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brandMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandMiniWord: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  // ============= TABS =============
  tabs: {
    flexDirection: "row",
    borderRadius: radius.full,
    padding: 4,
    marginBottom: space.xl,
    borderWidth: 1,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  tabIndicatorFill: {
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabTxt: { ...T.sm, fontWeight: "600" },

  // ============= TITRE =============
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  roleBadgeTxt: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.1,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -1.2,
    lineHeight: 34,
    marginBottom: space.sm,
  },
  subtitle: {
    ...T.base,
    marginBottom: space.xl,
    maxWidth: 340,
  },

  // ============= CHAMPS =============
  fields: { gap: space.md, marginBottom: space.lg },
  fieldGroup: { gap: 8 },
  label: { ...T.sm, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  inputInner: {
    flex: 1,
    ...T.base,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // ============= STRENGTH =============
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "right",
  },

  // ============= OPTIONS =============
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
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    ...T.sm,
    fontWeight: "500",
  },
  forgotLink: {
    ...T.sm,
    fontWeight: "600",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    ...T.sm,
    fontWeight: "500",
  },

  // ============= SUBMIT =============
  submitWrap: {
    marginBottom: space.md,
    borderRadius: 16,
    ...shadow.lg,
  },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 22,
    paddingRight: 6,
    height: 58,
    borderRadius: 16,
  },
  submitDisabled: { opacity: 0.65 },
  submitTxt: { ...T.base, fontWeight: "700", color: "#FFFFFF" },
  submitArrow: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },

  toggle: {
    alignItems: "center",
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  toggleText: { ...T.sm },
  toggleLink: { fontWeight: "700" },

  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: space.sm,
  },
  legalLink: { textDecorationLine: "underline" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
