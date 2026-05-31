import { useCallback, useEffect, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
import { getMyProfile, updateMyProfile } from "@/lib/api";
import {
  upsertMyProProfile,
  upsertMyArtisanCard,
} from "@/lib/api-extras";
import { CATEGORIES } from "@/constants/categories";

const PRICE_OPTIONS = ["€", "€€", "€€€"];
const ZONE_OPTIONS = [5, 10, 15, 25, 50];

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<"client" | "pro" | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Champs communs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Champs pro
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [zoneKm, setZoneKm] = useState<number>(15);
  const [priceRange, setPriceRange] = useState("€€");
  const [yearsExp, setYearsExp] = useState("0");
  const [servicesText, setServicesText] = useState("");
  const [bio, setBio] = useState("");

  // Wizard
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);

  // Charger le rôle une seule fois au mount
  const loadRole = useCallback(async () => {
    try {
      const p = await getMyProfile();
      if (p) {
        setRole(p.role);
        // Pré-remplir les champs si déjà saisis
        if (p.firstName) setFirstName(p.firstName);
        if (p.lastName) setLastName(p.lastName);
        if (p.phone) setPhone(p.phone);
        if (p.city) setCity(p.city);
      } else {
        setRole("client"); // fallback
      }
    } catch {
      setRole("client");
    } finally {
      setRoleLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  // ============= Total steps selon le rôle =============
  const totalSteps = role === "pro" ? 3 : 1;

  const stepIntro: Record<number, { title: string; sub: string }> = {
    1: {
      title: "Quelques infos sur vous",
      sub:
        role === "pro"
          ? "Pour vous identifier auprès des clients."
          : "Pour personnaliser votre expérience Najda.",
    },
    2: {
      title: "Votre activité",
      sub: "Décrivez ce que vous proposez aux clients.",
    },
    3: {
      title: "Votre zone et vos tarifs",
      sub: "Pour ne recevoir que des demandes adaptées.",
    },
  };

  // ============= Validation par étape =============
  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!firstName.trim()) return "Saisissez votre prénom.";
      if (!lastName.trim()) return "Saisissez votre nom.";
      if (!phone.trim()) return "Saisissez votre téléphone.";
      if (!/^[0-9+\s.-]{8,}$/.test(phone.trim()))
        return "Ce numéro ne semble pas valide.";
      if (!city.trim()) return "Saisissez votre ville.";
    } else if (step === 2 && role === "pro") {
      if (categoryIds.length === 0)
        return "Choisissez au moins un métier (vous pouvez en cocher plusieurs).";
      if (!servicesText.trim())
        return "Listez au moins un service que vous proposez.";
    }
    return null;
  };

  // ============= Navigation entre steps =============
  const goNext = () => {
    const v = validateCurrentStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const goPrev = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  // ============= Submit final =============
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Update profile commun
      await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });

      // Si pro : créer pro_profile + record artisan public
      if (role === "pro") {
        const services = servicesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const primaryMetier = categoryIds[0] ?? categoryId ?? null;
        await upsertMyProProfile({
          categoryId: primaryMetier,
          categoryIds,
          city: city.trim(),
          zoneKm,
          priceRange,
          bio: bio.trim(),
          services,
          yearsExp: parseInt(yearsExp, 10) || 0,
        } as Parameters<typeof upsertMyProProfile>[0]);
        if (primaryMetier) {
          await upsertMyArtisanCard({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            categoryId: primaryMetier,
            categoryIds,
            city: city.trim(),
            bio: bio.trim(),
            services,
            priceRange,
            yearsExp: parseInt(yearsExp, 10) || 0,
          });
        }
        router.replace("/(app)/pro/dashboard");
      } else {
        router.replace("/(app)/(tabs)");
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la sauvegarde.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!roleLoaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const intro = stepIntro[step];

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============= HERO ============= */}
          <LinearGradient
            colors={najdaGradient as unknown as [string, string, ...string[]]}
            start={najdaGradientDirection.start}
            end={najdaGradientDirection.end}
            style={[s.hero, { paddingTop: insets.top + 8 }]}
          >
            <View style={s.heroTopBar}>
              {step > 1 ? (
                <Pressable
                  onPress={goPrev}
                  hitSlop={12}
                  style={({ pressed }) => [
                    s.heroIconBtn,
                    pressed && s.pressed,
                  ]}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                <View style={{ width: 40 }} />
              )}
              <Text style={s.heroStep}>
                Étape {step}/{totalSteps}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <Animated.Text
              key={`title-${step}`}
              entering={FadeIn.duration(300)}
              style={s.heroTitle}
            >
              {intro.title}
            </Animated.Text>
            <Animated.Text
              key={`sub-${step}`}
              entering={FadeIn.duration(300)}
              style={s.heroSub}
            >
              {intro.sub}
            </Animated.Text>

            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  { width: `${(step / totalSteps) * 100}%` },
                ]}
              />
            </View>
          </LinearGradient>

          {/* ============= STEP 1 — Identité ============= */}
          {step === 1 && (
            <Animated.View
              key="step1"
              entering={FadeInDown.duration(350)}
              style={s.content}
            >
              <Field
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ali"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                focused={focused === "firstName"}
                onFocus={() => setFocused("firstName")}
                onBlur={() => setFocused(null)}
                t={t}
              />
              <Field
                ref={lastNameRef}
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Djibrine"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                focused={focused === "lastName"}
                onFocus={() => setFocused("lastName")}
                onBlur={() => setFocused(null)}
                t={t}
              />
              <Field
                ref={phoneRef}
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
                focused={focused === "phone"}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                icon="call-outline"
                t={t}
              />
              <Field
                ref={cityRef}
                label="Ville"
                value={city}
                onChangeText={setCity}
                placeholder="Strasbourg"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={goNext}
                focused={focused === "city"}
                onFocus={() => setFocused("city")}
                onBlur={() => setFocused(null)}
                icon="location-outline"
                t={t}
              />
            </Animated.View>
          )}

          {/* ============= STEP 2 — Activité (pro) ============= */}
          {step === 2 && role === "pro" && (
            <Animated.View
              key="step2"
              entering={FadeInDown.duration(350)}
              style={s.content}
            >
              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Vos métiers
                </Text>
                <Text
                  style={[
                    s.hint,
                    { color: t.textTertiary, marginBottom: 8 },
                  ]}
                >
                  Cochez tous les métiers que vous proposez (1 ou plusieurs).
                  Le premier choisi sera votre métier principal.
                </Text>
                <View style={s.catGrid}>
                  {CATEGORIES.map((c) => {
                    const active = categoryIds.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          if (active) {
                            const next = categoryIds.filter(
                              (id) => id !== c.id,
                            );
                            setCategoryIds(next);
                            setCategoryId(next[0] ?? null);
                          } else {
                            const next = [...categoryIds, c.id];
                            setCategoryIds(next);
                            setCategoryId(next[0]);
                          }
                        }}
                        style={[
                          s.catPill,
                          {
                            backgroundColor: active ? t.primary : t.surface,
                            borderColor: active ? t.primary : t.borderStrong,
                          },
                        ]}
                      >
                        <Ionicons
                          name={c.icon}
                          size={14}
                          color={active ? "#FFFFFF" : t.primary}
                        />
                        <Text
                          style={[
                            s.catPillTxt,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {c.name}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#FFFFFF"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Services proposés
                </Text>
                <View
                  style={[
                    s.textareaWrap,
                    {
                      backgroundColor: t.surface,
                      borderColor: t.border,
                    },
                  ]}
                >
                  <TextInput
                    value={servicesText}
                    onChangeText={setServicesText}
                    placeholder="Ex : Fuite d'eau, Débouchage, Chauffe-eau"
                    placeholderTextColor={t.textTertiary}
                    multiline
                    style={[s.textarea, { color: t.text }]}
                  />
                </View>
                <Text style={[s.hint, { color: t.textTertiary }]}>
                  Séparez chaque service par une virgule.
                </Text>
              </View>

              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Présentation (facultatif)
                </Text>
                <View
                  style={[
                    s.textareaWrap,
                    {
                      backgroundColor: t.surface,
                      borderColor: t.border,
                      minHeight: 100,
                    },
                  ]}
                >
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Décrivez votre activité, votre savoir-faire…"
                    placeholderTextColor={t.textTertiary}
                    multiline
                    maxLength={500}
                    style={[s.textarea, { color: t.text }]}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ============= STEP 3 — Zone et tarifs (pro) ============= */}
          {step === 3 && role === "pro" && (
            <Animated.View
              key="step3"
              entering={FadeInDown.duration(350)}
              style={s.content}
            >
              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Rayon d&apos;intervention
                </Text>
                <View style={s.optionsRow}>
                  {ZONE_OPTIONS.map((km) => {
                    const active = zoneKm === km;
                    return (
                      <Pressable
                        key={km}
                        onPress={() => setZoneKm(km)}
                        style={[
                          s.optionPill,
                          {
                            backgroundColor: active ? t.primary : t.surface,
                            borderColor: active ? t.primary : t.borderStrong,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.optionPillTxt,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {km} km
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Niveau de tarifs
                </Text>
                <View style={s.optionsRow}>
                  {PRICE_OPTIONS.map((p) => {
                    const active = priceRange === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setPriceRange(p)}
                        style={[
                          s.optionPill,
                          {
                            backgroundColor: active ? t.primary : t.surface,
                            borderColor: active ? t.primary : t.borderStrong,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.optionPillTxt,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={[s.label, { color: t.textSecondary }]}>
                  Années d&apos;expérience
                </Text>
                <View
                  style={[
                    s.inputRow,
                    {
                      backgroundColor: t.surface,
                      borderColor:
                        focused === "yearsExp" ? t.primary : t.border,
                      borderWidth: focused === "yearsExp" ? 1.5 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={17}
                    color={focused === "yearsExp" ? t.primary : t.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={yearsExp}
                    onChangeText={(v) =>
                      setYearsExp(v.replace(/[^0-9]/g, ""))
                    }
                    placeholder="5"
                    placeholderTextColor={t.textTertiary}
                    keyboardType="number-pad"
                    onFocus={() => setFocused("yearsExp")}
                    onBlur={() => setFocused(null)}
                    style={[s.input, { color: t.text }]}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ============= ERROR ============= */}
          {error && (
            <View
              style={[
                s.errorBox,
                {
                  backgroundColor: t.dangerMuted,
                  borderColor: t.danger,
                  marginHorizontal: space.lg,
                  marginTop: 8,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={t.danger} />
              <Text style={[s.errorTxt, { color: t.danger }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ============= BOTTOM BAR ============= */}
        <View
          style={[
            s.bottomBar,
            {
              backgroundColor: t.surface,
              borderTopColor: t.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Pressable
            onPress={goNext}
            disabled={submitting}
            style={({ pressed }) => [
              s.ctaWrap,
              submitting && { opacity: 0.6 },
              pressed && !submitting && s.ctaPressed,
            ]}
          >
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.cta}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={s.ctaTxt}>
                    {step < totalSteps ? "Continuer" : "Terminer"}
                  </Text>
                  <Ionicons
                    name={
                      step < totalSteps
                        ? "arrow-forward"
                        : "checkmark-circle"
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// =====================================================
// Field
// =====================================================
import { forwardRef } from "react";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad" | "email-address";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  autoCapitalize?: "none" | "words" | "sentences";
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  t: ReturnType<typeof useTheme>;
};

const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    returnKeyType,
    onSubmitEditing,
    autoCapitalize = "none",
    focused,
    onFocus,
    onBlur,
    icon,
    t,
  },
  ref,
) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, { color: t.textSecondary }]}>{label}</Text>
      <View
        style={[
          s.inputRow,
          {
            backgroundColor: t.surface,
            borderColor: focused ? t.primary : t.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={17}
            color={focused ? t.primary : t.textSecondary}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textTertiary}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          style={[s.input, { color: t.text }]}
        />
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ===== HERO =====
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroStep: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 19,
    marginBottom: space.md,
  },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  // ===== CONTENT =====
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: 14,
  },

  // ===== FIELDS =====
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 0 },

  textareaWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 70,
  },
  textarea: {
    fontSize: 14,
    fontWeight: "500",
    minHeight: 44,
    textAlignVertical: "top",
    padding: 0,
  },
  hint: { fontSize: 11, fontWeight: "500", marginTop: 4 },

  // ===== CATEGORY chips =====
  catRow: { gap: 6, paddingVertical: 4 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  catPillTxt: { fontSize: 13, fontWeight: "800" },

  optionsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionPillTxt: { fontSize: 13, fontWeight: "800" },

  // ===== ERROR =====
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorTxt: { fontSize: 13, fontWeight: "600", flex: 1 },

  // ===== CTA =====
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  ctaWrap: { borderRadius: 16, ...shadow.lg },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  ctaTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
