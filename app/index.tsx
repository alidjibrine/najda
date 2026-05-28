import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

/**
 * Point d'entrée de Najda.
 *
 * Affiche un loader pendant que l'état de session est vérifié,
 * puis redirige vers le bon groupe selon que l'utilisateur est
 * authentifié ou non.
 */
export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.brand.primary500} />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(app)/(tabs)" />
  ) : (
    <Redirect href="/(auth)/splash" />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
