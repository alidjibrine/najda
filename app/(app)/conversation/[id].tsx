import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  subscribeToConversation,
  type Conversation,
  type Message,
} from "@/lib/api";
import { Avatar } from "@/components/Avatar";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | undefined,
): boolean {
  if (!previous) return true;
  const c = new Date(current.createdAt).toDateString();
  const p = new Date(previous.createdAt).toDateString();
  return c !== p;
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ConversationScreen() {
  const router = useRouter();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadData = useCallback(async () => {
    const [conv, msgs] = await Promise.all([
      getConversation(id),
      getMessages(id),
    ]);
    setConversation(conv);
    setMessages(msgs);
    markConversationRead(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadData()
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadData]);

  // Realtime
  useEffect(() => {
    const unsubscribe = subscribeToConversation(id, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderType !== "user") {
        markConversationRead(id).catch(() => {});
      }
    });
    return unsubscribe;
  }, [id]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendMessage(id, text);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // ============= Loading / Error =============
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
        <View style={s.loader}>
          <Text style={[s.errorTxt, { color: t.text }]}>
            Conversation introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============= Render message =============
  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const previous = messages[index - 1];
    const showDate = shouldShowDateSeparator(item, previous);

    if (item.senderType === "system") {
      return (
        <View>
          {showDate && (
            <View style={s.dateSeparatorWrap}>
              <View style={[s.dateLine, { backgroundColor: t.border }]} />
              <Text style={[s.dateSeparator, { color: t.textTertiary }]}>
                {formatDateSeparator(item.createdAt)}
              </Text>
              <View style={[s.dateLine, { backgroundColor: t.border }]} />
            </View>
          )}
          <View
            style={[
              s.systemMsg,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={t.textSecondary}
            />
            <Text style={[s.systemTxt, { color: t.textSecondary }]}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }

    const isMe = item.senderType === "user";
    return (
      <View>
        {showDate && (
          <View style={s.dateSeparatorWrap}>
            <View style={[s.dateLine, { backgroundColor: t.border }]} />
            <Text style={[s.dateSeparator, { color: t.textTertiary }]}>
              {formatDateSeparator(item.createdAt)}
            </Text>
            <View style={[s.dateLine, { backgroundColor: t.border }]} />
          </View>
        )}
        <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
          {isMe ? (
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={[s.bubble, s.bubbleMe]}
            >
              <Text style={[s.bubbleTxt, { color: "#FFFFFF" }]}>
                {item.text}
              </Text>
              <Text style={[s.bubbleTime, { color: "rgba(255,255,255,0.75)" }]}>
                {formatTime(item.createdAt)}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                s.bubble,
                s.bubbleOther,
                { backgroundColor: t.surfaceMuted, borderColor: t.border },
              ]}
            >
              <Text style={[s.bubbleTxt, { color: t.text }]}>{item.text}</Text>
              <Text style={[s.bubbleTime, { color: t.textTertiary }]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[s.safe, { backgroundColor: t.bg }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* ============= HEADER ============= */}
      <View
        style={[
          s.header,
          { backgroundColor: t.surface, borderBottomColor: t.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            s.backBtn,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
            pressed && s.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={t.text} />
        </Pressable>

        <Pressable
          onPress={() =>
            conversation.artisan &&
            router.push({
              pathname: "/(app)/artisan/[id]",
              params: { id: conversation.artisan.id },
            })
          }
          style={s.headerCenter}
        >
          <Avatar
            uri={conversation.artisan?.avatarUrl}
            initials={conversation.artisan?.initials ?? "?"}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.headerName, { color: t.text }]} numberOfLines={1}>
              {conversation.artisan
                ? `${conversation.artisan.firstName} ${conversation.artisan.lastName}`
                : "Artisan"}
            </Text>
            <View style={s.headerSubRow}>
              <View
                style={[
                  s.headerDot,
                  { backgroundColor: "#10B981" },
                ]}
              />
              <Text
                style={[s.headerSub, { color: t.textSecondary }]}
                numberOfLines={1}
              >
                En ligne
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {}}
          hitSlop={12}
          style={({ pressed }) => [
            s.backBtn,
            { backgroundColor: t.surfaceMuted, borderColor: t.border },
            pressed && s.pressed,
          ]}
        >
          <Ionicons name="call-outline" size={18} color={t.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ============= MESSAGES ============= */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* ============= INPUT ============= */}
        <View
          style={[
            s.inputBar,
            { backgroundColor: t.surface, borderTopColor: t.border },
          ]}
        >
          <View
            style={[
              s.inputWrap,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Écrivez un message…"
              placeholderTextColor={t.textTertiary}
              multiline
              style={[s.input, { color: t.text }]}
              editable={!sending}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              s.sendWrap,
              !input.trim() && { opacity: 0.4 },
              pressed && input.trim() && s.ctaPressed,
            ]}
          >
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.send}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorTxt: { ...T.base },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerDot: { width: 6, height: 6, borderRadius: 3 },
  headerSub: { fontSize: 11, fontWeight: "500" },

  // ===== LIST =====
  list: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: 4,
  },

  // ===== DATE SEPARATOR =====
  dateSeparatorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  dateLine: { flex: 1, height: 0.5 },
  dateSeparator: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // ===== SYSTEM MESSAGE =====
  systemMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 0.5,
    marginVertical: 4,
    maxWidth: "85%",
  },
  systemTxt: { fontSize: 11, fontWeight: "500", flexShrink: 1 },

  // ===== MESSAGE BUBBLES =====
  msgRow: { marginVertical: 2 },
  msgRowMe: { alignItems: "flex-end" },
  msgRowOther: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 60,
  },
  bubbleMe: {
    borderRadius: 18,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 0.5,
  },
  bubbleTxt: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  bubbleTime: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
    alignSelf: "flex-end",
  },

  // ===== INPUT =====
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: space.lg,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 0.5,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 120,
    minHeight: 42,
    justifyContent: "center",
  },
  input: {
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  sendWrap: {
    borderRadius: 20,
    overflow: "hidden",
    ...shadow.md,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.96 }] },
});
