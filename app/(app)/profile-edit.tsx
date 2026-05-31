import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
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
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
  type Profile,
} from "@/lib/api";

export default function ProfileEditScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);

  useEffect(() => {
    let mounted = true;
    getMyProfile()
      .then((p) => {
        if (!mounted || !p) return;
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhone(p.phone);
        setAddress(p.address);
        setCity(p.city);
        setPostalCode(p.postalCode);
        setAvatarUrl(p.avatarUrl);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !city.trim()) {
      Alert.alert(
        "Champs obligatoires",
        "Prénom, nom, téléphone et ville sont requis.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await updateMyProfile({
        firstName,
        lastName,
        phone,
        address,
        city,
        postalCode,
      });
      Alert.alert(
        "Profil mis à jour",
        "Vos informations ont été enregistrées.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: unknown) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de sauvegarder.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Autorisation requise",
        "Najda a besoin d'accéder à votre galerie.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    await doUpload(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Autorisation requise",
        "Najda a besoin d'accéder à votre appareil photo.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    await doUpload(result.assets[0].uri);
  };

  const doUpload = async (uri: string) => {
    setPhotoBusy(true);
    try {
      const url = await uploadAvatar(uri);
      setAvatarUrl(url);
    } catch (e: unknown) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible d'uploader la photo.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const doDelete = () => {
    Alert.alert(
      "Supprimer la photo ?",
      "Votre avatar sera supprimé. Vous pourrez en remettre une plus tard.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setPhotoBusy(true);
            try {
              await deleteAvatar();
              setAvatarUrl(null);
            } catch (e: unknown) {
              Alert.alert(
                "Erreur",
                e instanceof Error ? e.message : "Impossible de supprimer.",
              );
            } finally {
              setPhotoBusy(false);
            }
          },
        },
      ],
    );
  };

  const openPhotoMenu = () => {
    const hasPhoto = !!avatarUrl;
    Alert.alert(
      hasPhoto ? "Modifier la photo" : "Ajouter une photo",
      undefined,
      [
        { text: "Prendre une photo", onPress: pickFromCamera },
        { text: "Choisir depuis la galerie", onPress: pickFromLibrary },
        ...(hasPhoto
          ? [
              {
                text: "Supprimer la photo",
                style: "destructive" as const,
                onPress: doDelete,
              },
            ]
          : []),
        { text: "Annuler", style: "cancel" as const },
      ],
    );
  };

  const initial = firstName.charAt(0).toUpperCase() || "?";

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============= HERO DÉGRADÉ ============= */}
          <LinearGradient
            colors={najdaGradient as unknown as [string, string, ...string[]]}
            start={najdaGradientDirection.start}
            end={najdaGradientDirection.end}
            style={[s.hero, { paddingTop: insets.top + 8 }]}
          >
            <View style={s.heroTop}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={({ pressed }) => [s.heroBack, pressed && s.pressed]}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
              <Text style={s.heroTitle}>Mes informations</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Avatar editable */}
            <Animated.View
              entering={FadeIn.delay(120).duration(450)}
              style={s.avatarBlock}
            >
              <Pressable
                onPress={openPhotoMenu}
                disabled={photoBusy}
                style={({ pressed }) => pressed && s.pressed}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarTxt}>{initial}</Text>
                  </View>
                )}
                <View
                  style={[
                    s.avatarBadge,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  {photoBusy ? (
                    <ActivityIndicator size="small" color={t.primary} />
                  ) : (
                    <Ionicons
                      name={avatarUrl ? "create-outline" : "camera-outline"}
                      size={16}
                      color={t.primary}
                    />
                  )}
                </View>
              </Pressable>
              <Text style={s.avatarLabel}>
                {avatarUrl ? "Modifier la photo" : "Ajouter une photo"}
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* ============= FORM ============= */}
          <View style={s.content}>
            {/* Identité */}
            <Animated.View
              entering={FadeInDown.delay(180).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionLabel, { color: t.textSecondary }]}>
                Identité
              </Text>

              <Field
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ali"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                autoCapitalize="words"
                focused={focused === "firstName"}
                onFocus={() => setFocused("firstName")}
                onBlur={() => setFocused(null)}
                t={t}
                required
              />

              <Field
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Djibrine"
                ref={lastNameRef}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                autoCapitalize="words"
                focused={focused === "lastName"}
                onFocus={() => setFocused("lastName")}
                onBlur={() => setFocused(null)}
                t={t}
                required
              />
            </Animated.View>

            {/* Contact */}
            <Animated.View
              entering={FadeInDown.delay(240).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionLabel, { color: t.textSecondary }]}>
                Contact
              </Text>

              <Field
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
                ref={phoneRef}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => addressRef.current?.focus()}
                focused={focused === "phone"}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                t={t}
                required
                icon="call-outline"
              />
            </Animated.View>

            {/* Adresse */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={s.section}
            >
              <Text style={[s.sectionLabel, { color: t.textSecondary }]}>
                Adresse
              </Text>

              <Field
                label="Adresse"
                value={address}
                onChangeText={setAddress}
                placeholder="12 rue de la Paix"
                ref={addressRef}
                returnKeyType="next"
                onSubmitEditing={() => postalRef.current?.focus()}
                focused={focused === "address"}
                onFocus={() => setFocused("address")}
                onBlur={() => setFocused(null)}
                t={t}
                icon="location-outline"
              />

              <View style={s.row2}>
                <View style={s.row2Item}>
                  <Field
                    label="Code postal"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="75001"
                    ref={postalRef}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="next"
                    onSubmitEditing={() => cityRef.current?.focus()}
                    focused={focused === "postal"}
                    onFocus={() => setFocused("postal")}
                    onBlur={() => setFocused(null)}
                    t={t}
                  />
                </View>
                <View style={[s.row2Item, { flex: 1.4 }]}>
                  <Field
                    label="Ville"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Paris"
                    ref={cityRef}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    focused={focused === "city"}
                    onFocus={() => setFocused("city")}
                    onBlur={() => setFocused(null)}
                    t={t}
                    required
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* ============= STICKY CTA ============= */}
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
            onPress={handleSave}
            disabled={submitting}
            style={({ pressed }) => [
              s.saveWrap,
              submitting && { opacity: 0.6 },
              pressed && !submitting && s.ctaPressed,
            ]}
          >
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.save}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={s.saveTxt}>Enregistrer</Text>
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
// Field (input avec label + icône optionnelle)
// =====================================================
type FieldProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad" | "email-address";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  maxLength?: number;
  autoCapitalize?: "none" | "words" | "sentences";
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  t: ReturnType<typeof useTheme>;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

import { forwardRef } from "react";
const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    returnKeyType,
    onSubmitEditing,
    maxLength,
    autoCapitalize = "none",
    focused,
    onFocus,
    onBlur,
    t,
    required,
    icon,
  },
  ref,
) {
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, { color: t.textSecondary }]}>
        {label}
        {required && <Text style={{ color: t.danger }}> *</Text>}
      </Text>
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
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
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

  // ============= HERO =============
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl + 8,
    alignItems: "center",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: space.lg,
  },
  heroBack: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  avatarBlock: { alignItems: "center", gap: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  avatarTxt: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.2,
  },

  // ============= CONTENT =============
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },

  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
    marginLeft: 4,
  },

  // ============= FIELD =============
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },

  row2: { flexDirection: "row", gap: 10 },
  row2Item: { flex: 1 },

  // ============= BOTTOM =============
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  saveWrap: { borderRadius: 16, ...shadow.lg },
  save: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  saveTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
