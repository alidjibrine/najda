import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "@/contexts/AuthContext";

export const unstable_settings = {
  anchor: "(auth)",
};

/**
 * Layout racine de Najda.
 *
 * Wrappe toute l'app dans le AuthProvider pour que l'état de session
 * soit accessible partout. Définit les deux groupes principaux :
 *   - (auth) : écrans non connectés (login, email)
 *   - (app)  : écrans connectés (home, et tout le reste à venir)
 *
 * Le routage entre les deux groupes est géré par les <Redirect> placés
 * dans les layouts respectifs, en fonction de l'état de session.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
