import { useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeOutUp } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getArtisan, createBooking, type Artisan } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { DEFAULT_DURATION_MIN, DURATION_OPTIONS } from "@/constants/categories";

function addMinutesToSlot(slot: string, minutes: number): string {
  const [h, m] = slot.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  if (m === 30) return `${h}h30`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];
const UNAVAILABLE_SLOTS = new Set(["09:00", "12:00", "15:00", "19:00"]);

const DAY_NAMES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_NAMES = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function getNext7Days(): { date: Date; key: string }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({ date: d, key: d.toISOString().split("T")[0] });
  }
  return days;
}

type Step = 1 | 2 | 3 | 4;

export default function BookingScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { artisanId } = useLocalSearchParams<{ artisanId: string }>();

  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => getNext7Days(), []);
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(days[0].key);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [durationMin, setDurationMin] = useState<number>(90);
  const [description, setDescription] = useState("");

  useEffect(() => {
    let mounted = true;
    getArtisan(artisanId)
      .then((a) => {
        if (!mounted) return;
        setArtisan(a);
        // Pré-remplir la durée par défaut selon la catégorie
        if (a?.categoryId && DEFAULT_DURATION_MIN[a.categoryId]) {
          setDurationMin(DEFAULT_DURATION_MIN[a.categoryId]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [artisanId]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!artisan) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <Text style={[s.notFound, { color: t.text }]}>Artisan introuvable</Text>
      </SafeAreaView>
    );
  }

  const goNext = () => {
    if (step === 1 && !selectedService) return;
    if (step === 2 && !selectedSlot) return;
    if (step < 4) setStep((step + 1) as Step);
  };

  const goPrev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedService) return;
    setSubmitting(true);
    try {
      await createBooking({
        artisanId: artisan.id,
        service: selectedService,
        bookingDate: selectedDay,
        bookingTime: selectedSlot,
        description: description.trim() || undefined,
        priceEstimate: artisan.priceRange,
        acompte: 20,
      });
      Alert.alert(
        "Réservation confirmée",
        "Vous recevrez une notification dès que l'artisan accepte.",
        [
          {
            text: "Voir mes rendez-vous",
            onPress: () => {
              router.dismissAll();
              router.replace("/(app)/(tabs)/bookings");
            },
          },
        ],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Can advance
  const canNext =
    (step === 1 && !!selectedService) ||
    (step === 2 && !!selectedSlot) ||
    step === 3 ||
    step === 4;

  const selectedDayObj = days.find((d) => d.key === selectedDay);
  const formattedDay = selectedDayObj
    ? `${DAY_NAMES[selectedDayObj.date.getDay()]} ${selectedDayObj.date.getDate()} ${MONTH_NAMES[selectedDayObj.date.getMonth()]}`
    : "";

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={s.safe} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* ============= HEADER ============= */}
          <View style={s.header}>
            <Pressable
              onPress={step === 1 ? () => router.back() : goPrev}
              hitSlop={12}
              style={({ pressed }) => [
                s.backBtn,
                { backgroundColor: t.surfaceMuted, borderColor: t.border },
                pressed && s.pressed,
              ]}
            >
              <Ionicons
                name={step === 1 ? "close" : "arrow-back"}
                size={20}
                color={t.text}
              />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={[s.headerStep, { color: t.textSecondary }]}>
                Étape {step}/4
              </Text>
              <Text style={[s.headerTitle, { color: t.text }]}>
                {step === 1 && "Quel service ?"}
                {step === 2 && "Quand ?"}
                {step === 3 && "Décrivez votre besoin"}
                {step === 4 && "Confirmer"}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* ============= PROGRESS BAR ============= */}
          <View style={[s.progressTrack, { backgroundColor: t.surfaceMuted }]}>
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={[s.progressFill, { width: `${(step / 4) * 100}%` }]}
            />
          </View>

          {/* ============= ARTISAN PILL ============= */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={[
              s.artisanPill,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <Avatar
              uri={artisan.avatarUrl}
              initials={artisan.initials}
              size={36}
            />
            <View style={{ flex: 1 }}>
              <View style={s.artisanNameRow}>
                <Text
                  style={[s.artisanName, { color: t.text }]}
                  numberOfLines={1}
                >
                  {artisan.firstName} {artisan.lastName}
                </Text>
                {artisan.verified && (
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={t.primary}
                  />
                )}
              </View>
              <View style={s.artisanMeta}>
                <Ionicons name="star" size={10} color="#C9A961" />
                <Text style={[s.artisanRating, { color: t.text }]}>
                  {artisan.rating.toFixed(1)}
                </Text>
                <Text style={[s.artisanSub, { color: t.textSecondary }]}>
                  · {artisan.priceRange}
                  {artisan.city ? ` · ${artisan.city}` : ""}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ============= STEP CONTENT ============= */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.scroll,
              { paddingBottom: 140 + insets.bottom },
            ]}
          >
            {step === 1 && (
              <Animated.View
                key="step1"
                entering={FadeInDown.duration(350)}
                exiting={FadeOutUp.duration(200)}
              >
                <Text style={[s.stepIntro, { color: t.textSecondary }]}>
                  Sélectionnez la prestation que vous souhaitez réserver.
                </Text>
                <View style={s.serviceList}>
                  {artisan.services.map((svc) => {
                    const active = selectedService === svc;
                    return (
                      <Pressable
                        key={svc}
                        onPress={() => setSelectedService(svc)}
                        style={({ pressed }) => [
                          s.serviceItem,
                          {
                            backgroundColor: active ? t.primaryMuted : t.surface,
                            borderColor: active ? t.primary : t.border,
                            borderWidth: active ? 2 : 1,
                          },
                          pressed && s.pressed,
                        ]}
                      >
                        <View
                          style={[
                            s.serviceCheck,
                            {
                              backgroundColor: active
                                ? t.primary
                                : t.surfaceMuted,
                              borderColor: active ? t.primary : t.borderStrong,
                            },
                          ]}
                        >
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            s.serviceLabel,
                            {
                              color: active ? t.primary : t.text,
                              fontWeight: active ? "800" : "600",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {svc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View
                key="step2"
                entering={FadeInDown.duration(350)}
                exiting={FadeOutUp.duration(200)}
              >
                <Text style={[s.stepIntro, { color: t.textSecondary }]}>
                  Choisissez d&apos;abord le jour, puis l&apos;heure.
                </Text>

                {/* Days */}
                <Text style={[s.subLabel, { color: t.textSecondary }]}>
                  Jour
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.daysRow}
                >
                  {days.map((day, idx) => {
                    const active = selectedDay === day.key;
                    return (
                      <Pressable
                        key={day.key}
                        onPress={() => setSelectedDay(day.key)}
                        style={({ pressed }) => [
                          s.dayCard,
                          {
                            backgroundColor: active ? t.primary : t.surface,
                            borderColor: active ? t.primary : t.border,
                          },
                          pressed && s.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            s.dayLabel,
                            {
                              color: active
                                ? "rgba(255,255,255,0.85)"
                                : t.textSecondary,
                            },
                          ]}
                        >
                          {idx === 0 ? "Auj." : DAY_NAMES[day.date.getDay()]}
                        </Text>
                        <Text
                          style={[
                            s.dayNum,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {day.date.getDate()}
                        </Text>
                        <Text
                          style={[
                            s.dayMonth,
                            {
                              color: active
                                ? "rgba(255,255,255,0.85)"
                                : t.textSecondary,
                            },
                          ]}
                        >
                          {MONTH_NAMES[day.date.getMonth()]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Heure de début */}
                <Text
                  style={[
                    s.subLabel,
                    { color: t.textSecondary, marginTop: space.lg },
                  ]}
                >
                  Heure de début
                </Text>
                <View style={s.slotsGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const unavailable = UNAVAILABLE_SLOTS.has(slot);
                    const active = selectedSlot === slot;
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => !unavailable && setSelectedSlot(slot)}
                        disabled={unavailable}
                        style={({ pressed }) => [
                          s.slotChip,
                          {
                            backgroundColor: active
                              ? t.primary
                              : unavailable
                                ? t.surfaceMuted
                                : t.surface,
                            borderColor: active
                              ? t.primary
                              : unavailable
                                ? t.border
                                : t.borderStrong,
                            opacity: unavailable ? 0.5 : 1,
                          },
                          pressed && !unavailable && s.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            s.slotTxt,
                            {
                              color: active
                                ? "#FFFFFF"
                                : unavailable
                                  ? t.textTertiary
                                  : t.text,
                            },
                          ]}
                        >
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Durée estimée */}
                <Text
                  style={[
                    s.subLabel,
                    { color: t.textSecondary, marginTop: space.lg },
                  ]}
                >
                  Durée estimée
                </Text>
                <Text
                  style={[s.durationHint, { color: t.textTertiary }]}
                >
                  Estimation moyenne pour ce métier — l&apos;artisan
                  l&apos;ajustera après diagnostic si besoin.
                </Text>
                <View style={s.durationGrid}>
                  {DURATION_OPTIONS.map((opt) => {
                    const active = durationMin === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setDurationMin(opt.value)}
                        style={({ pressed }) => [
                          s.durationChip,
                          {
                            backgroundColor: active
                              ? t.primary
                              : t.surface,
                            borderColor: active
                              ? t.primary
                              : t.borderStrong,
                          },
                          pressed && s.pressed,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            s.durationTxt,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Aperçu créneau */}
                {selectedSlot && (
                  <View
                    style={[
                      s.slotPreview,
                      { backgroundColor: t.primaryMuted },
                    ]}
                  >
                    <Ionicons name="time" size={18} color={t.primary} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[s.slotPreviewLabel, { color: t.primary }]}
                      >
                        Votre créneau
                      </Text>
                      <Text style={[s.slotPreviewVal, { color: t.text }]}>
                        {selectedSlot} → {addMinutesToSlot(selectedSlot, durationMin)}
                        <Text
                          style={[
                            s.slotPreviewDur,
                            { color: t.textSecondary },
                          ]}
                        >
                          {"  "}· {formatDuration(durationMin)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {step === 3 && (
              <Animated.View
                key="step3"
                entering={FadeInDown.duration(350)}
                exiting={FadeOutUp.duration(200)}
              >
                <Text style={[s.stepIntro, { color: t.textSecondary }]}>
                  Soyez précis : plus le pro a d&apos;infos, plus son devis est
                  juste.
                </Text>
                <View
                  style={[
                    s.textareaWrap,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Ex : fuite sous l'évier de la cuisine depuis hier, l'eau coule en goutte-à-goutte…"
                    placeholderTextColor={t.textTertiary}
                    multiline
                    maxLength={500}
                    style={[s.textarea, { color: t.text }]}
                    autoFocus
                  />
                  <Text style={[s.charCount, { color: t.textTertiary }]}>
                    {description.length}/500
                  </Text>
                </View>

                <View
                  style={[
                    s.hintCard,
                    { backgroundColor: t.primaryMuted },
                  ]}
                >
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={t.primary}
                  />
                  <Text style={[s.hintTxt, { color: t.primary }]}>
                    Cette étape est facultative — vous pourrez détailler par
                    message après la réservation.
                  </Text>
                </View>
              </Animated.View>
            )}

            {step === 4 && (
              <Animated.View
                key="step4"
                entering={FadeInDown.duration(350)}
                exiting={FadeOutUp.duration(200)}
              >
                <Text style={[s.stepIntro, { color: t.textSecondary }]}>
                  Vérifiez les détails avant de confirmer.
                </Text>

                <View
                  style={[
                    s.summaryCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  <SummaryRow
                    icon="construct-outline"
                    label="Service"
                    value={selectedService ?? ""}
                    t={t}
                  />
                  <View
                    style={[s.summaryDivider, { backgroundColor: t.border }]}
                  />
                  <SummaryRow
                    icon="calendar-outline"
                    label="Jour"
                    value={formattedDay}
                    t={t}
                  />
                  <View
                    style={[s.summaryDivider, { backgroundColor: t.border }]}
                  />
                  <SummaryRow
                    icon="time-outline"
                    label="Créneau"
                    value={
                      selectedSlot
                        ? `${selectedSlot} → ${addMinutesToSlot(selectedSlot, durationMin)} · ${formatDuration(durationMin)}`
                        : ""
                    }
                    t={t}
                  />
                  <View
                    style={[s.summaryDivider, { backgroundColor: t.border }]}
                  />
                  <SummaryRow
                    icon="pricetag-outline"
                    label="Tarif estimé"
                    value={`${artisan.priceRange} · ${formatDuration(durationMin)}`}
                    t={t}
                  />
                  {description.trim() && (
                    <>
                      <View
                        style={[
                          s.summaryDivider,
                          { backgroundColor: t.border },
                        ]}
                      />
                      <View style={s.summaryRow}>
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color={t.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.summaryLabel,
                              { color: t.textSecondary },
                            ]}
                          >
                            Description
                          </Text>
                          <Text
                            style={[s.summaryValueWrap, { color: t.text }]}
                            numberOfLines={3}
                          >
                            {description.trim()}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Note durée modifiable */}
                <View
                  style={[
                    s.recapNote,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                >
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={t.textSecondary}
                  />
                  <Text style={[s.recapNoteTxt, { color: t.textSecondary }]}>
                    L&apos;artisan peut ajuster la durée et le tarif final
                    après diagnostic sur place.
                  </Text>
                </View>

                <View
                  style={[
                    s.acompteBox,
                    { backgroundColor: t.primaryMuted },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={t.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.acompteLabel, { color: t.primary }]}>
                      Acompte de 20 € TTC
                    </Text>
                    <Text style={[s.acompteSub, { color: t.text }]}>
                      Remboursé si annulation 24h avant le RDV.
                    </Text>
                  </View>
                </View>
              </Animated.View>
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
            {step < 4 ? (
              <Pressable
                onPress={goNext}
                disabled={!canNext}
                style={({ pressed }) => [
                  s.nextWrap,
                  !canNext && { opacity: 0.5 },
                  pressed && canNext && s.ctaPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    najdaGradient as unknown as [string, string, ...string[]]
                  }
                  start={najdaGradientDirection.start}
                  end={najdaGradientDirection.end}
                  style={s.next}
                >
                  <Text style={s.nextTxt}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleConfirm}
                disabled={submitting}
                style={({ pressed }) => [
                  s.nextWrap,
                  submitting && { opacity: 0.65 },
                  pressed && !submitting && s.ctaPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    najdaGradient as unknown as [string, string, ...string[]]
                  }
                  start={najdaGradientDirection.start}
                  end={najdaGradientDirection.end}
                  style={s.next}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={s.nextTxt}>Confirmer la réservation</Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// =====================================================
// Summary row
// =====================================================
function SummaryRow({
  icon,
  label,
  value,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={s.summaryRow}>
      <Ionicons name={icon} size={18} color={t.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[s.summaryLabel, { color: t.textSecondary }]}>
          {label}
        </Text>
        <Text style={[s.summaryValue, { color: t.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { ...T.base, textAlign: "center", marginTop: 100 },

  // ============= HEADER =============
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerStep: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  // ============= PROGRESS =============
  progressTrack: {
    marginHorizontal: space.lg,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: space.md,
  },
  progressFill: { height: "100%", borderRadius: 2 },

  // ============= ARTISAN PILL =============
  artisanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: space.lg,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: space.md,
  },
  artisanNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  artisanName: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  artisanMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  artisanRating: { fontSize: 11, fontWeight: "700" },
  artisanSub: { fontSize: 11, fontWeight: "500" },

  // ============= SCROLL =============
  scroll: {
    paddingHorizontal: space.lg,
  },
  stepIntro: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    marginBottom: space.md,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ============= STEP 1 SERVICES =============
  serviceList: { gap: 8 },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  serviceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceLabel: { fontSize: 14, letterSpacing: -0.2, flex: 1 },

  // ============= STEP 2 DAYS / SLOTS =============
  daysRow: { gap: 8, paddingRight: space.lg },
  dayCard: {
    width: 64,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  dayNum: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  dayMonth: { fontSize: 10, fontWeight: "500" },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    width: "23%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slotTxt: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },

  // Durée
  durationHint: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: -4,
    marginBottom: 10,
  },
  durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: {
    flexBasis: "31%",
    flexGrow: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationTxt: { fontSize: 13, fontWeight: "700", letterSpacing: -0.1 },

  // Slot preview
  slotPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginTop: space.lg,
  },
  slotPreviewLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  slotPreviewVal: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  slotPreviewDur: { fontSize: 12, fontWeight: "600", letterSpacing: 0 },

  // ============= STEP 3 TEXTAREA =============
  textareaWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 140,
  },
  textarea: {
    fontSize: 14,
    fontWeight: "500",
    minHeight: 100,
    textAlignVertical: "top",
    padding: 0,
  },
  charCount: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "right",
    marginTop: 4,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: space.md,
  },
  hintTxt: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },

  // ============= STEP 4 SUMMARY =============
  summaryCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: space.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryValue: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  summaryValueWrap: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },
  summaryDivider: { height: 0.5 },

  acompteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  acompteLabel: { fontSize: 13, fontWeight: "800" },
  acompteSub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  recapNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  recapNoteTxt: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    lineHeight: 17,
  },

  // ============= BOTTOM BAR =============
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  nextWrap: { borderRadius: 16, ...shadow.lg },
  next: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  nextTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
