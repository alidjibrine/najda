import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/contexts/AuthContext";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getMyProfile, uploadAvatar, type Profile } from "@/lib/api";
import {
  getMyProProfile,
  upsertMyProProfile,
  setMyRole,
  type ProProfile,
} from "@/lib/api-extras";
import { CATEGORIES } from "@/constants/categories";

const PRICE_OPTIONS = ["€", "€€", "€€€"];
const ZONE_OPTIONS = [5, 10, 15, 25, 50];

export default function ProProfileScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [editing, setEditing] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [zoneKm, setZoneKm] = useState(15);
  const [priceRange, setPriceRange] = useState("€€");
  const [yearsExp, setYearsExp] = useState("0");
  const [bio, setBio] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, pp] = await Promise.all([
        getMyProfile().catch(() => null),
        getMyProProfile().catch(() => null),
      ]);
      setProfile(p);
      setProProfile(pp);
      if (pp) {
        setCategoryId(pp.categoryId);
        setCategoryIds(
          Array.isArray(pp.categoryIds) && pp.categoryIds.length > 0
            ? pp.categoryIds
            : pp.categoryId
            ? [pp.categoryId]
            : [],
        );
        setCity(pp.city ?? "");
        setZoneKm(pp.zoneKm ?? 15);
        setPriceRange(pp.priceRange ?? "€€");
        setYearsExp(String(pp.yearsExp ?? 0));
        setBio(pp.bio ?? "");
        setServicesText(
          Array.isArray(pp.services) ? pp.services.join(", ") : "",
        );
      } else if (p?.city) {
        setCity(p.city);
      }
    } catch {
      // silent
    }
  }, []);

  // ============= Upload photo =============
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangePhoto = async () => {
    if (uploadingPhoto) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission requise",
          "Autorisez Najda à accéder à vos photos pour mettre à jour votre avatar.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploadingPhoto(true);
      const newUrl = await uploadAvatar(result.assets[0].uri);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: newUrl } : prev));
    } catch (err: unknown) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Impossible de mettre à jour la photo.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSwitchToClient = () => {
    Alert.alert(
      "Passer en mode Particulier ?",
      "Vous reviendrez à la recherche d'artisans, vos réservations et favoris. Vous pourrez revenir en mode Artisan à tout moment depuis votre profil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Basculer",
          onPress: async () => {
            try {
              await setMyRole("client");
              router.replace("/(app)/(tabs)");
            } catch (err: unknown) {
              Alert.alert(
                "Erreur",
                err instanceof Error ? err.message : "Erreur inconnue",
              );
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const services = servicesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const primary = categoryIds[0] ?? categoryId;
      const updated = await upsertMyProProfile({
        categoryId: primary,
        categoryIds,
        city: city.trim(),
        zoneKm,
        priceRange,
        bio: bio.trim(),
        services,
        yearsExp: parseInt(yearsExp, 10) || 0,
      });
      setProProfile(updated);
      setEditing(false);
      Alert.alert("Profil mis à jour", "Vos informations ont été enregistrées.");
    } catch (err: unknown) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Se déconnecter ?",
      "Vous devrez vous reconnecter pour retrouver votre compte.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: () => signOut() },
      ],
    );
  };

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Pro Najda";
  const initial = (profile?.firstName?.charAt(0) ?? "P").toUpperCase();
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {/* ============= HERO ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={s.heroTop}>
            <Text style={s.heroLabel}>Profil professionnel</Text>
            {!editing && (
              <Pressable
                onPress={() => setEditing(true)}
                hitSlop={10}
                style={s.editBtn}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={s.editBtnTxt}>Modifier</Text>
              </Pressable>
            )}
          </View>

          <View style={s.heroBody}>
            <Pressable
              onPress={handleChangePhoto}
              style={s.avatarWrap}
              hitSlop={6}
            >
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarTxt}>{initial}</Text>
                </View>
              )}
              <View style={s.cameraBadge}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#7C8FFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#7C8FFF" />
                )}
              </View>
            </Pressable>
            <Text style={s.name} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={s.email} numberOfLines={1}>
              {user?.email}
            </Text>
            {categoryIds.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 6,
                  paddingHorizontal: space.lg,
                  marginTop: 12,
                }}
                style={{
                  alignSelf: "stretch",
                  marginHorizontal: -space.lg,
                  flexGrow: 0,
                }}
              >
                {CATEGORIES.filter((c) => categoryIds.includes(c.id)).map(
                  (c, idx) => (
                    <View
                      key={c.id}
                      style={[
                        s.metierPill,
                        idx === 0 && {
                          backgroundColor: "rgba(255,255,255,0.32)",
                          borderColor: "rgba(255,255,255,0.55)",
                        },
                      ]}
                    >
                      <Ionicons name={c.icon} size={13} color="#FFFFFF" />
                      <Text style={s.metierPillTxt} numberOfLines={1}>
                        {c.name}
                      </Text>
                    </View>
                  ),
                )}
              </ScrollView>
            )}
          </View>
        </LinearGradient>

        {/* ============= FORM ============= */}
        <View style={s.content}>
          {/* ===== INFO GRID (mode lecture) ===== */}
          {!editing && (
            <Animated.View
              entering={FadeInDown.delay(60).duration(400)}
              style={s.infoGrid}
            >
              <InfoCard
                icon="location-outline"
                label="Ville"
                value={city || "Non définie"}
                t={t}
              />
              <InfoCard
                icon="navigate-outline"
                label="Rayon"
                value={`${zoneKm} km`}
                t={t}
              />
              <InfoCard
                icon="cash-outline"
                label="Tarifs"
                value={priceRange}
                t={t}
              />
              <InfoCard
                icon="ribbon-outline"
                label="Expérience"
                value={`${yearsExp} an${parseInt(yearsExp, 10) > 1 ? "s" : ""}`}
                t={t}
              />
            </Animated.View>
          )}

          {/* ===== MÉTIERS (mode lecture) — section dédiée ===== */}
          {!editing && categoryIds.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(40).duration(400)}
              style={s.metiersSection}
            >
              <View style={s.metiersHead}>
                <Text style={[s.metiersLabel, { color: t.textSecondary }]}>
                  Mes métiers
                </Text>
                <Text style={[s.metiersCount, { color: t.primary }]}>
                  {categoryIds.length} compétence
                  {categoryIds.length > 1 ? "s" : ""}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.metiersRow}
              >
                {CATEGORIES.filter((c) => categoryIds.includes(c.id)).map(
                  (c, idx) => (
                    <View key={c.id} style={s.metierBigCard}>
                      <LinearGradient
                        colors={
                          najdaGradient as unknown as [
                            string,
                            string,
                            ...string[],
                          ]
                        }
                        start={najdaGradientDirection.start}
                        end={najdaGradientDirection.end}
                        style={s.metierBigIcon}
                      >
                        <Ionicons name={c.icon} size={22} color="#FFFFFF" />
                      </LinearGradient>
                      <Text
                        style={[s.metierBigName, { color: t.text }]}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                      {idx === 0 && (
                        <View
                          style={[
                            s.metierBigBadge,
                            { backgroundColor: t.primaryMuted },
                          ]}
                        >
                          <Ionicons
                            name="star"
                            size={9}
                            color={t.primary}
                          />
                          <Text
                            style={[
                              s.metierBigBadgeTxt,
                              { color: t.primary },
                            ]}
                          >
                            Principal
                          </Text>
                        </View>
                      )}
                    </View>
                  ),
                )}
              </ScrollView>
            </Animated.View>
          )}

          {/* Métiers (édition multi-select) */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(80).duration(400)}
              style={s.block}
            >
              <Text style={[s.blockLabel, { color: t.textSecondary }]}>
                Vos métiers ({categoryIds.length} sélectionné
                {categoryIds.length > 1 ? "s" : ""})
              </Text>
              <Text style={[s.hint, { color: t.textTertiary }]}>
                Cochez tous vos métiers. Le 1er sera votre métier principal.
              </Text>
              <View style={s.catGrid}>
                {CATEGORIES.map((c) => {
                  const active = categoryIds.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        if (active) {
                          const next = categoryIds.filter((id) => id !== c.id);
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
                          borderColor: active ? t.primary : t.border,
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
                          size={12}
                          color="#FFFFFF"
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Ville (édition) */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
              style={s.block}
            >
              <Text style={[s.blockLabel, { color: t.textSecondary }]}>
                Ville d&apos;intervention
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ex : Strasbourg"
                placeholderTextColor={t.textTertiary}
                style={[
                  s.input,
                  {
                    backgroundColor: t.surfaceMuted,
                    borderColor: t.border,
                    color: t.text,
                  },
                ]}
              />
            </Animated.View>
          )}

          {/* Zone d'intervention (édition) */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(160).duration(400)}
              style={s.block}
            >
              <Text style={[s.blockLabel, { color: t.textSecondary }]}>
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
                          backgroundColor: active ? t.primary : t.surfaceMuted,
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
            </Animated.View>
          )}

          {/* Tarif (édition) */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={s.block}
            >
              <Text style={[s.blockLabel, { color: t.textSecondary }]}>
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
                          backgroundColor: active ? t.primary : t.surfaceMuted,
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
            </Animated.View>
          )}

          {/* Expérience (édition) */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(240).duration(400)}
              style={s.block}
            >
              <Text style={[s.blockLabel, { color: t.textSecondary }]}>
                Années d&apos;expérience
              </Text>
              <TextInput
                value={yearsExp}
                onChangeText={(v) => setYearsExp(v.replace(/[^0-9]/g, ""))}
                placeholder="0"
                placeholderTextColor={t.textTertiary}
                keyboardType="number-pad"
                style={[
                  s.input,
                  {
                    backgroundColor: t.surfaceMuted,
                    borderColor: t.border,
                    color: t.text,
                  },
                ]}
              />
            </Animated.View>
          )}

          {/* Services */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(400)}
            style={s.block}
          >
            <Text style={[s.blockLabel, { color: t.textSecondary }]}>
              Services proposés
            </Text>
            {editing ? (
              <>
                <TextInput
                  value={servicesText}
                  onChangeText={setServicesText}
                  placeholder="Ex : Fuite d'eau, Débouchage, Chauffe-eau"
                  placeholderTextColor={t.textTertiary}
                  multiline
                  style={[
                    s.textarea,
                    {
                      backgroundColor: t.surfaceMuted,
                      borderColor: t.border,
                      color: t.text,
                    },
                  ]}
                />
                <Text style={[s.hint, { color: t.textTertiary }]}>
                  Séparez chaque service par une virgule
                </Text>
              </>
            ) : servicesText.trim() ? (
              <View style={s.chipsWrap}>
                {servicesText.split(",").map((svc) => svc.trim()).filter(Boolean).map((svc) => (
                  <View
                    key={svc}
                    style={[
                      s.chip,
                      { backgroundColor: t.primaryMuted },
                    ]}
                  >
                    <Text style={[s.chipTxt, { color: t.primary }]}>{svc}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[s.blockValue, { color: t.textTertiary }]}>
                Aucun service défini
              </Text>
            )}
          </Animated.View>

          {/* Bio */}
          <Animated.View
            entering={FadeInDown.delay(320).duration(400)}
            style={s.block}
          >
            <Text style={[s.blockLabel, { color: t.textSecondary }]}>
              Présentation
            </Text>
            {editing ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Décrivez votre activité, votre savoir-faire…"
                placeholderTextColor={t.textTertiary}
                multiline
                maxLength={500}
                style={[
                  s.textarea,
                  {
                    backgroundColor: t.surfaceMuted,
                    borderColor: t.border,
                    color: t.text,
                    minHeight: 100,
                  },
                ]}
              />
            ) : (
              <Text style={[s.bioTxt, { color: t.text }]}>
                {bio || "Aucune présentation pour l'instant."}
              </Text>
            )}
          </Animated.View>

          {/* CTA save */}
          {editing && (
            <Animated.View
              entering={FadeInDown.delay(360).duration(400)}
              style={{ marginTop: 8 }}
            >
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  s.saveWrap,
                  saving && { opacity: 0.6 },
                  pressed && !saving && s.ctaPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    najdaGradient as unknown as [string, string, ...string[]]
                  }
                  start={najdaGradientDirection.start}
                  end={najdaGradientDirection.end}
                  style={s.save}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={s.saveTxt}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditing(false);
                  load();
                }}
                style={s.cancelBtn}
              >
                <Text style={[s.cancelTxt, { color: t.textSecondary }]}>
                  Annuler
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Section infos personnelles */}
          {!editing && (
            <>
              <Pressable
                onPress={() => router.push("/(app)/profile-edit")}
                style={({ pressed }) => [
                  s.linkRow,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    s.linkIcon,
                    { backgroundColor: t.primaryMuted },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={t.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.linkLabel, { color: t.text }]}>
                    Mes informations personnelles
                  </Text>
                  <Text
                    style={[s.linkSub, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    Nom, photo, contact, adresse
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={t.textTertiary}
                />
              </Pressable>

              {/* Mode Particulier */}
              <Pressable
                onPress={handleSwitchToClient}
                style={({ pressed }) => [
                  s.linkRow,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[s.linkIcon, { backgroundColor: t.primaryMuted }]}
                >
                  <Ionicons name="swap-horizontal" size={18} color={t.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.linkLabel, { color: t.text }]}>
                    Passer en mode Particulier
                  </Text>
                  <Text
                    style={[s.linkSub, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    Pour chercher un artisan vous-même
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={t.textTertiary}
                />
              </Pressable>

              {/* Logout — toujours visible avec icône */}
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  s.logoutBtn,
                  { backgroundColor: t.surface, borderColor: t.danger },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color={t.danger} />
                <Text style={[s.logoutTxt, { color: t.danger }]}>
                  Se déconnecter
                </Text>
              </Pressable>
            </>
          )}

          <Text style={[s.version, { color: t.textTertiary }]}>
            Najda Pro · v1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// Info card (mode lecture)
// =====================================================
function InfoCard({
  icon,
  label,
  value,
  t,
  wide,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        s.infoCard,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          width: wide ? "100%" : "48.5%",
        },
      ]}
    >
      <View style={[s.infoIcon, { backgroundColor: t.primaryMuted }]}>
        <Ionicons name={icon} size={16} color={t.primary} />
      </View>
      <Text style={[s.infoLabel, { color: t.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[s.infoValue, { color: t.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // ===== HERO =====
  hero: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: radius.full,
  },
  editBtnTxt: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },

  heroBody: { alignItems: "center" },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2.5,
    borderColor: "#7C8FFF",
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  avatarTxt: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  email: { fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 2 },
  metierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  metierPillTxt: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // ===== CONTENT =====
  content: { paddingHorizontal: space.lg, paddingTop: space.md, gap: 14 },

  // ===== INFO GRID (mode lecture) =====
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  infoCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  block: { gap: 8 },
  blockLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  blockValue: { fontSize: 15, fontWeight: "700" },

  input: {
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textarea: {
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 70,
    textAlignVertical: "top",
  },
  hint: { fontSize: 11, fontWeight: "500", marginTop: -4 },

  catRow: { gap: 6, paddingVertical: 4 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },

  metiersSection: { gap: 10, marginBottom: 4 },
  metiersHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metiersLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metiersCount: { fontSize: 11, fontWeight: "800" },
  metiersRow: { gap: 10, paddingVertical: 2 },
  metierBigCard: {
    width: 110,
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(124,143,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(124,143,255,0.15)",
  },
  metierBigIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  metierBigName: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  metierBigBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  metierBigBadgeTxt: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  catPillTxt: { fontSize: 12, fontWeight: "700" },

  optionsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionPillTxt: { fontSize: 13, fontWeight: "800" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chipTxt: { fontSize: 12, fontWeight: "700" },

  bioTxt: { fontSize: 14, lineHeight: 21, fontWeight: "500" },

  saveWrap: { borderRadius: 16, ...shadow.lg },
  save: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  saveTxt: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelTxt: { fontSize: 13, fontWeight: "700" },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  linkLabel: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  linkSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  logoutBtn: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutTxt: { fontSize: 14, fontWeight: "800" },

  version: { fontSize: 11, textAlign: "center", paddingVertical: space.md },

  pressed: { opacity: 0.85 },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
