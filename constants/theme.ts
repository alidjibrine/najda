import { Platform, ViewStyle } from "react-native";

/**
 * Design system Najda.
 *
 * Palette violet (#2B2891) + or (#ECD287) + neutres purs.
 * Philosophie : "confiance silencieuse" — calme, maîtrisé, premium.
 * Le violet est réservé aux actions (CTA, logo, avatar).
 * L'or est réservé aux badges premium et accents de marque.
 * Les neutres purs (non teintés) assurent la lisibilité.
 */

const palette = {
  violet300: "#918AED",
  violet400: "#7063CE",
  violet500: "#2B2891",
  violet900: "#060530",
  gold500: "#ECD287",
  white: "#FFFFFF",
};

export const brand = {
  // Violet Najda
  primary50: "#F5F4FE",
  primary100: "#ECEAFD",
  primary200: "#D5D2FA",
  primary300: palette.violet300,
  primary400: palette.violet400,
  primary500: palette.violet500,
  primary600: "#221F75",
  primary700: "#1A1761",
  primary800: "#110F47",
  primary900: palette.violet900,

  // Or Najda
  gold50: "#FDF9EE",
  gold100: "#F9F0D6",
  gold200: "#F3E3B3",
  gold500: palette.gold500,
  gold700: "#A88F3E",
  gold900: "#5F4D17",

  // Semantic — rouge
  danger50: "#FEF2F2",
  danger100: "#FEE2E2",
  danger500: "#EF4444",
  danger600: "#DC2626",
  danger700: "#B91C1C",

  // Semantic — vert
  success50: "#F0FDF4",
  success100: "#DCFCE7",
  success500: "#22C55E",
  success700: "#15803D",

  // Semantic — orange
  warning50: "#FFFBEB",
  warning500: "#F59E0B",
  warning700: "#B45309",

  // Neutres purs (non teintés violet) pour une lisibilité maximale
  white: "#FFFFFF",
  black: "#000000",
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

/**
 * Espacement — échelle harmonique basée sur 4px.
 */
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

/**
 * Rayons de courbure.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
};

/**
 * Typographie — tailles strictes.
 * 3 niveaux max par écran : display/title, body, caption.
 */
export const text = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 28 },
  "2xl": { fontSize: 24, lineHeight: 32 },
  "3xl": { fontSize: 30, lineHeight: 36 },
  "4xl": { fontSize: 36, lineHeight: 42 },
};

/**
 * Ombres — 3 niveaux normalisés.
 */
export const shadow: Record<string, ViewStyle> = Platform.select({
  ios: {
    sm: {
      shadowColor: brand.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    md: {
      shadowColor: brand.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    lg: {
      shadowColor: brand.primary500,
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

/**
 * Composants — dimensions et styles réutilisables.
 */
export const comp = {
  buttonHeight: 56,
  inputHeight: 52,
  avatarSm: 40,
  avatarMd: 48,
  iconBoxSm: 40,
  iconBoxMd: 48,
  iconBoxLg: 56,
};

/**
 * Thème clair et sombre (pour compatibilité existante).
 */
export const Colors = {
  brand,
  light: {
    text: brand.gray900,
    textSecondary: brand.gray500,
    background: brand.white,
    backgroundSecondary: brand.gray50,
    tint: brand.primary500,
    icon: brand.gray500,
    tabIconDefault: brand.gray400,
    tabIconSelected: brand.primary500,
    border: brand.gray200,
    primary: brand.primary500,
    accent: brand.gold500,
    danger: brand.danger500,
    success: brand.success500,
    warning: brand.warning500,
  },
  dark: {
    text: "#F5F4FE",
    textSecondary: "#A8A4D4",
    background: brand.primary900,
    backgroundSecondary: "#0E0C42",
    tint: brand.gold500,
    icon: "#A8A4D4",
    tabIconDefault: "#7063CE",
    tabIconSelected: brand.gold500,
    border: "#1A1761",
    primary: brand.primary300,
    accent: brand.gold500,
    danger: "#FCA5A5",
    success: "#86EFAC",
    warning: "#FCD34D",
  },
};

// Re-exports legacy pour ne pas casser les imports existants
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
