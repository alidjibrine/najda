import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase pour Najda.
 *
 * Lit l'URL du projet et la clé anon depuis les variables d'environnement
 * définies dans le fichier .env. Configure la persistance de session via
 * AsyncStorage pour que l'utilisateur reste connecté entre les sessions
 * (jusqu'à déconnexion explicite).
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. " +
      "Vérifie que le fichier .env contient EXPO_PUBLIC_SUPABASE_URL " +
      "et EXPO_PUBLIC_SUPABASE_ANON_KEY, puis relance avec `npx expo start --clear`.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
