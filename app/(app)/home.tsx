import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Radius, Spacing } from "@/constants/theme";

/**
 * Écran d'accueil temporaire post-connexion.
 *
 * Sera remplacé en Phase 1.3 par le vrai écran d'accueil avec les
 * catégories d'artisans, la barre de recherche et la géolocalisation.
 * Pour l'instant, il affiche un message de bienvenue et permet
 * de tester la déconnexion.
 */
export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Se déconnecter ?",
      "Tu devras te reconnecter pour retrouver ton compte.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: () => {
            signOut();
          },
        },
      ],
    );
  };

  const firstName = user?.email?.split("@")[0] ?? "à toi";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.logoSmall}>
          <Ionicons name="construct" size={20} color={Colors.brand.gold500} />
        </View>
        <Text style={styles.brandSmall}>Najda</Text>
        <Pressable
          onPress={handleSignOut}
          hitSlop={12}
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && styles.pressedSubtle,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={Colors.brand.gray800}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeBadge}>
          <Text style={styles.welcomeBadgeText}>✨ Bienvenue</Text>
        </View>
        <Text style={styles.title}>Bonjour {firstName} 👋</Text>
        <Text style={styles.subtitle}>
          Tu es connecté à Najda. La suite arrive très bientôt : recherche
          d&apos;artisans, prise de RDV, suivi en direct.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons
              name="information-circle"
              size={22}
              color={Colors.brand.primary500}
            />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Phase 1.2 terminée</Text>
            <Text style={styles.infoSubtitle}>
              Authentification, persistance de session, déconnexion. Tout est
              opérationnel.
            </Text>
          </View>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Compte connecté</Text>
          <Text style={styles.accountEmail} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  brandSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -0.6,
    flex: 1,
  },
  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  pressedSubtle: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  welcomeBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.brand.gold50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brand.gold200,
  },
  welcomeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.brand.gold700,
    letterSpacing: -0.1,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.brand.gray600,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.brand.primary50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.brand.primary100,
    marginBottom: Spacing.md,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary100,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.brand.primary700,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.brand.primary700,
    opacity: 0.8,
  },
  accountCard: {
    backgroundColor: Colors.brand.gray50,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.gray900,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.brand.gray400,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.brand.gray900,
  },
});
