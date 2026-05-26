import { Tabs } from "expo-router";
import React from "react";

/**
 * Layout des onglets de Najda.
 *
 * Pour l'instant, la barre d'onglets est masquée car on se trouve
 * sur l'écran de connexion. Elle réapparaîtra automatiquement
 * après l'authentification, quand l'utilisateur accédera aux
 * vrais écrans de l'app (Accueil, Recherche, RDV, Compte).
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    />
  );
}
