import { useEffect, useState } from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/constants/theme";
import { getMyProfile } from "@/lib/api";

/**
 * Layout des écrans authentifiés.
 *
 * - Bloque les non-connectés
 * - Vérifie si le profil utilisateur est complet (prénom, nom, téléphone, ville).
 *   Sinon, redirige vers l'onboarding pour collecter ces infos.
 */
export default function AppLayout() {
  const { session, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setProfileComplete(null);
      return;
    }
    let mounted = true;
    getMyProfile()
      .then((p) => {
        if (mounted) setProfileComplete(p?.isComplete ?? false);
      })
      .catch(() => {
        if (mounted) setProfileComplete(true);
      });
    return () => {
      mounted = false;
    };
  }, [session, pathname]);

  if (authLoading || (session && profileComplete === null)) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={brand.primary500} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const isOnboarding = pathname === "/onboarding";

  if (profileComplete === false && !isOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: brand.white },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="onboarding"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="artisans"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="artisan/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="booking/[artisanId]"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="search"
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: brand.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
