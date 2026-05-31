import type { Ionicons } from "@expo/vector-icons";

export type CategoryInfo = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  urgent?: boolean;
};

export const CATEGORIES: CategoryInfo[] = [
  { id: "plomberie", name: "Plomberie", icon: "water", bg: "#DBEAFE", iconColor: "#1D4ED8", urgent: true },
  { id: "serrurerie", name: "Serrurerie", icon: "key", bg: "#FEE2E2", iconColor: "#DC2626", urgent: true },
  { id: "electricite", name: "Électricité", icon: "flash", bg: "#FEF3C7", iconColor: "#B45309", urgent: true },
  { id: "chauffage", name: "Chauffage", icon: "flame", bg: "#FFEDD5", iconColor: "#C2410C", urgent: true },
  { id: "peinture", name: "Peinture", icon: "color-palette-outline", bg: "#EDE9FE", iconColor: "#6D28D9" },
  { id: "menuiserie", name: "Menuiserie", icon: "hammer-outline", bg: "#FDF9EE", iconColor: "#A88F3E" },
  { id: "maconnerie", name: "Maçonnerie", icon: "cube-outline", bg: "#F3F4F6", iconColor: "#374151" },
  { id: "carrelage", name: "Carrelage", icon: "grid-outline", bg: "#D1FAE5", iconColor: "#047857" },
  { id: "climatisation", name: "Climatisation", icon: "snow-outline", bg: "#E0F2FE", iconColor: "#0369A1" },
  { id: "jardinage", name: "Jardinage", icon: "leaf-outline", bg: "#DCFCE7", iconColor: "#15803D" },
];

/**
 * Sous-services par catégorie (matche le champ `services` des artisans).
 */
export const SUBCATEGORIES: Record<string, string[]> = {
  plomberie: ["Fuite d'eau", "Débouchage", "Chauffe-eau", "Robinetterie", "Salle de bain", "WC", "Robinet"],
  serrurerie: ["Ouverture de porte", "Changement serrure", "Blindage", "Digicode", "Cylindre", "Coffre-fort", "Serrure connectée"],
  electricite: ["Panne électrique", "Tableau", "Prises", "Éclairage", "Mise aux normes", "Domotique", "LED"],
  chauffage: ["Entretien chaudière", "Panne chauffage", "Pompe à chaleur", "Radiateurs", "Plancher chauffant"],
  peinture: ["Peinture intérieure", "Peinture extérieure", "Papier peint", "Enduit décoratif", "Laque"],
  menuiserie: ["Cuisine sur mesure", "Placards", "Escaliers", "Portes", "Fenêtres bois"],
  maconnerie: ["Murs", "Fondations", "Terrasses", "Extension", "Ravalement"],
  carrelage: ["Carrelage sol", "Carrelage mural", "Mosaïque", "Faïence", "Terrasse extérieure"],
  climatisation: ["Installation clim", "Entretien", "Dépannage", "Clim réversible", "Gainable"],
  jardinage: ["Tonte pelouse", "Taille haies", "Élagage", "Plantation", "Aménagement"],
};

export function getSubcategories(categoryId: string | null): string[] {
  if (!categoryId) return [];
  return SUBCATEGORIES[categoryId] ?? [];
}

export function getCategory(id: string | null): CategoryInfo | null {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * Durée moyenne estimée d'une intervention par catégorie (en minutes).
 * Sert à calculer l'heure de fin dans le flux de réservation.
 */
export const DEFAULT_DURATION_MIN: Record<string, number> = {
  plomberie: 90,
  serrurerie: 60,
  electricite: 120,
  chauffage: 120,
  peinture: 240,
  menuiserie: 180,
  maconnerie: 240,
  carrelage: 180,
  climatisation: 180,
  jardinage: 120,
};

/**
 * Options de durée que l'utilisateur peut choisir explicitement
 * (au cas où il connaît mieux son besoin que la valeur par défaut).
 */
export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: "1 heure" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 heures" },
  { value: 180, label: "3 heures" },
  { value: 240, label: "Demi-journée" },
  { value: 480, label: "Journée entière" },
];

/**
 * Petite description évocatrice par catégorie (sert dans les cards).
 */
export const CATEGORY_TAGLINE: Record<string, string> = {
  plomberie: "Fuites, débouchages, sanitaires",
  serrurerie: "Portes, serrures, dépannage",
  electricite: "Pannes, mise aux normes, domotique",
  chauffage: "Chaudières, pompes à chaleur",
  peinture: "Intérieur, extérieur, déco",
  menuiserie: "Cuisines, placards, escaliers",
  maconnerie: "Murs, terrasses, extensions",
  carrelage: "Sol, mural, faïence",
  climatisation: "Installation, entretien, dépannage",
  jardinage: "Tonte, taille, aménagement",
};

/**
 * Couleur d'accent par métier, toujours dans la palette Najda
 * (variations bleu / violet / lavande). Sobre, jamais saturé.
 * `bg` = fond pastel · `icon` = couleur de l'icône.
 */
export const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  plomberie:     { bg: "#E6EEFF", icon: "#5B7DD4" }, // bleu eau
  serrurerie:    { bg: "#EAE6FF", icon: "#6F5FCC" }, // violet sécurité
  electricite:   { bg: "#EFE7FF", icon: "#8B7BE8" }, // lavande énergie
  chauffage:     { bg: "#F4E8F5", icon: "#A87BC8" }, // mauve chaleur
  peinture:      { bg: "#F6E7F3", icon: "#B870C0" }, // rose violet créatif
  menuiserie:    { bg: "#E7EAFC", icon: "#5F6BB8" }, // indigo artisanal
  maconnerie:    { bg: "#EAE9F0", icon: "#7A7793" }, // gris violet pierre
  carrelage:     { bg: "#E3ECFB", icon: "#4F77C0" }, // bleu acier géométrique
  climatisation: { bg: "#E1E9F7", icon: "#6F8BC0" }, // bleu glace
  jardinage:     { bg: "#E4ECEC", icon: "#6B8585" }, // vert sourd dans la famille
};
