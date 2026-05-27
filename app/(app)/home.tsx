import { useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Radius, Spacing } from "@/constants/theme";

/**
 * Hub d'accueil de Najda — Phase 1.3.
 *
 * Premier vrai écran de l'app authentifiée. Présente le catalogue des
 * métiers (urgences 24/7 + tous les métiers), la barre de recherche, et
 * un emplacement pour les RDV à venir. Les actions sont des placeholders
 * pour l'instant — elles seront branchées sur les vrais flux en Phase
 * 1.4 (liste artisans) et 1.6 (réservation).
 */

type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  available?: number;
};

const URGENT_CATEGORIES: Category[] = [
  {
    id: "plomberie",
    name: "Plomberie",
    icon: "water",
    bg: "#E0E7FF",
    iconColor: "#3730A3",
    available: 12,
  },
  {
    id: "serrurerie",
    name: "Serrurerie",
    icon: "key",
    bg: "#FDF2F1",
    iconColor: "#D84A3A",
    available: 8,
  },
  {
    id: "electricite",
    name: "Électricité",
    icon: "flash",
    bg: "#FBF5E1",
    iconColor: "#A88F3E",
    available: 6,
  },
  {
    id: "chauffage",
    name: "Chauffage",
    icon: "flame",
    bg: "#FAEEDA",
    iconColor: "#854F0B",
    available: 4,
  },
];

const ALL_CATEGORIES: Category[] = [
  {
    id: "peinture",
    name: "Peinture",
    icon: "color-palette",
    bg: "#E0DDFB",
    iconColor: "#2B2891",
  },
  {
    id: "menuiserie",
    name: "Menuiserie",
    icon: "hammer",
    bg: "#F6E8B8",
    iconColor: "#A88F3E",
  },
  {
    id: "maconnerie",
    name: "Maçonnerie",
    icon: "cube",
    bg: "#EEF0F3",
    iconColor: "#2E2E3E",
  },
  {
    id: "carrelage",
    name: "Carrelage",
    icon: "grid",
    bg: "#E1F5EE",
    iconColor: "#0F6E56",
  },
  {
    id: "platrerie",
    name: "Plâtrerie",
    icon: "albums",
    bg: "#FCE7F3",
    iconColor: "#9F1239",
  },
  {
    id: "climatisation",
    name: "Climatisation",
    icon: "snow",
    bg: "#DBEAFE",
    iconColor: "#1E40AF",
  },
];

/**
 * Extrait un prénom propre depuis un email, ou null si l'email
 * n'a pas de structure permettant un affichage propre.
 */
function deriveFirstName(email: string | undefined): string | null {
  if (!email) return null;
  const prefix = email.split("@")[0];
  const beforeSeparator = prefix.split(/[._-]/)[0];
  const cleaned = beforeSeparator.replace(/[^a-zA-Z]/g, "");
  if (cleaned.length < 2 || cleaned.length > 12) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const firstName = useMemo(() => deriveFirstName(user?.email), [user]);

  const initial = useMemo(() => {
    if (!user?.email) return "?";
    const fromName = deriveFirstName(user.email);
    return (fromName ?? user.email).charAt(0).toUpperCase();
  }, [user]);

  const handleCategory = (category: Category) => {
    Alert.alert(
      category.name,
      `La recherche d'artisans en ${category.name.toLowerCase()} arrive en Phase 1.4. Patience !`,
    );
  };

  const handleSearch = () => {
    Alert.alert(
      "Bientôt disponible",
      "La recherche par mot-clé sera activée en Phase 1.4.",
    );
  };

  const handleLocation = () => {
    Alert.alert(
      "Bientôt disponible",
      "La géolocalisation et la sélection manuelle de zone arrivent bientôt.",
    );
  };

  const handleSeeAll = () => {
    Alert.alert(
      "Bientôt disponible",
      "La liste complète des métiers arrive en Phase 1.4.",
    );
  };

  const handleAccount = () => {
    Alert.alert(
      "Mon compte",
      user?.email ?? "",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: () => signOut(),
        },
      ],
    );
  };

  const handleEmptyCTA = () => {
    Alert.alert(
      "Trouver un artisan",
      "Choisis une catégorie ci-dessus pour démarrer ta recherche.",
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header — localisation + avatar */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.locationPill,
            pressed && styles.pressedSubtle,
          ]}
          onPress={handleLocation}
          accessibilityRole="button"
          accessibilityLabel="Définir ma position"
        >
          <Ionicons
            name="location-outline"
            size={15}
            color={Colors.brand.gray800}
          />
          <Text style={styles.locationText}>Définir ma position</Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={Colors.brand.gray600}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.avatar,
            pressed && styles.pressedSubtle,
          ]}
          onPress={handleAccount}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir mon compte"
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Salutation */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>
            Bonjour{firstName ? ` ${firstName}` : ""} 👋
          </Text>
          <Text style={styles.greetingSubtitle}>
            Quel artisan vous faut-il aujourd&apos;hui ?
          </Text>
        </View>

        {/* Recherche */}
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.pressedSubtle,
          ]}
          accessibilityRole="search"
          accessibilityLabel="Rechercher un métier ou un artisan"
        >
          <Ionicons name="search" size={20} color={Colors.brand.gray400} />
          <Text style={styles.searchPlaceholder}>
            Rechercher un métier ou un artisan
          </Text>
        </Pressable>

        {/* Urgences 24/7 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={11} color={Colors.brand.danger500} />
            </View>
            <Text style={styles.sectionTitle}>Urgences 24/7</Text>
          </View>
        </View>

        <View style={styles.urgentGrid}>
          {URGENT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.urgentCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
            >
              <View style={[styles.urgentIconBox, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon} size={26} color={cat.iconColor} />
              </View>
              <Text style={styles.urgentName}>{cat.name}</Text>
              {cat.available !== undefined && (
                <View style={styles.availabilityRow}>
                  <View style={styles.availabilityDot} />
                  <Text style={styles.availabilityText}>
                    {cat.available} dispos
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Tous les métiers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tous les métiers</Text>
          <Pressable onPress={handleSeeAll} hitSlop={8}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </Pressable>
        </View>

        <View style={styles.allGrid}>
          {ALL_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.allCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
            >
              <View style={[styles.allIconBox, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon} size={22} color={cat.iconColor} />
              </View>
              <Text style={styles.allName}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* RDV à venir — empty state */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vos RDV à venir</Text>
        </View>

        <Pressable
          onPress={handleEmptyCTA}
          style={({ pressed }) => [
            styles.emptyState,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
        >
          <View style={styles.emptyIconBox}>
            <Ionicons
              name="calendar-outline"
              size={26}
              color={Colors.brand.primary500}
            />
          </View>
          <View style={styles.emptyTextBox}>
            <Text style={styles.emptyTitle}>Aucun RDV pour l&apos;instant</Text>
            <Text style={styles.emptySubtitle}>
              Choisis une catégorie ci-dessus pour démarrer.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.brand.gray400}
          />
        </Pressable>

        {/* Footer doré — petite touche de signature de marque */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureDot} />
          <Text style={styles.signatureText}>
            Tous les artisans Najda sont vérifiés
          </Text>
          <View style={styles.signatureDot} />
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brand.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.brand.gray800,
    letterSpacing: -0.1,
  },
  pressedSubtle: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.primary700,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.brand.gold500,
    letterSpacing: -0.5,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  greetingBlock: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -1,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: Colors.brand.gray600,
    fontWeight: "400",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.brand.gray50,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
    marginBottom: Spacing.xl,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: Colors.brand.gray400,
    fontWeight: "400",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgentBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.brand.danger50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.brand.danger100,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.brand.gray900,
    letterSpacing: -0.4,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.brand.primary500,
    letterSpacing: -0.1,
  },

  urgentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  urgentCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand.gray900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  urgentIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  urgentName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.brand.gray900,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.success500,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.brand.success700,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  allGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.xl,
  },
  allCard: {
    flexBasis: "31.5%",
    flexGrow: 1,
    backgroundColor: Colors.brand.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.brand.gray200,
  },
  allIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  allName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.brand.gray900,
    letterSpacing: -0.1,
    textAlign: "center",
  },

  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.brand.primary50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brand.primary100,
    marginBottom: Spacing.xl,
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTextBox: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.brand.primary700,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.brand.primary700,
    opacity: 0.75,
  },

  signatureBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  signatureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.gold500,
  },
  signatureText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.brand.gray400,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
