import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

/**
 * Layout du groupe (app) — écrans accessibles UNIQUEMENT aux utilisateurs
 * authentifiés. Sans session, on redirige automatiquement vers le login.
 */
export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.brand.primary500} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
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
