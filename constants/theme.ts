import { Platform, ViewStyle } from "react-native";

/**
 * NAJDA — Design System "Confiance moderne"
 *
 * Palette validée :
 * - Primaire : bleu nuit profond (#13183F) — confiance, premium
 * - Accent : terracotta (#D97757) — chaleur artisanale, humain
 * - Or : (#C9A961) — badges premium, notes
 * - Surfaces : crème chaud (light) ou bleu nuit profond (dark)
 *
 * Support dark/light via le hook useTheme().
 */

// ============================================================
// PALETTE BRUTE — tokens primitifs (utilisés uniquement par les
// palettes light/dark ci-dessous, jamais directement dans l'UI)
// ============================================================

const palette = {
  // Bleu nuit (primaire)
  navy900: "#0A0E22",
  navy800: "#0F1432",
  navy700: "#13183F", // primaire light
  navy500: "#3A4470", // primaire dark (plus clair pour contraste)
  navy400: "#5F6890",
  navy300: "#8A91AE",
  navy200: "#B4B8CB",
  navy100: "#DCDFE8",
  navy50: "#EEEFF4",

  // Terracotta (accent)
  terra900: "#5C2E1D",
  terra700: "#8C4830",
  terra500: "#D97757", // accent
  terra400: "#E08E72",
  terra300: "#E8A28C",
  terra200: "#F1BFAF",
  terra100: "#F8DFD3",
  terra50: "#FDF1EC",

  // Or (premium)
  gold900: "#4A3A12",
  gold700: "#7D6322",
  gold500: "#C9A961",
  gold300: "#DDC78C",
  gold100: "#F1E8CC",
  gold50: "#FAF6EA",

  // Vert (succès, dispo)
  emerald900: "#064E3B",
  emerald700: "#047857",
  emerald500: "#10B981",
  emerald300: "#6EE7B7",
  emerald100: "#D1FAE5",
  emerald50: "#ECFDF5",

  // Rouge (urgence, erreur)
  red900: "#7F1D1D",
  red700: "#B91C1C",
  red500: "#DC2626",
  red300: "#FCA5A5",
  red100: "#FEE2E2",
  red50: "#FEF2F2",

  // Crème (fonds light)
  cream: "#FAFAF7",
  creamSurface: "#FFFFFF",
  creamElevated: "#F7F7F1",

  // Pures
  white: "#FFFFFF",
  black: "#000000",

  // Gris neutres (textes secondaires)
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

// ============================================================
// PALETTES SÉMANTIQUES — light + dark
// ============================================================

// =============================================================
// Najda v2 — charte blanc dominant + accent dégradé violet
// =============================================================

const lightPalette = {
  // Backgrounds : blanc propre
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFA",
  surfaceMuted: "#F4F4F7",

  // Borders : très discrètes
  border: "rgba(15, 15, 25, 0.08)",
  borderStrong: "rgba(15, 15, 25, 0.16)",

  // Text : presque noir, jamais pur
  text: "#0F0F18",
  textSecondary: "rgba(15, 15, 24, 0.62)",
  textTertiary: "rgba(15, 15, 24, 0.42)",
  textInverse: "#FFFFFF",

  // Brand — violet médian Najda (couleur solide quand pas de dégradé)
  primary: "#7C8FFF",
  primaryHover: "#6B7DEF",
  primaryMuted: "rgba(124, 143, 255, 0.10)",
  primaryText: "#FFFFFF",

  // Accent — lavande
  accent: "#A89BFF",
  accentHover: "#9285F0",
  accentMuted: "rgba(168, 155, 255, 0.10)",
  accentText: "#FFFFFF",
  accentTextOn: "#4A3B8A",

  gold: palette.gold500,
  goldMuted: palette.gold50,
  goldText: palette.gold900,

  // Semantic
  success: palette.emerald500,
  successMuted: palette.emerald50,
  successText: palette.emerald900,

  danger: palette.red500,
  dangerHover: palette.red700,
  dangerMuted: palette.red50,
  dangerText: palette.red900,
};

const darkPalette = {
  // Backgrounds : noir profond, pas pur
  bg: "#0A0A12",
  surface: "#15151C",
  surfaceElevated: "#1F1F28",
  surfaceMuted: "rgba(255, 255, 255, 0.04)",

  // Borders
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.16)",

  // Text
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.65)",
  textTertiary: "rgba(255, 255, 255, 0.40)",
  textInverse: "#0F0F18",

  // Brand — bleu sky plus clair en dark pour le contraste
  primary: "#9BB5FF",
  primaryHover: "#B0C5FF",
  primaryMuted: "rgba(155, 181, 255, 0.15)",
  primaryText: "#0F0F18",

  // Accent — lavande
  accent: "#A89BFF",
  accentHover: "#B8AEFF",
  accentMuted: "rgba(168, 155, 255, 0.15)",
  accentText: "#0F0F18",
  accentTextOn: "#E5DFFF",

  gold: palette.gold300,
  goldMuted: "rgba(201, 169, 97, 0.15)",
  goldText: palette.gold100,

  // Semantic
  success: palette.emerald300,
  successMuted: "rgba(110, 231, 183, 0.15)",
  successText: palette.emerald100,

  danger: palette.red300,
  dangerHover: palette.red500,
  dangerMuted: "rgba(252, 165, 165, 0.15)",
  dangerText: palette.red100,
};

export type SemanticTheme = typeof lightPalette;

// ============================================================
// Dégradé Najda — utilisé par le logo et les CTAs principaux
// ============================================================

/** Stops du dégradé Najda (sky → lavande → violet rose). */
export const najdaGradient = ["#9BB5FF", "#A89BFF", "#C58BEC"] as const;

/** Direction du dégradé : haut-gauche vers bas-droite (135°). */
export const najdaGradientDirection = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

// ============================================================
// EXPORTS
// ============================================================

export const themes = {
  light: lightPalette,
  dark: darkPalette,
};

/** Palette brute — utilisée uniquement pour les références fixes (ex: marker maps). */
export const raw = palette;

/**
 * @deprecated Utilisez useTheme() à la place pour récupérer les couleurs sémantiques.
 * Conservé pour la compatibilité avec les écrans pas encore migrés.
 */
export const brand = {
  primary50: palette.navy50,
  primary100: palette.navy100,
  primary200: palette.navy200,
  primary300: palette.navy300,
  primary400: palette.navy400,
  primary500: palette.navy700,
  primary600: palette.navy800,
  primary700: palette.navy800,
  primary800: palette.navy900,
  primary900: palette.navy900,

  gold50: palette.gold50,
  gold100: palette.gold100,
  gold200: palette.gold300,
  gold500: palette.gold500,
  gold700: palette.gold700,
  gold900: palette.gold900,

  danger50: palette.red50,
  danger100: palette.red100,
  danger200: palette.red300,
  danger500: palette.red500,
  danger600: palette.red700,
  danger700: palette.red900,

  success50: palette.emerald50,
  success100: palette.emerald100,
  success500: palette.emerald500,
  success700: palette.emerald700,

  warning50: palette.terra50,
  warning500: palette.terra500,
  warning700: palette.terra700,

  white: palette.white,
  black: palette.black,
  gray50: palette.cream,
  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray400: palette.gray400,
  gray500: palette.gray500,
  gray600: palette.gray600,
  gray700: palette.gray700,
  gray800: palette.gray800,
  gray900: palette.navy700,

  // Nouveaux tokens utiles
  accent: palette.terra500,
  accentMuted: palette.terra50,
  cream: palette.cream,
};

// ============================================================
// SPACING / RADIUS / TYPO — invariants
// ============================================================

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 56,
  "4xl": 72,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
};

export const text = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 28 },
  "2xl": { fontSize: 24, lineHeight: 32 },
  "3xl": { fontSize: 28, lineHeight: 34 },
  "4xl": { fontSize: 36, lineHeight: 42 },
};

export const shadow: Record<string, ViewStyle> = Platform.select({
  ios: {
    sm: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    lg: {
      shadowColor: palette.navy900,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
  },
  default: {
    sm: { elevation: 1 },
    md: { elevation: 3 },
    lg: { elevation: 6 },
  },
}) as Record<string, ViewStyle>;

export const comp = {
  buttonHeight: 56,
  inputHeight: 52,
  avatarSm: 40,
  avatarMd: 48,
  iconBoxSm: 40,
  iconBoxMd: 48,
  iconBoxLg: 56,
};

// ============================================================
// LEGACY — colors pour compat (à supprimer une fois tout migré)
// ============================================================

export const Colors = {
  brand,
  light: {
    text: lightPalette.text,
    textSecondary: lightPalette.textSecondary,
    background: lightPalette.bg,
    backgroundSecondary: lightPalette.surface,
    tint: lightPalette.primary,
    icon: lightPalette.textSecondary,
    tabIconDefault: lightPalette.textTertiary,
    tabIconSelected: lightPalette.primary,
    border: lightPalette.border,
    primary: lightPalette.primary,
    accent: lightPalette.accent,
    danger: lightPalette.danger,
    success: lightPalette.success,
    warning: lightPalette.accent,
  },
  dark: {
    text: darkPalette.text,
    textSecondary: darkPalette.textSecondary,
    background: darkPalette.bg,
    backgroundSecondary: darkPalette.surface,
    tint: darkPalette.accent,
    icon: darkPalette.textSecondary,
    tabIconDefault: darkPalette.textTertiary,
    tabIconSelected: darkPalette.accent,
    border: darkPalette.border,
    primary: darkPalette.primary,
    accent: darkPalette.accent,
    danger: darkPalette.danger,
    success: darkPalette.success,
    warning: darkPalette.accent,
  },
};

export const Spacing = space;
export const Radius = radius;
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: "System",
    serif: "Georgia",
    rounded: "System",
    mono: "Menlo",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
});
