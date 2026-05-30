import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Stockage local Najda (préférences utilisateur).
 */

const CITY_KEY = "@najda/city";
const FILTER_KEY = "@najda/quickFilter";

export const POPULAR_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Nice",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Toute la France",
];

export async function getStoredCity(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export async function setStoredCity(city: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CITY_KEY, city);
  } catch {
    // ignore
  }
}

export type QuickFilter = "all" | "now" | "verified" | "topRated";

export async function getStoredFilter(): Promise<QuickFilter> {
  try {
    const v = await AsyncStorage.getItem(FILTER_KEY);
    if (v === "now" || v === "verified" || v === "topRated") return v;
    return "all";
  } catch {
    return "all";
  }
}

export async function setStoredFilter(filter: QuickFilter): Promise<void> {
  try {
    await AsyncStorage.setItem(FILTER_KEY, filter);
  } catch {
    // ignore
  }
}
