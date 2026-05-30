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
