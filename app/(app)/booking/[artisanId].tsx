import { useMemo, useState } from "react";
import {
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import { ARTISANS } from "@/constants/mockData";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

// Marque quelques créneaux comme indisponibles pour le réalisme
const UNAVAILABLE_SLOTS = new Set(["09:00", "12:00", "15:00", "19:00"]);

function getNext7Days(): { date: Date; key: string }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({ date: d, key: d.toISOString().split("T")[0] });
  }
  return days;
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_NAMES = [
  "janv.", "févr.", "mars", "avril", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export default function BookingScreen() {
  const router = useRouter();
  const { artisanId } = useLocalSearchParams<{ artisanId: string }>();
  const artisan = useMemo(
    () => ARTISANS.find((a) => a.id === artisanId),
    [artisanId],
  );

  const days = useMemo(() => getNext7Days(), []);
  const [selectedDay, setSelectedDay] = useState<string>(days[0].key);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(
    artisan?.services[0] ?? null,
  );
  const [description, setDescription] = useState("");

  if (!artisan) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.notFound}>Artisan introuvable</Text>
      </SafeAreaView>
    );
  }

  const canConfirm = !!selectedSlot && !!selectedService;

  const handleConfirm = () => {
    if (!canConfirm) return;

    const day = days.find((d) => d.key === selectedDay);
    if (!day) return;

    const dayLabel = `${DAY_NAMES[day.date.getDay()]} ${day.date.getDate()} ${MONTH_NAMES[day.date.getMonth()]}`;

    Alert.alert(
      "Confirmer le rendez-vous ?",
      `${artisan.firstName} ${artisan.lastName}\n${selectedService}\n${dayLabel} à ${selectedSlot}\n\nUn acompte de 20 € sera prélevé.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => {
            Alert.alert(
              "Réservé !",
              "Votre demande a été envoyée. Vous recevrez une confirmation sous peu.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.dismissAll();
                    router.replace("/(app)/(tabs)/bookings");
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.hBtn, pressed && s.op]}
          onPress={() => router.back()}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>
        <Text style={s.hTitle}>Réservation</Text>
        <View style={s.hBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Carte artisan */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.artCard}>
          <View style={s.artAvatar}>
            <Text style={s.artAvatarTxt}>{artisan.initials}</Text>
          </View>
          <View style={s.artInfo}>
            <Text style={s.artName}>
              {artisan.firstName} {artisan.lastName}
            </Text>
            <View style={s.artMeta}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={s.artMetaTxt}>
                {artisan.rating} · {artisan.reviewCount} avis
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Service */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Text style={s.secTitle}>Quel service ?</Text>
          <View style={s.svcWrap}>
            {artisan.services.map((svc) => (
              <Pressable
                key={svc}
                style={[
                  s.svcChip,
                  selectedService === svc && s.svcChipActive,
                ]}
                onPress={() => setSelectedService(svc)}
              >
                <Text
                  style={[
                    s.svcTxt,
                    selectedService === svc && s.svcTxtActive,
                  ]}
                >
                  {svc}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Jour */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <Text style={s.secTitle}>Choisissez une date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.daysRow}
          >
            {days.map(({ date, key }, idx) => {
              const active = selectedDay === key;
              return (
                <Pressable
                  key={key}
                  style={[s.dayCard, active && s.dayCardActive]}
                  onPress={() => {
                    setSelectedDay(key);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[s.dayName, active && s.dayNameActive]}>
                    {idx === 0 ? "Auj." : DAY_NAMES[date.getDay()]}
                  </Text>
                  <Text style={[s.dayNum, active && s.dayNumActive]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[s.dayMonth, active && s.dayMonthActive]}>
                    {MONTH_NAMES[date.getMonth()]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Créneau */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <Text style={s.secTitle}>Choisissez un créneau</Text>
          <View style={s.slotGrid}>
            {TIME_SLOTS.map((slot) => {
              const unavailable = UNAVAILABLE_SLOTS.has(slot);
              const active = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[
                    s.slot,
                    unavailable && s.slotUnav,
                    active && s.slotActive,
                  ]}
                  onPress={() => !unavailable && setSelectedSlot(slot)}
                  disabled={unavailable}
                >
                  <Text
                    style={[
                      s.slotTxt,
                      unavailable && s.slotTxtUnav,
                      active && s.slotTxtActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={s.secTitle}>Décrivez votre besoin</Text>
          <View style={s.textBox}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Précisez la nature de l'intervention (optionnel)"
              placeholderTextColor={brand.gray400}
              multiline
              numberOfLines={4}
              style={s.textInput}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        {/* Récap */}
        <Animated.View
          entering={FadeInDown.delay(360).duration(400)}
          style={s.recapCard}
        >
          <View style={s.recapRow}>
            <Text style={s.recapLabel}>Fourchette indicative</Text>
            <Text style={s.recapValue}>{artisan.priceRange}</Text>
          </View>
          <View style={s.recapRow}>
            <Text style={s.recapLabel}>Acompte à la réservation</Text>
            <Text style={s.recapValue}>20 €</Text>
          </View>
          <View style={[s.recapRow, s.recapInfo]}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={brand.primary500}
            />
            <Text style={s.recapInfoTxt}>
              L&apos;acompte est remboursé en cas d&apos;annulation 24h avant.
            </Text>
          </View>
        </Animated.View>

        <View style={s.spacer} />
      </ScrollView>

      {/* CTA fixe */}
      <View style={s.ctaBar}>
        <Pressable
          style={({ pressed }) => [
            s.ctaBtn,
            !canConfirm && s.ctaBtnDisabled,
            pressed && canConfirm && s.ctaP,
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
        >
          <Text style={s.ctaTxt}>
            {canConfirm
              ? "Confirmer la réservation"
              : "Sélectionnez un créneau"}
          </Text>
          {canConfirm && (
            <Ionicons name="arrow-forward" size={20} color={brand.white} />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },
  notFound: { ...T.base, color: brand.gray500, textAlign: "center", marginTop: 100 },

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
  hBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  op: { opacity: 0.6 },
  hTitle: { ...T.lg, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },

  scroll: { padding: space.lg },

  artCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.xl,
    ...shadow.sm,
  },
  artAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  artAvatarTxt: { fontSize: 16, fontWeight: "700", color: brand.white },
  artInfo: { flex: 1, gap: 4 },
  artName: { ...T.base, fontWeight: "700", color: brand.gray900 },
  artMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  artMetaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },

  secTitle: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.2,
    marginBottom: space.md,
  },

  svcWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space.xl,
  },
  svcChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  svcChipActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  svcTxt: { ...T.sm, fontWeight: "600", color: brand.gray700 },
  svcTxtActive: { color: brand.white },

  daysRow: { gap: 10, paddingBottom: 4, marginBottom: space.xl },
  dayCard: {
    width: 64,
    paddingVertical: 12,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  dayCardActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  dayName: { ...T.xs, fontWeight: "600", color: brand.gray500 },
  dayNameActive: { color: "rgba(255,255,255,0.85)" },
  dayNum: { fontSize: 22, fontWeight: "700", color: brand.gray900 },
  dayNumActive: { color: brand.white },
  dayMonth: { ...T.xs, color: brand.gray500 },
  dayMonthActive: { color: "rgba(255,255,255,0.85)" },

  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space.xl,
  },
  slot: {
    flexBasis: "23%",
    flexGrow: 1,
    paddingVertical: 12,
    backgroundColor: brand.white,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: brand.gray200,
  },
  slotActive: {
    backgroundColor: brand.primary500,
    borderColor: brand.primary500,
  },
  slotUnav: {
    backgroundColor: brand.gray50,
    borderColor: brand.gray100,
  },
  slotTxt: { ...T.sm, fontWeight: "600", color: brand.gray800 },
  slotTxtActive: { color: brand.white },
  slotTxtUnav: { color: brand.gray300, textDecorationLine: "line-through" },

  textBox: {
    backgroundColor: brand.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brand.gray200,
    padding: space.md,
    marginBottom: space.xl,
    minHeight: 100,
  },
  textInput: {
    ...T.base,
    color: brand.gray900,
    minHeight: 80,
  },

  recapCard: {
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
    ...shadow.sm,
    gap: 12,
  },
  recapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recapLabel: { ...T.sm, color: brand.gray600 },
  recapValue: { ...T.base, fontWeight: "700", color: brand.gray900 },
  recapInfo: {
    gap: 8,
    backgroundColor: brand.primary50,
    padding: 10,
    borderRadius: radius.sm,
    justifyContent: "flex-start",
  },
  recapInfoTxt: {
    ...T.xs,
    color: brand.primary700,
    flex: 1,
    lineHeight: 16,
  },

  spacer: { height: 100 },

  ctaBar: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.gray100,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    backgroundColor: brand.primary500,
    borderRadius: radius.md,
    ...shadow.lg,
  },
  ctaBtnDisabled: { backgroundColor: brand.gray300 },
  ctaP: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaTxt: { ...T.base, fontWeight: "700", color: brand.white },
});
