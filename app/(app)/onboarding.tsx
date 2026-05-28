import { useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";
import { updateMyProfile } from "@/lib/api";

export default function OnboardingScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return "Saisissez votre prénom.";
    if (!lastName.trim()) return "Saisissez votre nom.";
    if (!phone.trim()) return "Saisissez votre numéro de téléphone.";
    if (!/^[0-9+\s.-]{8,}$/.test(phone.trim()))
      return "Ce numéro de téléphone ne semble pas valide.";
    if (!city.trim()) return "Saisissez votre ville.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await updateMyProfile({
        firstName,
        lastName,
        phone,
        city,
      });
      // Forcer la navigation vers le hub
      router.replace("/(app)/(tabs)");
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la sauvegarde du profil.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    name: string,
    options: {
      placeholder?: string;
      keyboardType?: "default" | "phone-pad";
      autoCapitalize?: "none" | "words" | "sentences";
      ref?: React.RefObject<TextInput | null>;
      onSubmit?: () => void;
      returnKeyType?: "next" | "done";
    } = {},
  ) => (
    <View style={s.fieldGroup}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        ref={options.ref}
        value={value}
        onChangeText={(v) => {
          onChange(v);
          if (error) setError(null);
        }}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        placeholder={options.placeholder}
        placeholderTextColor={brand.gray400}
        keyboardType={options.keyboardType}
        autoCapitalize={options.autoCapitalize ?? "words"}
        autoCorrect={false}
        returnKeyType={options.returnKeyType ?? "next"}
        onSubmitEditing={options.onSubmit}
        style={[
          s.input,
          { borderColor: focused === name ? brand.primary400 : brand.gray200 },
        ]}
        editable={!submitting}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

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
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={s.logoMark}>
              <Ionicons name="person" size={28} color={brand.white} />
            </View>
            <Text style={s.title}>Quelques infos sur vous</Text>
            <Text style={s.subtitle}>
              Ces informations permettent à l&apos;artisan de vous contacter et
              de venir chez vous le jour J.
            </Text>
          </Animated.View>

          {/* Formulaire */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={s.fields}
          >
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                {renderInput("Prénom", firstName, setFirstName, "firstName", {
                  placeholder: "Ali",
                  onSubmit: () => lastNameRef.current?.focus(),
                })}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("Nom", lastName, setLastName, "lastName", {
                  placeholder: "Djibrine",
                  ref: lastNameRef,
                  onSubmit: () => phoneRef.current?.focus(),
                })}
              </View>
            </View>

            {renderInput("Téléphone", phone, setPhone, "phone", {
              placeholder: "06 12 34 56 78",
              keyboardType: "phone-pad",
              autoCapitalize: "none",
              ref: phoneRef,
              onSubmit: () => cityRef.current?.focus(),
            })}

            {renderInput("Ville", city, setCity, "city", {
              placeholder: "Lyon",
              ref: cityRef,
              returnKeyType: "done",
              onSubmit: handleSubmit,
            })}

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
          </Animated.View>

          {/* Info privacy */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={s.privacy}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={brand.primary500}
            />
            <Text style={s.privacyTxt}>
              Vos données sont privées et ne sont partagées qu&apos;avec
              l&apos;artisan que vous réservez.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={s.ctaBar}>
          <Pressable
            style={({ pressed }) => [
              s.cta,
              submitting && s.ctaDisabled,
              pressed && !submitting && s.ctaP,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={brand.white} />
            ) : (
              <>
                <Text style={s.ctaTxt}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color={brand.white} />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.white },
  flex: { flex: 1 },
  scroll: { padding: space.lg, paddingTop: space.xl },

  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.lg,
    ...shadow.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.8,
    marginBottom: space.sm,
  },
  subtitle: {
    ...T.base,
    color: brand.gray500,
    lineHeight: 22,
    marginBottom: space.xl,
    maxWidth: 320,
  },

  fields: { gap: space.md, marginBottom: space.lg },
  row: { flexDirection: "row", gap: 12 },
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

  privacy: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: brand.primary50,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.lg,
  },
  privacyTxt: {
    flex: 1,
    ...T.xs,
    color: brand.primary700,
    lineHeight: 18,
  },

  ctaBar: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.sm,
    backgroundColor: brand.white,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: comp.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: brand.primary500,
    ...shadow.lg,
  },
  ctaDisabled: { backgroundColor: brand.gray400 },
  ctaP: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaTxt: { ...T.base, fontWeight: "700", color: brand.white },
});
