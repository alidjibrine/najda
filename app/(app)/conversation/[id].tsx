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
import { brand, space, radius, shadow, text as T } from "@/constants/theme";
import {
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  subscribeToConversation,
  type Conversation,
  type Message,
} from "@/lib/api";

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

  // Realtime subscription
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

  // Auto-scroll au dernier message
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

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loader}>
          <ActivityIndicator size="large" color={brand.primary500} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loader}>
          <Text style={s.errorTxt}>Conversation introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const previous = messages[index - 1];
    const showDate = shouldShowDateSeparator(item, previous);

    if (item.senderType === "system") {
      return (
        <View>
          {showDate && (
            <Text style={s.dateSeparator}>
              {formatDateSeparator(item.createdAt)}
            </Text>
          )}
          <View style={s.systemMsg}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={brand.gray500}
            />
            <Text style={s.systemTxt}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isMe = item.senderType === "user";
    return (
      <View>
        {showDate && (
          <Text style={s.dateSeparator}>
            {formatDateSeparator(item.createdAt)}
          </Text>
        )}
        <View
          style={[
            s.msgRow,
            isMe ? s.msgRowMe : s.msgRowOther,
          ]}
        >
          <View
            style={[
              s.bubble,
              isMe ? s.bubbleMe : s.bubbleOther,
            ]}
          >
            <Text
              style={[
                s.bubbleTxt,
                isMe ? s.bubbleTxtMe : s.bubbleTxtOther,
              ]}
            >
              {item.text}
            </Text>
          </View>
          <Text style={s.msgTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={brand.gray800} />
        </Pressable>

        <Pressable
          style={s.headerInfo}
          onPress={() => {
            if (conversation.artisan) {
              router.push({
                pathname: "/(app)/artisan/[id]",
                params: { id: conversation.artisan.id },
              });
            }
          }}
        >
          <View style={s.headerAvatar}>
            <Text style={s.headerAvatarTxt}>
              {conversation.artisan?.initials ?? "?"}
            </Text>
          </View>
          <View>
            <Text style={s.headerName}>
              {conversation.artisan
                ? `${conversation.artisan.firstName} ${conversation.artisan.lastName}`
                : "Artisan"}
            </Text>
            {conversation.artisan && (
              <View style={s.headerStatus}>
                <View style={s.statusDot} />
                <Text style={s.statusTxt}>En ligne</Text>
              </View>
            )}
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.op]}
          hitSlop={12}
          onPress={() => {
            if (conversation.artisan) {
              router.push({
                pathname: "/(app)/artisan/[id]",
                params: { id: conversation.artisan.id },
              });
            }
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={brand.gray700} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={s.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message..."
            placeholderTextColor={brand.gray400}
            style={s.input}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <Pressable
            style={({ pressed }) => [
              s.sendBtn,
              (!input.trim() || sending) && s.sendBtnDisabled,
              pressed && input.trim() && !sending && s.sendBtnP,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={brand.white} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={brand.white} />
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
  errorTxt: { ...T.base, color: brand.gray500 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
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
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarTxt: { fontSize: 14, fontWeight: "700", color: brand.white },
  headerName: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.2,
  },
  headerStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  statusTxt: { ...T.xs, color: brand.gray500 },

  msgList: { padding: space.md, paddingBottom: space.lg },

  dateSeparator: {
    ...T.xs,
    color: brand.gray400,
    textAlign: "center",
    marginVertical: space.md,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  systemMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: brand.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginVertical: 4,
    maxWidth: "85%",
  },
  systemTxt: {
    ...T.xs,
    color: brand.gray600,
    flex: 1,
    fontStyle: "italic",
    lineHeight: 16,
  },

  msgRow: { marginVertical: 2 },
  msgRowMe: { alignItems: "flex-end" },
  msgRowOther: { alignItems: "flex-start" },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: brand.primary500,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: brand.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: brand.gray100,
  },
  bubbleTxt: { ...T.base, lineHeight: 20 },
  bubbleTxtMe: { color: brand.white },
  bubbleTxtOther: { color: brand.gray900 },
  msgTime: {
    ...T.xs,
    color: brand.gray400,
    marginTop: 2,
    marginHorizontal: 4,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.gray100,
  },
  input: {
    flex: 1,
    backgroundColor: brand.gray50,
    borderWidth: 1,
    borderColor: brand.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    ...T.base,
    color: brand.gray900,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  sendBtnDisabled: { backgroundColor: brand.gray300 },
  sendBtnP: { opacity: 0.85, transform: [{ scale: 0.95 }] },
});
