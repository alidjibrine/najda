import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand, space, radius, shadow, text as T } from "@/constants/theme";

export default function MessagesScreen() {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
        <Text style={s.subtitle}>Restez en contact avec vos artisans</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={s.empty}>
          <View style={s.emptyIconCircle}>
            <Ionicons
              name="chatbubbles-outline"
              size={32}
              color={brand.primary400}
            />
          </View>
          <Text style={s.emptyTitle}>Aucune conversation</Text>
          <Text style={s.emptySub}>
            Vos échanges avec les artisans apparaîtront ici dès qu&apos;un rendez-vous sera confirmé.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={s.infoCard}
        >
          <View style={s.infoIcon}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={brand.primary500}
            />
          </View>
          <View style={s.infoText}>
            <Text style={s.infoTitle}>Messagerie sécurisée</Text>
            <Text style={s.infoBody}>
              Toutes les conversations sont chiffrées et conservées pendant la durée de la prestation.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: { ...T.sm, color: brand.gray500 },

  scroll: { padding: space.lg },

  empty: {
    backgroundColor: brand.white,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.lg,
    ...shadow.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: brand.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.sm,
  },
  emptyTitle: {
    ...T.lg,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.3,
  },
  emptySub: {
    ...T.sm,
    color: brand.gray500,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: brand.primary50,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: brand.primary100,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: brand.primary100,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: { flex: 1 },
  infoTitle: {
    ...T.sm,
    fontWeight: "700",
    color: brand.primary700,
    marginBottom: 2,
  },
  infoBody: { ...T.xs, color: brand.primary700, lineHeight: 18 },
});
