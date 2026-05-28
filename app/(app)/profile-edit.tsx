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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, comp, text as T } from "@/constants/theme";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
  type Profile,
} from "@/lib/api";

export default function ProfileEditScreen() {
  const router = useRouter();

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
      Alert.alert("Profil mis à jour", "Vos informations ont été enregistrées.", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
      Alert.alert("Autorisation requise", "Najda a besoin d'accéder à votre galerie.");
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
      Alert.alert("Autorisation requise", "Najda a besoin d'accéder à votre appareil photo.");
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
                e instanceof Error ? e.message : "Impossible de supprimer la photo.",
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
          ? ([
              { text: "Supprimer la photo", style: "destructive" as const, onPress: doDelete },
            ])
          : []),
        { text: "Annuler", style: "cancel" as const },
      ],
    );
  };

  const initial = firstName.charAt(0).toUpperCase() || "?";

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={brand.primary500} />
        </View>
      </SafeAreaView>
    );
  }

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    name: string,
    options: {
      placeholder?: string;
      keyboardType?: "default" | "phone-pad" | "numeric";
      autoCapitalize?: "none" | "words" | "sentences";
      ref?: React.RefObject<TextInput | null>;
      onSubmit?: () => void;
      returnKeyType?: "next" | "done";
      required?: boolean;
    } = {},
  ) => (
    <View style={s.fieldGroup}>
      <View style={s.labelRow}>
        <Text style={s.label}>{label}</Text>
        {options.required && <Text style={s.required}>*</Text>}
      </View>
      <TextInput
        ref={options.ref}
        value={value}
        onChangeText={onChange}
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
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.flex}
      >
        <View style={s.header}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && s.op]}
            onPress={() => router.back()}
            accessibilityRole="button"
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={brand.gray800} />
          </Pressable>
          <Text style={s.hTitle}>Mes informations</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo de profil */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(400)}
            style={s.photoBlock}
          >
            <Pressable
              onPress={openPhotoMenu}
              disabled={photoBusy}
              style={({ pressed }) => [s.avatarWrap, pressed && s.op]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{initial}</Text>
                </View>
              )}
              <View style={s.cameraBtn}>
                {photoBusy ? (
                  <ActivityIndicator color={brand.white} size="small" />
                ) : (
                  <Ionicons
                    name={avatarUrl ? "create" : "camera"}
                    size={16}
                    color={brand.white}
                  />
                )}
              </View>
            </Pressable>
            <Pressable onPress={openPhotoMenu} disabled={photoBusy} hitSlop={8}>
              <Text style={s.photoLink}>
                {avatarUrl ? "Modifier la photo" : "Ajouter une photo"}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <Text style={s.sectionTitle}>Identité</Text>
            <View style={s.fields}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  {renderField("Prénom", firstName, setFirstName, "firstName", {
                    placeholder: "Ali",
                    required: true,
                    onSubmit: () => lastNameRef.current?.focus(),
                  })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField("Nom", lastName, setLastName, "lastName", {
                    placeholder: "Djibrine",
                    required: true,
                    ref: lastNameRef,
                    onSubmit: () => phoneRef.current?.focus(),
                  })}
                </View>
              </View>

              {renderField("Téléphone", phone, setPhone, "phone", {
                placeholder: "06 12 34 56 78",
                keyboardType: "phone-pad",
                autoCapitalize: "none",
                required: true,
                ref: phoneRef,
                onSubmit: () => addressRef.current?.focus(),
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={s.sectionTitle}>Adresse</Text>
            <View style={s.fields}>
              {renderField("Adresse", address, setAddress, "address", {
                placeholder: "24 rue de la République",
                ref: addressRef,
                onSubmit: () => postalRef.current?.focus(),
              })}

              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  {renderField("Code postal", postalCode, setPostalCode, "postal", {
                    placeholder: "69001",
                    keyboardType: "numeric",
                    autoCapitalize: "none",
                    ref: postalRef,
                    onSubmit: () => cityRef.current?.focus(),
                  })}
                </View>
                <View style={{ flex: 2 }}>
                  {renderField("Ville", city, setCity, "city", {
                    placeholder: "Lyon",
                    required: true,
                    ref: cityRef,
                    returnKeyType: "done",
                    onSubmit: handleSave,
                  })}
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={s.privacy}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={brand.primary500}
            />
            <Text style={s.privacyTxt}>
              Vos données sont privées et chiffrées. Elles ne sont partagées
              qu&apos;avec les artisans avec qui vous avez un rendez-vous.
            </Text>
          </Animated.View>
        </ScrollView>

        <View style={s.ctaBar}>
          <Pressable
            style={({ pressed }) => [
              s.cta,
              submitting && s.ctaDisabled,
              pressed && !submitting && s.ctaP,
            ]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={brand.white} />
            ) : (
              <Text style={s.ctaTxt}>Enregistrer les modifications</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },
  flex: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  op: { opacity: 0.6 },
  hTitle: { ...T.lg, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },

  scroll: { padding: space.lg, paddingBottom: 100 },

  photoBlock: {
    alignItems: "center",
    gap: 12,
    marginBottom: space.xl,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    ...shadow.md,
  },
  avatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: brand.gray200,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 40, fontWeight: "700", color: brand.white },
  cameraBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: brand.gray50,
  },
  photoLink: {
    ...T.sm,
    fontWeight: "600",
    color: brand.primary500,
  },

  sectionTitle: {
    ...T.xs,
    fontWeight: "700",
    color: brand.gray500,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: space.sm,
    marginTop: space.md,
  },

  fields: {
    gap: space.md,
    marginBottom: space.lg,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow.sm,
  },
  row: { flexDirection: "row", gap: 12 },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  label: { ...T.sm, fontWeight: "600", color: brand.gray700 },
  required: { ...T.sm, color: brand.danger500 },
  input: {
    height: comp.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: brand.gray50,
    paddingHorizontal: 16,
    ...T.base,
    color: brand.gray900,
  },

  privacy: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: brand.primary50,
    padding: space.md,
    borderRadius: radius.md,
    marginTop: space.md,
  },
  privacyTxt: {
    flex: 1,
    ...T.xs,
    color: brand.primary700,
    lineHeight: 18,
  },

  ctaBar: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.gray100,
  },
  cta: {
    height: comp.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.lg,
  },
  ctaDisabled: { backgroundColor: brand.gray400 },
  ctaP: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaTxt: { ...T.base, fontWeight: "700", color: brand.white },
});
