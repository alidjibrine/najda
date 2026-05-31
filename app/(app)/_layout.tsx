import { useEffect, useState } from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { FiltersProvider } from "@/contexts/FiltersContext";
import { brand } from "@/constants/theme";
import { getMyProfile, type Profile } from "@/lib/api";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileLoaded(false);
      return;
    }
    let mounted = true;
    getMyProfile()
      .then((p) => {
        if (mounted) {
          setProfile(p);
          setProfileLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setProfile(null);
          setProfileLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [session, pathname]);

  if (authLoading || (session && !profileLoaded)) {
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
  const isRoleSelect = pathname === "/role-select";
  // ATTENTION : /pro vs /profile. Toujours vérifier avec /pro/ ou égalité stricte.
  const isProArea =
    pathname === "/pro" ||
    pathname === "/pro/dashboard" ||
    pathname === "/pro/requests" ||
    pathname === "/pro/planning" ||
    pathname === "/pro/profile" ||
    (pathname?.startsWith("/pro/") ?? false);

  // Pages PARTAGÉES — accessibles par client ET pro depuis n'importe où
  // (sans déclencher un re-routing vers /pro/dashboard ou /(tabs))
  const isShared =
    pathname === "/notifications" ||
    pathname === "/favorites" ||
    pathname === "/profile-edit" ||
    (pathname?.startsWith("/artisan/") ?? false) ||
    (pathname?.startsWith("/conversation/") ?? false) ||
    (pathname?.startsWith("/booking/") ?? false) ||
    (pathname?.startsWith("/reviews/") ?? false);

  // Si pas de profil → choix du rôle
  const needsRole = !profile;
  if (needsRole && !isRoleSelect) {
    return <Redirect href="/(app)/role-select" />;
  }

  // Si profil sans données minimales → onboarding
  const needsOnboarding = profile && !profile.isComplete;
  if (needsOnboarding && !isOnboarding && !isRoleSelect) {
    return <Redirect href="/(app)/onboarding" />;
  }

  // Routing par rôle (uniquement après onboarding complet)
  if (
    profile?.isComplete &&
    profile.role === "pro" &&
    !isProArea &&
    !isOnboarding &&
    !isRoleSelect &&
    !isShared
  ) {
    return <Redirect href="/(app)/pro/dashboard" />;
  }
  if (
    profile?.isComplete &&
    profile.role === "client" &&
    isProArea
  ) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <FiltersProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: brand.white },
        }}
      >
        <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="role-select"
        options={{ gestureEnabled: false, animation: "fade" }}
      />
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
      <Stack.Screen
        name="prestations"
        options={{ animation: "slide_from_right" }}
      />
        <Stack.Screen
          name="conversation/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="pro" />
        <Stack.Screen
          name="favorites"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="reviews/new"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </FiltersProvider>
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
