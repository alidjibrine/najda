import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  acceptBooking,
  rejectBooking,
  completeBooking,
  getProIncomingBookings,
} from "@/lib/api-extras";

type Tab = "pending" | "upcoming" | "history";
type Period = "all" | "today" | "week";

interface ProBooking {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  description: string | null;
}

const DAY_NAMES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const REJECT_REASONS = [
  "Indisponible sur ce créneau",
  "Trop loin de ma zone",
  "Pas mon métier / spécialité",
  "Demande peu claire",
  "Autre",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  return d >= today && d <= weekEnd;
}

export default function ProRequestsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<ProBooking[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(false);

  // ===== Modal Accept =====
  const [acceptModal, setAcceptModal] = useState<ProBooking | null>(null);
  const [acceptPrice, setAcceptPrice] = useState("");
  const [acceptNote, setAcceptNote] = useState("");

  // ===== Modal Reject =====
  const [rejectModal, setRejectModal] = useState<ProBooking | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [rejectCustom, setRejectCustom] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getProIncomingBookings()
      .then((b) => setBookings(Array.isArray(b) ? (b as ProBooking[]) : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const safe = Array.isArray(bookings) ? bookings : [];
    let list = safe.filter((b) => {
      if (tab === "pending") return b.status === "pending";
      if (tab === "upcoming")
        return b.status === "accepted" || b.status === "in_progress";
      return (
        b.status === "completed" ||
        b.status === "rejected" ||
        b.status === "cancelled" ||
        b.status === "reviewed"
      );
    });
    if (period === "today") list = list.filter((b) => isToday(b.date));
    if (period === "week") list = list.filter((b) => isThisWeek(b.date));
    return list;
  }, [bookings, tab, period]);

  const counts = useMemo(() => {
    const safe = Array.isArray(bookings) ? bookings : [];
    return {
      pending: safe.filter((b) => b.status === "pending").length,
      upcoming: safe.filter(
        (b) => b.status === "accepted" || b.status === "in_progress",
      ).length,
      history: safe.filter(
        (b) =>
          b.status === "completed" ||
          b.status === "rejected" ||
          b.status === "cancelled" ||
          b.status === "reviewed",
      ).length,
    };
  }, [bookings]);

  // ============ ACCEPT ============
  const openAccept = (b: ProBooking) => {
    setAcceptModal(b);
    setAcceptPrice("");
    setAcceptNote("");
  };
  const closeAccept = () => {
    setAcceptModal(null);
    setAcceptPrice("");
    setAcceptNote("");
  };
  const submitAccept = async () => {
    if (!acceptModal) return;
    try {
      await acceptBooking(acceptModal.id);
      closeAccept();
      load();
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur");
    }
  };

  // ============ REJECT ============
  const openReject = (b: ProBooking) => {
    setRejectModal(b);
    setRejectReason(null);
    setRejectCustom("");
  };
  const closeReject = () => {
    setRejectModal(null);
    setRejectReason(null);
    setRejectCustom("");
  };
  const submitReject = async () => {
    if (!rejectModal) return;
    const reason =
      rejectReason === "Autre" ? rejectCustom.trim() : rejectReason;
    if (!reason) {
      Alert.alert("Motif requis", "Choisissez ou précisez un motif.");
      return;
    }
    try {
      await rejectBooking(rejectModal.id, reason);
      closeReject();
      load();
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur");
    }
  };

  // ============ COMPLETE ============
  const handleComplete = (id: string) => {
    Alert.alert(
      "Mission terminée ?",
      "Le client recevra une demande d'avis.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Marquer terminée",
          onPress: async () => {
            try {
              await completeBooking(id);
              load();
            } catch (err: unknown) {
              Alert.alert(
                "Erreur",
                err instanceof Error ? err.message : "Erreur",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ============= HERO GRADIENT ============= */}
      <LinearGradient
        colors={najdaGradient as unknown as [string, string, ...string[]]}
        start={najdaGradientDirection.start}
        end={najdaGradientDirection.end}
        style={[s.hero, { paddingTop: insets.top + 14 }]}
      >
        <View style={s.heroTopBar}>
          <Text style={s.heroLabel}>Demandes</Text>
          <View style={s.heroIcon}>
            <Ionicons name="mail" size={20} color="#FFFFFF" />
          </View>
        </View>
        <Text style={s.heroTitle}>
          {counts.pending} en attente
        </Text>
        <Text style={s.heroSub}>
          {counts.upcoming} confirmées · {counts.history} historique
        </Text>
      </LinearGradient>

      <View style={s.body}>
        {/* TABS */}
        <View
          style={[
            s.tabs,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
          ]}
        >
          <TabButton
            label="À traiter"
            count={counts.pending}
            active={tab === "pending"}
            onPress={() => setTab("pending")}
            t={t}
          />
          <TabButton
            label="Confirmées"
            count={counts.upcoming}
            active={tab === "upcoming"}
            onPress={() => setTab("upcoming")}
            t={t}
          />
          <TabButton
            label="Historique"
            count={counts.history}
            active={tab === "history"}
            onPress={() => setTab("history")}
            t={t}
          />
        </View>

        {/* PERIOD FILTERS */}
        <View style={s.periodRow}>
          <PeriodChip
            label="Tout"
            active={period === "all"}
            onPress={() => setPeriod("all")}
            t={t}
          />
          <PeriodChip
            label="Aujourd'hui"
            active={period === "today"}
            onPress={() => setPeriod("today")}
            t={t}
          />
          <PeriodChip
            label="Cette semaine"
            active={period === "week"}
            onPress={() => setPeriod("week")}
            t={t}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: 16 + insets.bottom },
          ]}
        >
          {loading ? (
            <View style={s.loaderWrap}>
              <ActivityIndicator size="large" color={t.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={s.empty}>
              <LinearGradient
                colors={
                  najdaGradient as unknown as [string, string, ...string[]]
                }
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.emptyIconGrad}
              >
                <Ionicons
                  name={
                    tab === "pending"
                      ? "mail-open-outline"
                      : tab === "upcoming"
                        ? "calendar-outline"
                        : "time-outline"
                  }
                  size={32}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                {tab === "pending"
                  ? "Aucune nouvelle demande"
                  : tab === "upcoming"
                    ? "Aucun rendez-vous confirmé"
                    : "Aucun historique"}
              </Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                {tab === "pending"
                  ? "Vos demandes apparaîtront ici en temps réel dès qu'un client réservera."
                  : tab === "upcoming"
                    ? "Acceptez une demande pour qu'elle apparaisse ici."
                    : "Les missions passées s'afficheront ici."}
              </Text>
              {tab === "pending" && (
                <View
                  style={[
                    s.emptyTips,
                    {
                      backgroundColor: t.surface,
                      borderColor: t.border,
                    },
                  ]}
                >
                  <Text style={[s.emptyTipsTitle, { color: t.text }]}>
                    Pour recevoir plus de demandes
                  </Text>
                  <EmptyTip
                    icon="checkmark-circle"
                    text="Complétez votre profil à 100%"
                    t={t}
                  />
                  <EmptyTip
                    icon="checkmark-circle"
                    text="Activez plusieurs jours dans votre planning"
                    t={t}
                  />
                  <EmptyTip
                    icon="checkmark-circle"
                    text="Listez tous les services que vous proposez"
                    t={t}
                  />
                </View>
              )}
            </Animated.View>
          ) : (
            filtered.map((b, idx) => (
              <Animated.View
                key={b.id}
                entering={FadeInDown.delay(idx * 40).duration(300)}
                style={[
                  s.card,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.cardHead}>
                  <View
                    style={[s.dateBox, { backgroundColor: t.primaryMuted }]}
                  >
                    <Text style={[s.dateDay, { color: t.primary }]}>
                      {new Date(b.date).getDate()}
                    </Text>
                    <Text style={[s.dateMonth, { color: t.primary }]}>
                      {MONTH_NAMES[new Date(b.date).getMonth()].slice(0, 4)}.
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[s.svcName, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {b.service}
                    </Text>
                    <Text style={[s.timeTxt, { color: t.textSecondary }]}>
                      {formatDate(b.date)} · {b.time}
                    </Text>
                  </View>
                  {isToday(b.date) && (
                    <View
                      style={[
                        s.todayPill,
                        { backgroundColor: "rgba(245,158,11,0.12)" },
                      ]}
                    >
                      <Text style={s.todayPillTxt}>Aujourd&apos;hui</Text>
                    </View>
                  )}
                </View>

                {b.description && (
                  <Text
                    style={[s.desc, { color: t.textSecondary }]}
                    numberOfLines={3}
                  >
                    « {b.description} »
                  </Text>
                )}

                {b.status === "pending" ? (
                  <View style={s.actionsRow}>
                    <Pressable
                      onPress={() => openReject(b)}
                      style={({ pressed }) => [
                        s.btnReject,
                        { borderColor: t.border },
                        pressed && s.pressed,
                      ]}
                    >
                      <Ionicons name="close" size={18} color={t.danger} />
                      <Text style={[s.btnRejectTxt, { color: t.danger }]}>
                        Refuser
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openAccept(b)}
                      style={({ pressed }) => [
                        s.btnAcceptWrap,
                        pressed && s.pressed,
                      ]}
                    >
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
                        style={s.btnAccept}
                      >
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={s.btnAcceptTxt}>Accepter</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : b.status === "accepted" || b.status === "in_progress" ? (
                  <View style={s.actionsRow}>
                    <View
                      style={[
                        s.confirmedBadge,
                        { backgroundColor: "rgba(16,185,129,0.12)" },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#10B981"
                      />
                      <Text style={s.confirmedTxt}>Confirmé</Text>
                    </View>
                    <Pressable
                      onPress={() => handleComplete(b.id)}
                      style={({ pressed }) => [
                        s.btnCompleteWrap,
                        pressed && s.pressed,
                      ]}
                    >
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
                        style={s.btnComplete}
                      >
                        <Ionicons
                          name="ribbon-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={s.btnAcceptTxt}>Terminée</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={[s.statusFooter, { borderTopColor: t.border }]}
                  >
                    <Ionicons
                      name={statusIcon(b.status)}
                      size={14}
                      color={statusColor(b.status, t)}
                    />
                    <Text
                      style={[
                        s.statusTxt,
                        { color: statusColor(b.status, t) },
                      ]}
                    >
                      {statusLabel(b.status)}
                    </Text>
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>

      {/* ============= MODAL ACCEPT ============= */}
      <Modal
        visible={!!acceptModal}
        transparent
        animationType="fade"
        onRequestClose={closeAccept}
      >
        <Pressable style={s.modalOverlay} onPress={closeAccept}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={s.modalCenter}
          >
            <Pressable>
              <Animated.View
                entering={SlideInDown.duration(280)}
                style={[
                  s.modalCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.modalHead}>
                  <View
                    style={[s.modalIcon, { backgroundColor: t.primaryMuted }]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={t.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalTitle, { color: t.text }]}>
                      Accepter la demande
                    </Text>
                    <Text
                      style={[s.modalSub, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {acceptModal?.service}
                    </Text>
                  </View>
                  <Pressable onPress={closeAccept} hitSlop={8}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={t.textSecondary}
                    />
                  </Pressable>
                </View>

                <View style={s.modalField}>
                  <Text
                    style={[s.modalLabel, { color: t.textSecondary }]}
                  >
                    Devis (facultatif)
                  </Text>
                  <View
                    style={[
                      s.modalInputRow,
                      {
                        backgroundColor: t.surfaceMuted,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <TextInput
                      value={acceptPrice}
                      onChangeText={(v) =>
                        setAcceptPrice(v.replace(/[^0-9-]/g, ""))
                      }
                      placeholder="Ex : 80"
                      placeholderTextColor={t.textTertiary}
                      keyboardType="number-pad"
                      style={[s.modalInput, { color: t.text }]}
                    />
                    <Text style={[s.modalInputUnit, { color: t.textSecondary }]}>
                      €
                    </Text>
                  </View>
                </View>

                <View style={s.modalField}>
                  <Text
                    style={[s.modalLabel, { color: t.textSecondary }]}
                  >
                    Message au client (facultatif)
                  </Text>
                  <View
                    style={[
                      s.modalTextarea,
                      {
                        backgroundColor: t.surfaceMuted,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <TextInput
                      value={acceptNote}
                      onChangeText={setAcceptNote}
                      placeholder="Ex : Je serai chez vous à 14h pile."
                      placeholderTextColor={t.textTertiary}
                      multiline
                      maxLength={300}
                      style={[s.modalTextareaInput, { color: t.text }]}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={submitAccept}
                  style={({ pressed }) => [
                    s.modalCtaWrap,
                    pressed && s.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={
                      najdaGradient as unknown as [string, string, ...string[]]
                    }
                    start={najdaGradientDirection.start}
                    end={najdaGradientDirection.end}
                    style={s.modalCta}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={s.modalCtaTxt}>Confirmer l&apos;acceptation</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* ============= MODAL REJECT ============= */}
      <Modal
        visible={!!rejectModal}
        transparent
        animationType="fade"
        onRequestClose={closeReject}
      >
        <Pressable style={s.modalOverlay} onPress={closeReject}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={s.modalCenter}
          >
            <Pressable>
              <Animated.View
                entering={SlideInDown.duration(280)}
                style={[
                  s.modalCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.modalHead}>
                  <View
                    style={[
                      s.modalIcon,
                      { backgroundColor: t.dangerMuted },
                    ]}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={t.danger}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalTitle, { color: t.text }]}>
                      Refuser la demande
                    </Text>
                    <Text
                      style={[s.modalSub, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {rejectModal?.service}
                    </Text>
                  </View>
                  <Pressable onPress={closeReject} hitSlop={8}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={t.textSecondary}
                    />
                  </Pressable>
                </View>

                <View style={s.modalField}>
                  <Text style={[s.modalLabel, { color: t.textSecondary }]}>
                    Motif du refus
                  </Text>
                  <View style={{ gap: 6 }}>
                    {REJECT_REASONS.map((r) => {
                      const active = rejectReason === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => setRejectReason(r)}
                          style={({ pressed }) => [
                            s.reasonPill,
                            {
                              backgroundColor: active
                                ? t.primaryMuted
                                : t.surfaceMuted,
                              borderColor: active ? t.primary : t.border,
                            },
                            pressed && s.pressed,
                          ]}
                        >
                          <View
                            style={[
                              s.reasonRadio,
                              {
                                backgroundColor: active
                                  ? t.primary
                                  : "transparent",
                                borderColor: active
                                  ? t.primary
                                  : t.borderStrong,
                              },
                            ]}
                          >
                            {active && (
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                          <Text
                            style={[s.reasonTxt, { color: t.text }]}
                            numberOfLines={1}
                          >
                            {r}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {rejectReason === "Autre" && (
                  <View style={s.modalField}>
                    <View
                      style={[
                        s.modalTextarea,
                        {
                          backgroundColor: t.surfaceMuted,
                          borderColor: t.border,
                        },
                      ]}
                    >
                      <TextInput
                        value={rejectCustom}
                        onChangeText={setRejectCustom}
                        placeholder="Précisez le motif…"
                        placeholderTextColor={t.textTertiary}
                        multiline
                        maxLength={200}
                        style={[s.modalTextareaInput, { color: t.text }]}
                      />
                    </View>
                  </View>
                )}

                <Pressable
                  onPress={submitReject}
                  style={({ pressed }) => [
                    s.modalCtaDanger,
                    { backgroundColor: t.danger },
                    pressed && s.pressed,
                  ]}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                  <Text style={s.modalCtaTxt}>Confirmer le refus</Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

// =====================================================
// Sub-components
// =====================================================
function TabButton({
  label,
  count,
  active,
  onPress,
  t,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.tab, active && { backgroundColor: t.surface }]}
    >
      <Text
        style={[
          s.tabTxt,
          {
            color: active ? t.text : t.textSecondary,
            fontWeight: active ? "800" : "600",
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            s.tabBadge,
            { backgroundColor: active ? t.primary : t.borderStrong },
          ]}
        >
          <Text style={s.tabBadgeTxt}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function EmptyTip({
  icon,
  text,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={s.emptyTipRow}>
      <Ionicons name={icon} size={14} color={t.primary} />
      <Text style={[s.emptyTipTxt, { color: t.textSecondary }]}>{text}</Text>
    </View>
  );
}

function PeriodChip({
  label,
  active,
  onPress,
  t,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.periodChip,
        {
          backgroundColor: active ? t.primary : t.surface,
          borderColor: active ? t.primary : t.border,
        },
      ]}
    >
      <Text
        style={[
          s.periodTxt,
          { color: active ? "#FFFFFF" : t.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function statusLabel(status: string): string {
  return (
    {
      accepted: "Confirmée",
      rejected: "Refusée",
      completed: "Terminée",
      cancelled: "Annulée",
      reviewed: "Avis reçu",
    }[status] ?? status
  );
}

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  return (
    {
      accepted: "checkmark-circle" as const,
      rejected: "close-circle" as const,
      completed: "ribbon" as const,
      cancelled: "ban" as const,
      reviewed: "star" as const,
    }[status] ?? "ellipse"
  );
}

function statusColor(status: string, t: ReturnType<typeof useTheme>): string {
  if (status === "rejected" || status === "cancelled") return t.danger;
  if (status === "accepted" || status === "completed") return "#10B981";
  if (status === "reviewed") return "#C9A961";
  return t.textSecondary;
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // ===== HERO =====
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg + 4,
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
  },

  body: { flex: 1, paddingTop: space.md },

  tabs: {
    flexDirection: "row",
    marginHorizontal: space.lg,
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 2,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  tabTxt: { fontSize: 13, letterSpacing: -0.1 },
  tabBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeTxt: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  periodRow: {
    flexDirection: "row",
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    gap: 6,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  periodTxt: { fontSize: 12, fontWeight: "800", letterSpacing: -0.1 },

  scroll: { paddingHorizontal: space.lg, gap: 10 },

  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBox: {
    width: 52,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  dateMonth: { fontSize: 10, fontWeight: "700" },
  svcName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  timeTxt: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  todayPillTxt: { fontSize: 10, fontWeight: "800", color: "#F59E0B" },

  desc: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
    paddingHorizontal: 4,
  },

  actionsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  btnReject: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnRejectTxt: { fontSize: 13, fontWeight: "800" },
  btnAcceptWrap: { flex: 1, borderRadius: 12 },
  btnAccept: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  btnAcceptTxt: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  confirmedTxt: { fontSize: 12, fontWeight: "800", color: "#10B981" },
  btnCompleteWrap: { flex: 1, borderRadius: 12 },
  btnComplete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },

  statusFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  statusTxt: { fontSize: 12, fontWeight: "700" },

  empty: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 8,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIconGrad: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyTips: {
    width: "100%",
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyTipsTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  emptyTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyTipTxt: { fontSize: 13, fontWeight: "500", flex: 1 },

  loaderWrap: { paddingVertical: 60, alignItems: "center" },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  // ===== MODALS =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
  },
  modalCenter: { paddingHorizontal: space.lg },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    ...shadow.lg,
  },
  modalHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  modalSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  modalField: { gap: 6 },
  modalLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalInput: { flex: 1, fontSize: 16, fontWeight: "700", paddingVertical: 0 },
  modalInputUnit: { fontSize: 16, fontWeight: "800" },
  modalTextarea: {
    minHeight: 76,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalTextareaInput: {
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "top",
    padding: 0,
  },

  reasonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  reasonRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonTxt: { flex: 1, fontSize: 13, fontWeight: "700" },

  modalCtaWrap: { borderRadius: 14, ...shadow.md },
  modalCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  modalCtaDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    ...shadow.md,
  },
  modalCtaTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
