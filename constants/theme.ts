import { Platform } from "react-native";

/**
 * Palette de couleurs Najda
 *
 * Identité visuelle : violet profond (confiance, modernité) + or (premium,
 * service haut de gamme) + neutres riches. Le contraste violet/or est la
 * signature de la marque, à réserver aux éléments forts (logo, badges
 * premium, accents).
 */
const brandColors = {
  // Violet Najda — couleur principale de la marque
  primary50: "#F4F3FE",
  primary100: "#E0DDFB",
  primary200: "#C0BCF6",
  primary300: "#918AED", // Fourni — violet clair
  primary400: "#7063CE", // Fourni — violet moyen
  primary500: "#2B2891", // Fourni — violet profond, signature
  primary700: "#1A1761",
  primary900: "#060530", // Fourni — quasi-noir teinté violet

  // Or Najda — accent premium (badges, CTA spéciaux, finitions)
  gold50: "#FBF5E1",
  gold100: "#F6E8B8",
  gold200: "#F1DC9C",
  gold500: "#ECD287", // Fourni — or signature
  gold700: "#A88F3E",
  gold900: "#5F4D17",

  // Rouge urgence — mode dépannage 24/7
  danger50: "#FDF2F1",
  danger100: "#FBE1DE",
  danger200: "#F4B5AE",
  danger500: "#D84A3A",
  danger700: "#7E2A22",

  // Vert succès — disponibilité, validation
  success50: "#E1F5EE",
  success500: "#1D9E75",
  success700: "#0F6E56",

  // Orange avertissement — créneaux limités
  warning50: "#FAEEDA",
  warning500: "#EF9F27",
  warning700: "#854F0B",

  // Neutres — basés sur le quasi-noir Najda pour une cohérence chromatique
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F7F8FA",
  gray100: "#EEF0F3",
  gray200: "#D8DCE2",
  gray300: "#C0C5CC",
  gray400: "#9CA3AF",
  gray600: "#6B7280",
  gray800: "#2E2E3E",
  gray900: "#060530", // Reprise du primary900 pour unifier
};

const tintColorLight = brandColors.primary500;
const tintColorDark = brandColors.gold500;

export const Colors = {
  // Couleurs de marque accessibles partout via Colors.brand.xxx
  brand: brandColors,

  // Thème clair (par défaut)
  light: {
    text: brandColors.gray900,
    textSecondary: brandColors.gray600,
    background: brandColors.white,
    backgroundSecondary: brandColors.gray50,
    tint: tintColorLight,
    icon: brandColors.gray600,
    tabIconDefault: brandColors.gray400,
    tabIconSelected: tintColorLight,
    border: brandColors.gray200,
    primary: brandColors.primary500,
    accent: brandColors.gold500,
    danger: brandColors.danger500,
    success: brandColors.success500,
    warning: brandColors.warning500,
  },

  // Thème sombre
  dark: {
    text: "#F4F3FE",
    textSecondary: "#A8A4D4",
    background: brandColors.primary900,
    backgroundSecondary: "#0E0C42",
    tint: tintColorDark,
    icon: "#A8A4D4",
    tabIconDefault: "#7063CE",
    tabIconSelected: tintColorDark,
    border: "#1A1761",
    primary: brandColors.primary300,
    accent: brandColors.gold500,
    danger: "#F09595",
    success: "#5DCAA5",
    warning: "#FAC775",
  },
};

/**
 * Espacement standard
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Rayons de courbure
 */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * Tailles de police
 */
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
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'ui-serif, Georgia, "Times New Roman", serif',
    rounded:
      'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, "Menlo", monospace',
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
