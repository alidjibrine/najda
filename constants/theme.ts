import { Platform } from "react-native";

/**
 * Palette de couleurs Najda
 * Bleu confiance comme couleur principale, avec une gamme complète
 * pour les états (urgence, succès, attente) et les neutres.
 */
const brandColors = {
  // Bleu confiance Najda — couleur principale
  primary50: "#E6F0FB",
  primary100: "#C0D8F4",
  primary200: "#8BB7E8",
  primary500: "#1E5FB8", // Couleur principale de la marque
  primary600: "#174A93",
  primary700: "#11366D",
  primary900: "#0A1F40",

  // Rouge urgence — pour le mode dépannage 24/7
  danger50: "#FCEBEB",
  danger500: "#D84A3A",
  danger700: "#7E2A22",

  // Vert succès — pour disponibilité, validation
  success50: "#E1F5EE",
  success500: "#1D9E75",
  success700: "#0F6E56",

  // Orange avertissement — pour créneaux limités, attente
  warning50: "#FAEEDA",
  warning500: "#EF9F27",
  warning700: "#854F0B",

  // Neutres
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F7F8FA",
  gray100: "#EEF0F3",
  gray200: "#D8DCE2",
  gray400: "#9CA3AF",
  gray600: "#6B7280",
  gray800: "#374151",
  gray900: "#111827",
};

const tintColorLight = brandColors.primary500;
const tintColorDark = brandColors.white;

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
    danger: brandColors.danger500,
    success: brandColors.success500,
    warning: brandColors.warning500,
  },

  // Thème sombre
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#0F1419",
    backgroundSecondary: "#1A1F26",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    border: "#2A3038",
    primary: brandColors.primary200,
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
