import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

/**
 * Layout du groupe (auth) — écrans accessibles UNIQUEMENT aux utilisateurs
 * non connectés. Si une session est détectée, on redirige automatiquement
 * vers le groupe (app).
 */
export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.brand.primary500} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.brand.white },
      }}
    />
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
