import { useEffect, useState } from "react";
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
import { getMyProfile, getMyBookings, type Booking } from "@/lib/api";
import { createReviewForBooking } from "@/lib/api-extras";

const RATING_LABELS = [
  "Très déçu",
  "Décevant",
  "Correct",
  "Très bien",
  "Excellent",
];

export default function NewReviewScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getMyBookings("upcoming"), getMyBookings("past"), getMyProfile()])
      .then(([upc, past, prof]) => {
        if (!mounted) return;
        const all = [...upc, ...past];
        const b = all.find((x) => x.id === bookingId);
        if (b) setBooking(b);
        if (prof) {
          const name = `${prof.firstName} ${prof.lastName.charAt(0)}.`.trim();
          setAuthorName(name || "Client Najda");
        } else {
          setAuthorName("Client Najda");
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!booking?.artisan || !bookingId) {
      Alert.alert("Erreur", "Réservation introuvable.");
      return;
    }
    if (rating < 1) {
      Alert.alert("Note manquante", "Sélectionnez une note de 1 à 5 étoiles.");
      return;
    }
    setSubmitting(true);
    try {
      await createReviewForBooking({
        bookingId,
        artisanId: booking.artisan.id,
        rating,
        text: text.trim(),
        author: authorName,
      });
      Alert.alert("Merci !", "Votre avis a été enregistré.", [
        {
          text: "OK",
          onPress: () => {
            router.dismissAll();
            router.replace("/(app)/(tabs)/bookings");
          },
        },
      ]);
    } catch (err: unknown) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* HEADER */}
          <View style={s.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                s.backBtn,
                { backgroundColor: t.surfaceMuted, borderColor: t.border },
                pressed && s.pressed,
              ]}
            >
              <Ionicons name="close" size={20} color={t.text} />
            </Pressable>
            <Text style={[s.headerTitle, { color: t.text }]}>
              Votre expérience
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.scroll,
              { paddingBottom: 32 + insets.bottom },
            ]}
          >
            {/* Artisan recap */}
            {booking?.artisan && (
              <Animated.View
                entering={FadeIn.duration(400)}
                style={[
                  s.artisanCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View
                  style={[
                    s.artisanAvatar,
                    { backgroundColor: t.primaryMuted },
                  ]}
                >
                  <Text style={[s.artisanInitials, { color: t.primary }]}>
                    {booking.artisan.initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.artisanName, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {booking.artisan.firstName} {booking.artisan.lastName}
                  </Text>
                  <Text
                    style={[s.artisanSvc, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    {booking.service}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Stars */}
            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
              style={s.starsBlock}
            >
              <Text style={[s.question, { color: t.text }]}>
                Comment s&apos;est passée l&apos;intervention ?
              </Text>
              <View style={s.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={4}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={42}
                      color="#C9A961"
                    />
                  </Pressable>
                ))}
              </View>
              {rating > 0 && (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  style={[s.ratingLabel, { color: t.primary }]}
                >
                  {RATING_LABELS[rating - 1]}
                </Animated.Text>
              )}
            </Animated.View>

            {/* Comment */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={s.commentBlock}
            >
              <Text style={[s.commentLabel, { color: t.textSecondary }]}>
                Votre commentaire (facultatif)
              </Text>
              <View
                style={[
                  s.textareaWrap,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Décrivez votre expérience pour aider les autres clients…"
                  placeholderTextColor={t.textTertiary}
                  multiline
                  maxLength={500}
                  style={[s.textarea, { color: t.text }]}
                />
                <Text style={[s.charCount, { color: t.textTertiary }]}>
                  {text.length}/500
                </Text>
              </View>
            </Animated.View>

            {/* Hint */}
            <Animated.View
              entering={FadeInDown.delay(280).duration(400)}
              style={[s.hint, { backgroundColor: t.primaryMuted }]}
            >
              <Ionicons name="lock-closed" size={14} color={t.primary} />
              <Text style={[s.hintTxt, { color: t.primary }]}>
                Votre avis sera publié sous le nom « {authorName} ». Il aide
                les clients suivants à choisir.
              </Text>
            </Animated.View>
          </ScrollView>

          {/* CTA */}
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
              onPress={handleSubmit}
              disabled={submitting || rating < 1}
              style={({ pressed }) => [
                s.ctaWrap,
                (submitting || rating < 1) && { opacity: 0.5 },
                pressed && !submitting && rating > 0 && s.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={
                  najdaGradient as unknown as [string, string, ...string[]]
                }
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.cta}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={s.ctaTxt}>Publier mon avis</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: space.md,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800" },

  scroll: { paddingHorizontal: space.lg, gap: space.lg },

  artisanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  artisanAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  artisanInitials: { fontSize: 18, fontWeight: "800" },
  artisanName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  artisanSvc: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  starsBlock: { alignItems: "center", gap: 14, paddingVertical: 12 },
  question: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  stars: { flexDirection: "row", gap: 6 },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: -4,
  },

  commentBlock: { gap: 8 },
  commentLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  textareaWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
  },
  textarea: {
    fontSize: 14,
    fontWeight: "500",
    minHeight: 80,
    textAlignVertical: "top",
    padding: 0,
  },
  charCount: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "right",
    marginTop: 4,
  },

  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  hintTxt: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },

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
    gap: 10,
    height: 56,
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
