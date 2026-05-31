import { useColorScheme } from "react-native";
import { themes, type SemanticTheme } from "@/constants/theme";

/**
 * Hook qui retourne la palette sémantique active selon le mode système (iOS).
 * Auto-bascule entre light et dark.
 *
 * Usage :
 *   const t = useTheme();
 *   <View style={{ backgroundColor: t.bg, color: t.text }} />
 */
export function useTheme(): SemanticTheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? themes.dark : themes.light;
}

export function useIsDark(): boolean {
  return useColorScheme() === "dark";
}
