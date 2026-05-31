import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getMessages,
  subscribeToConversation,
  type Message,
} from "@/lib/api";
import {
  markProConversationRead,
  sendMessageAsArtisan,
} from "@/lib/api-extras";
import { supabase } from "@/lib/supabase";

interface ConvDetail {
  id: string;
  bookingService: string;
  bookingDate: string;
  bookingTime: string;
  clientFirstName: string;
  clientLastName: string;
  clientAvatarUrl: string | null;
}

export default function ProConversationScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [conv, setConv] = useState<ConvDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  // Charger conv + messages + marquer comme lu
  const load = useCallback(async () => {
    if (!id) return;
    try {
      // Conv details (join client + booking)
      const { data: convData } = await supabase
        .from("conversations")
        .select(
          `id,
           client:profiles!conversations_user_id_fkey(first_name, last_name, avatar_url),
           booking:bookings(service, booking_date, booking_time)`,
        )
        .eq("id", id)
        .maybeSingle();

      if (convData) {
        const client = Array.isArray((convData as any).client)
          ? (convData as any).client[0]
          : (convData as any).client;
        const booking = Array.isArray((convData as any).booking)
          ? (convData as any).booking[0]
          : (convData as any).booking;
        setConv({
          id: convData.id,
          clientFirstName: client?.first_name ?? "",
          clientLastName: client?.last_name ?? "",
          clientAvatarUrl: client?.avatar_url ?? null,
          bookingService: booking?.service ?? "",
          bookingDate: booking?.booking_date ?? "",
          bookingTime: booking?.booking_time ?? "",
        });
      }

      // Messages
      const msgs = await getMessages(id);
      setMessages(Array.isArray(msgs) ? msgs : []);

      // Marquer comme lu côté pro
      await markProConversationRead(id).catch(() => {});
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to new messages (realtime)
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToConversation(id, (m) => {
      setMessages((prev) => [...prev, m]);
      // Reset unread si message du client
      if (m.senderType === "user") {
        markProConversationRead(id).catch(() => {});
      }
    });
    return unsub;
  }, [id]);

  // Auto-scroll en bas quand nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!id || !text.trim() || sending) return;
    setSending(true);
    const draft = text.trim();
    setText("");
    try {
      await sendMessageAsArtisan(id, draft);
      // Le realtime ajoutera le message
    } catch (err: unknown) {
      setText(draft);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const fullName = conv
    ? `${conv.clientFirstName} ${conv.clientLastName}`.trim() || "Client"
    : "...";
  const initial = (conv?.clientFirstName?.charAt(0) || "?").toUpperCase();

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ============= HERO HEADER ============= */}
        <LinearGradient
          colors={najdaGradient as unknown as [string, string, ...string[]]}
          start={najdaGradientDirection.start}
          end={najdaGradientDirection.end}
          style={[s.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={s.heroRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={s.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>

            {conv?.clientAvatarUrl ? (
              <Image
                source={{ uri: conv.clientAvatarUrl }}
                style={s.avatar}
              />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarTxt}>{initial}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={s.heroName} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={s.heroSub} numberOfLines={1}>
                {conv?.bookingService}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ============= MESSAGES ============= */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.messagesList,
            { paddingBottom: 16 },
          ]}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.length === 0 ? (
            <Text
              style={[
                s.emptyHint,
                { color: t.textSecondary, marginTop: 80 },
              ]}
            >
              Aucun message pour le moment.{"\n"}Envoyez le premier pour démarrer
              la conversation.
            </Text>
          ) : (
            messages.map((m, idx) => {
              const isMine = m.senderType === "artisan";
              const isSystem = m.senderType === "system";

              if (isSystem) {
                return (
                  <View key={m.id} style={s.systemMsgWrap}>
                    <Text
                      style={[s.systemMsg, { color: t.textTertiary }]}
                      numberOfLines={3}
                    >
                      {m.text}
                    </Text>
                  </View>
                );
              }

              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInDown.duration(200)}
                  style={[
                    s.msgRow,
                    {
                      justifyContent: isMine ? "flex-end" : "flex-start",
                    },
                  ]}
                >
                  <View
                    style={[
                      s.msgBubble,
                      isMine
                        ? {
                            backgroundColor: t.primary,
                            borderBottomRightRadius: 4,
                          }
                        : {
                            backgroundColor: t.surface,
                            borderColor: t.border,
                            borderWidth: 1,
                            borderBottomLeftRadius: 4,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        s.msgTxt,
                        { color: isMine ? "#FFFFFF" : t.text },
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text
                      style={[
                        s.msgTime,
                        {
                          color: isMine
                            ? "rgba(255,255,255,0.7)"
                            : t.textTertiary,
                        },
                      ]}
                    >
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>

        {/* ============= INPUT ============= */}
        <View
          style={[
            s.inputBar,
            {
              backgroundColor: t.surface,
              borderTopColor: t.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <View
            style={[
              s.inputWrap,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Répondre au client…"
              placeholderTextColor={t.textTertiary}
              multiline
              maxLength={500}
              style={[s.input, { color: t.text }]}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [
              s.sendBtn,
              (!text.trim() || sending) && { opacity: 0.45 },
              pressed && text.trim() && !sending && s.pressed,
            ]}
          >
            <LinearGradient
              colors={
                najdaGradient as unknown as [string, string, ...string[]]
              }
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.sendInner}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  hero: {
    paddingHorizontal: space.md,
    paddingBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  heroName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginTop: 2,
  },

  messagesList: {
    padding: space.md,
    gap: 8,
  },

  msgRow: { flexDirection: "row" },
  msgBubble: {
    maxWidth: "78%",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
  },
  msgTxt: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 10, fontWeight: "500", marginTop: 4, textAlign: "right" },

  systemMsgWrap: { alignItems: "center", paddingVertical: 6 },
  systemMsg: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    maxWidth: "85%",
    lineHeight: 16,
  },

  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: space.md,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 42,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    fontWeight: "500",
    minHeight: 24,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...shadow.md,
  },
  sendInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
});
