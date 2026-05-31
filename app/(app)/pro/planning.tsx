import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/contexts/AuthContext";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getProAvailability,
  setMyAvailability,
  type AvailabilitySlot,
} from "@/lib/api-extras";

// ===== Constantes =====
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_LABELS_LONG = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
// 0 = dimanche dans JS, on affiche Lundi en premier
const DAY_API = [1, 2, 3, 4, 5, 6, 0];

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00",
  "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

interface DayState {
  active: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_DAY: DayState = {
  active: true,
  startTime: "09:00",
  endTime: "18:00",
};

const DEFAULT_OFF: DayState = {
  active: false,
  startTime: "09:00",
  endTime: "18:00",
};

export default function ProPlanningScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Lun=0 … Dim=6
  const [days, setDays] = useState<DayState[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [picking, setPicking] = useState<{
    dayIdx: number;
    kind: "start" | "end";
  } | null>(null);

  // ============= Chargement =============
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const slots = await getProAvailability(user.id);
      const next = Array.from({ length: 7 }, () => ({ ...DEFAULT_OFF }));
      const safeSlots = Array.isArray(slots) ? slots : [];
      safeSlots.forEach((slot: AvailabilitySlot) => {
        const idx = DAY_API.indexOf(slot.dayOfWeek);
        if (idx >= 0) {
          next[idx] = {
            active: true,
            startTime: (slot.startTime ?? "09:00").slice(0, 5),
            endTime: (slot.endTime ?? "18:00").slice(0, 5),
          };
        }
      });
      setDays(next);
      setDirty(false);
    } catch {
      // On garde les valeurs par défaut
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // ============= Actions =============
  const toggleDay = (idx: number) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, active: !d.active } : d)),
    );
    setDirty(true);
  };

  const setDayTime = (idx: number, kind: "start" | "end", time: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === idx
          ? { ...d, [kind === "start" ? "startTime" : "endTime"]: time }
          : d,
      ),
    );
    setDirty(true);
  };

  const applyToAll = () => {
    // Copie les horaires du premier jour actif sur tous les jours actifs
    const ref = days.find((d) => d.active);
    if (!ref) return;
    setDays((prev) =>
      prev.map((d) =>
        d.active
          ? { ...d, startTime: ref.startTime, endTime: ref.endTime }
          : d,
      ),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Validation : end > start
      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        if (d.active && d.endTime <= d.startTime) {
          Alert.alert(
            `Horaires invalides — ${DAY_LABELS_LONG[i]}`,
            "L'heure de fin doit être après l'heure de début.",
          );
          setSaving(false);
          return;
        }
      }
      const slots = days
        .map((d, i) => ({
          dayOfWeek: DAY_API[i],
          startTime: d.startTime,
          endTime: d.endTime,
          active: d.active,
        }))
        .filter((sl) => sl.active);
      await setMyAvailability(slots);
      setDirty(false);
      Alert.alert(
        "Planning enregistré",
        "Vos disponibilités sont à jour. Les clients ne pourront réserver que sur ces créneaux.",
      );
    } catch (err: unknown) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============= Dérivés =============
  const activeDays = days.filter((d) => d.active).length;
  const totalHours = days.reduce((sum, d) => {
    if (!d.active) return sum;
    const sh = parseInt(d.startTime.slice(0, 2), 10);
    const eh = parseInt(d.endTime.slice(0, 2), 10);
    return sum + Math.max(0, eh - sh);
  }, 0);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120 + insets.bottom,
        }}
      >
        {/* ============= HERO ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 14 }]}
        >
          <View style={s.heroTopBar}>
            <Text style={s.heroLabel}>Planning</Text>
            <View style={s.heroIcon}>
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={s.heroTitle}>Mes disponibilités</Text>
          <Text style={s.heroSub}>
            Vos créneaux récurrents par jour de la semaine
          </Text>

          {/* Mini calendrier semaine */}
          <View style={s.weekStrip}>
            {DAY_LABELS.map((lbl, i) => {
              const active = days[i].active;
              return (
                <View key={lbl} style={s.weekDay}>
                  <Text style={s.weekDayLabel}>{lbl}</Text>
                  <View
                    style={[
                      s.weekDayDot,
                      {
                        backgroundColor: active
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.18)",
                      },
                    ]}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={11} color="#7C8FFF" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Stats résumé */}
          <View style={s.heroStatsRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{activeDays}</Text>
              <Text style={s.heroStatLabel}>
                jour{activeDays > 1 ? "s" : ""} actif
                {activeDays > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={s.heroStatSep} />
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{totalHours}h</Text>
              <Text style={s.heroStatLabel}>par semaine</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ============= INFO BANDEAU ============= */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[
            s.note,
            { backgroundColor: t.primaryMuted, marginTop: space.lg },
          ]}
        >
          <Ionicons name="information-circle" size={18} color={t.primary} />
          <Text style={[s.noteTxt, { color: t.primary }]}>
            Activez les jours et choisissez les horaires. Les clients ne
            pourront réserver que sur ces créneaux.
          </Text>
        </Animated.View>

        {/* ============= BOUTON "Appliquer à tous" ============= */}
        {activeDays > 1 && (
          <View style={s.toolbar}>
            <Pressable
              onPress={applyToAll}
              style={({ pressed }) => [
                s.toolBtn,
                { backgroundColor: t.surface, borderColor: t.borderStrong },
                pressed && s.pressed,
              ]}
            >
              <Ionicons name="copy-outline" size={14} color={t.primary} />
              <Text style={[s.toolBtnTxt, { color: t.primary }]}>
                Copier les horaires sur tous les jours
              </Text>
            </Pressable>
          </View>
        )}

        {/* ============= LISTE DES JOURS ============= */}
        <View style={s.daysList}>
          {days.map((d, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(idx * 30).duration(300)}
              style={[
                s.dayCard,
                {
                  backgroundColor: t.surface,
                  borderColor: d.active ? t.primary : t.border,
                  borderWidth: d.active ? 1.5 : 1,
                },
              ]}
            >
              <Pressable onPress={() => toggleDay(idx)} style={s.dayHead}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      s.dayLabel,
                      { color: d.active ? t.text : t.textTertiary },
                    ]}
                  >
                    {DAY_LABELS_LONG[idx]}
                  </Text>
                  <Text
                    style={[
                      s.daySubLabel,
                      { color: d.active ? t.textSecondary : t.textTertiary },
                    ]}
                  >
                    {d.active ? "Ouvert" : "Fermé"}
                  </Text>
                </View>
                <View
                  style={[
                    s.switchTrack,
                    {
                      backgroundColor: d.active ? t.primary : t.borderStrong,
                    },
                  ]}
                >
                  <View
                    style={[s.switchThumb, { left: d.active ? 22 : 2 }]}
                  />
                </View>
              </Pressable>

              {d.active && (
                <View style={s.timeRow}>
                  <Pressable
                    onPress={() =>
                      setPicking({ dayIdx: idx, kind: "start" })
                    }
                    style={[
                      s.timePill,
                      {
                        backgroundColor: t.surfaceMuted,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <Text
                      style={[s.timeLabel, { color: t.textSecondary }]}
                    >
                      Ouverture
                    </Text>
                    <Text style={[s.timeVal, { color: t.text }]}>
                      {d.startTime}
                    </Text>
                  </Pressable>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={t.textTertiary}
                  />
                  <Pressable
                    onPress={() => setPicking({ dayIdx: idx, kind: "end" })}
                    style={[
                      s.timePill,
                      {
                        backgroundColor: t.surfaceMuted,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <Text
                      style={[s.timeLabel, { color: t.textSecondary }]}
                    >
                      Fermeture
                    </Text>
                    <Text style={[s.timeVal, { color: t.text }]}>
                      {d.endTime}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* ============= CTA BOTTOM ============= */}
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
          disabled={saving || !dirty}
          style={({ pressed }) => [
            s.saveWrap,
            (saving || !dirty) && { opacity: 0.55 },
            pressed && dirty && !saving && s.ctaPressed,
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
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={dirty ? "checkmark-circle" : "checkmark-done"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={s.saveTxt}>
                  {dirty ? "Enregistrer les modifications" : "Planning à jour"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* ============= BOTTOM SHEET PICKER HEURE ============= */}
      {picking && (
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setPicking(null)}
        >
          <Pressable
            style={[
              s.modalSheet,
              {
                backgroundColor: t.surface,
                paddingBottom: insets.bottom + 20,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[s.modalHandle, { backgroundColor: t.border }]} />
            <Text style={[s.modalTitle, { color: t.text }]}>
              {picking.kind === "start" ? "Heure d'ouverture" : "Heure de fermeture"}
            </Text>
            <Text style={[s.modalSub, { color: t.textSecondary }]}>
              {DAY_LABELS_LONG[picking.dayIdx]}
            </Text>
            <View style={s.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const active =
                  picking.kind === "start"
                    ? days[picking.dayIdx].startTime === time
                    : days[picking.dayIdx].endTime === time;
                return (
                  <Pressable
                    key={time}
                    onPress={() => {
                      setDayTime(picking.dayIdx, picking.kind, time);
                      setPicking(null);
                    }}
                    style={[
                      s.timeOption,
                      {
                        backgroundColor: active ? t.primary : t.surfaceMuted,
                        borderColor: active ? t.primary : t.borderStrong,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.timeOptionTxt,
                        { color: active ? "#FFFFFF" : t.text },
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
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
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.7,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    marginBottom: space.lg,
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  weekDay: { alignItems: "center", gap: 7, flex: 1 },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
  },
  weekDayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  heroStat: { flex: 1, alignItems: "center", gap: 2 },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  heroStatSep: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  // ===== INFO =====
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: space.lg,
  },
  noteTxt: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },

  // ===== TOOLBAR =====
  toolbar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 6,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  toolBtnTxt: { fontSize: 12, fontWeight: "800", letterSpacing: -0.1 },

  // ===== LIST DAYS =====
  daysList: {
    paddingHorizontal: space.lg,
    paddingTop: 8,
    gap: 8,
  },
  dayCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  dayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLabel: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  daySubLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  switchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    position: "relative",
  },
  switchThumb: {
    position: "absolute",
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timePill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  timeVal: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 },

  // ===== BOTTOM BAR =====
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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

  // ===== MODAL =====
  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15,15,24,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: space.lg,
    paddingTop: 12,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modalSub: { fontSize: 13, fontWeight: "500", marginTop: 2, marginBottom: 16 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeOption: {
    width: "23%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  timeOptionTxt: { fontSize: 14, fontWeight: "800" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
