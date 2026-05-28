/**
 * Données artisans démo pour Najda.
 *
 * Ces données seront remplacées par des requêtes Supabase une fois
 * la base peuplée avec de vrais artisans. Pour l'instant, elles
 * permettent de construire et tester l'interface complète.
 */

export type Artisan = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  yearsExp: number;
  distance: number;
  priceRange: string;
  availability: "now" | "today" | "tomorrow" | "week";
  verified: boolean;
  insured: boolean;
  bio: string;
  services: string[];
  reviews: Review[];
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

const availabilityLabel: Record<Artisan["availability"], string> = {
  now: "Disponible maintenant",
  today: "Disponible aujourd'hui",
  tomorrow: "Disponible demain",
  week: "Cette semaine",
};

const availabilityColor: Record<Artisan["availability"], string> = {
  now: "#22C55E",
  today: "#22C55E",
  tomorrow: "#F59E0B",
  week: "#9CA3AF",
};

export { availabilityLabel, availabilityColor };

export const ARTISANS: Artisan[] = [
  // PLOMBERIE
  {
    id: "p1",
    firstName: "Marc",
    lastName: "Dubois",
    initials: "MD",
    categoryId: "plomberie",
    rating: 4.9,
    reviewCount: 234,
    yearsExp: 12,
    distance: 1.2,
    priceRange: "60 – 180 €",
    availability: "now",
    verified: true,
    insured: true,
    bio: "Plombier indépendant depuis 12 ans, spécialisé dans le dépannage urgent et la rénovation de salles de bain. Intervention rapide, travail soigné.",
    services: ["Fuite d'eau", "Débouchage", "Chauffe-eau", "Robinetterie", "Salle de bain"],
    reviews: [
      { id: "r1", author: "Claire M.", rating: 5, text: "Intervention rapide et propre. Prix très correct.", date: "Il y a 3 jours" },
      { id: "r2", author: "Thomas L.", rating: 5, text: "Excellent travail sur ma salle de bain. Je recommande.", date: "Il y a 1 semaine" },
      { id: "r3", author: "Sophie B.", rating: 4, text: "Bon professionnel, ponctuel et efficace.", date: "Il y a 2 semaines" },
    ],
  },
  {
    id: "p2",
    firstName: "Sofia",
    lastName: "Kessler",
    initials: "SK",
    categoryId: "plomberie",
    rating: 4.8,
    reviewCount: 156,
    yearsExp: 8,
    distance: 2.1,
    priceRange: "70 – 200 €",
    availability: "today",
    verified: true,
    insured: true,
    bio: "Plombière qualifiée RGE. Spécialiste des installations éco-responsables et du remplacement de chauffe-eau thermodynamiques.",
    services: ["Installation sanitaire", "Chauffe-eau", "Économies d'eau", "Dépannage"],
    reviews: [
      { id: "r4", author: "Paul R.", rating: 5, text: "Très professionnelle, bons conseils sur l'installation.", date: "Il y a 5 jours" },
      { id: "r5", author: "Marie D.", rating: 5, text: "Travail impeccable et tarif transparent.", date: "Il y a 2 semaines" },
    ],
  },
  {
    id: "p3",
    firstName: "Julien",
    lastName: "Perrin",
    initials: "JP",
    categoryId: "plomberie",
    rating: 4.7,
    reviewCount: 89,
    yearsExp: 5,
    distance: 3.4,
    priceRange: "55 – 150 €",
    availability: "tomorrow",
    verified: true,
    insured: true,
    bio: "Jeune plombier dynamique. Dépannage rapide et installation neuve. Devis gratuit sous 24h.",
    services: ["Dépannage urgent", "Débouchage", "Fuite", "WC", "Robinet"],
    reviews: [
      { id: "r6", author: "Emma V.", rating: 5, text: "Rapide et pas cher. Super service.", date: "Il y a 1 semaine" },
    ],
  },

  // SERRURERIE
  {
    id: "s1",
    firstName: "Antoine",
    lastName: "Bernard",
    initials: "AB",
    categoryId: "serrurerie",
    rating: 4.9,
    reviewCount: 312,
    yearsExp: 15,
    distance: 0.8,
    priceRange: "80 – 250 €",
    availability: "now",
    verified: true,
    insured: true,
    bio: "Serrurier agréé, intervention en 30 min. Ouverture de porte, changement de serrure, blindage. Tarifs affichés, pas de mauvaise surprise.",
    services: ["Ouverture de porte", "Changement serrure", "Blindage", "Digicode", "Cylindre"],
    reviews: [
      { id: "r7", author: "Lucas P.", rating: 5, text: "Porte ouverte en 20 min sans dégât. Tarif honnête.", date: "Il y a 2 jours" },
      { id: "r8", author: "Julie G.", rating: 5, text: "Très rassurant et professionnel. Merci !", date: "Il y a 1 semaine" },
    ],
  },
  {
    id: "s2",
    firstName: "Nadia",
    lastName: "Hamidi",
    initials: "NH",
    categoryId: "serrurerie",
    rating: 4.8,
    reviewCount: 178,
    yearsExp: 10,
    distance: 1.9,
    priceRange: "90 – 280 €",
    availability: "today",
    verified: true,
    insured: true,
    bio: "Serrurière spécialisée en sécurité haute gamme. Installation de serrures connectées et blindage de portes.",
    services: ["Serrure connectée", "Blindage", "Installation", "Dépannage", "Coffre-fort"],
    reviews: [
      { id: "r9", author: "Pierre C.", rating: 5, text: "Installation parfaite de ma serrure connectée.", date: "Il y a 4 jours" },
    ],
  },

  // ELECTRICITE
  {
    id: "e1",
    firstName: "Karim",
    lastName: "Benali",
    initials: "KB",
    categoryId: "electricite",
    rating: 4.9,
    reviewCount: 267,
    yearsExp: 14,
    distance: 1.5,
    priceRange: "70 – 200 €",
    availability: "now",
    verified: true,
    insured: true,
    bio: "Électricien certifié Qualifelec. Dépannage, mise en conformité, installation complète. Devis gratuit.",
    services: ["Panne électrique", "Tableau", "Prises", "Éclairage", "Mise aux normes"],
    reviews: [
      { id: "r10", author: "Sarah M.", rating: 5, text: "Panne réglée en 1h. Très compétent.", date: "Il y a 3 jours" },
      { id: "r11", author: "David K.", rating: 5, text: "Mise aux normes de mon tableau, travail nickle.", date: "Il y a 2 semaines" },
    ],
  },
  {
    id: "e2",
    firstName: "Claire",
    lastName: "Fontaine",
    initials: "CF",
    categoryId: "electricite",
    rating: 4.7,
    reviewCount: 98,
    yearsExp: 6,
    distance: 2.8,
    priceRange: "65 – 180 €",
    availability: "tomorrow",
    verified: true,
    insured: true,
    bio: "Électricienne spécialisée domotique et éclairage LED. Installation neuve et rénovation.",
    services: ["Domotique", "LED", "Installation neuve", "Rénovation", "Interrupteurs"],
    reviews: [
      { id: "r12", author: "Léa T.", rating: 5, text: "Super installation domotique. Très à l'écoute.", date: "Il y a 1 semaine" },
    ],
  },

  // CHAUFFAGE
  {
    id: "ch1",
    firstName: "Philippe",
    lastName: "Martin",
    initials: "PM",
    categoryId: "chauffage",
    rating: 4.8,
    reviewCount: 198,
    yearsExp: 18,
    distance: 2.0,
    priceRange: "80 – 300 €",
    availability: "today",
    verified: true,
    insured: true,
    bio: "Chauffagiste RGE qualifié. Entretien, dépannage et remplacement de chaudières gaz et fioul. Pompes à chaleur.",
    services: ["Entretien chaudière", "Panne chauffage", "Pompe à chaleur", "Radiateurs", "Plancher chauffant"],
    reviews: [
      { id: "r13", author: "François D.", rating: 5, text: "Entretien annuel parfait, très ponctuel.", date: "Il y a 5 jours" },
      { id: "r14", author: "Isabelle R.", rating: 5, text: "Remplacement chaudière rapide et propre.", date: "Il y a 3 semaines" },
    ],
  },

  // PEINTURE
  {
    id: "pe1",
    firstName: "Alexandre",
    lastName: "Roux",
    initials: "AR",
    categoryId: "peinture",
    rating: 4.9,
    reviewCount: 145,
    yearsExp: 11,
    distance: 3.2,
    priceRange: "40 – 60 €/m²",
    availability: "week",
    verified: true,
    insured: true,
    bio: "Peintre décorateur professionnel. Intérieur et extérieur, enduits décoratifs, papier peint. Finitions soignées.",
    services: ["Peinture intérieure", "Peinture extérieure", "Papier peint", "Enduit décoratif", "Laque"],
    reviews: [
      { id: "r15", author: "Camille L.", rating: 5, text: "Finitions impeccables, un vrai artiste.", date: "Il y a 1 semaine" },
    ],
  },

  // MENUISERIE
  {
    id: "me1",
    firstName: "Laurent",
    lastName: "Chevalier",
    initials: "LC",
    categoryId: "menuiserie",
    rating: 4.8,
    reviewCount: 112,
    yearsExp: 20,
    distance: 4.1,
    priceRange: "Sur devis",
    availability: "week",
    verified: true,
    insured: true,
    bio: "Menuisier ébéniste, fabrication et pose de cuisines, placards et escaliers sur mesure. Bois massif et dérivés.",
    services: ["Cuisine sur mesure", "Placards", "Escaliers", "Portes", "Fenêtres bois"],
    reviews: [
      { id: "r16", author: "Marine S.", rating: 5, text: "Cuisine magnifique, travail d'orfèvre.", date: "Il y a 2 semaines" },
    ],
  },

  // MACONNERIE
  {
    id: "ma1",
    firstName: "Youssef",
    lastName: "Amrani",
    initials: "YA",
    categoryId: "maconnerie",
    rating: 4.7,
    reviewCount: 76,
    yearsExp: 16,
    distance: 5.0,
    priceRange: "Sur devis",
    availability: "week",
    verified: true,
    insured: true,
    bio: "Maçon qualifié, construction et rénovation. Murs, fondations, terrasses, extensions. Devis détaillé gratuit.",
    services: ["Murs", "Fondations", "Terrasses", "Extension", "Ravalement"],
    reviews: [
      { id: "r17", author: "Jean-Pierre M.", rating: 5, text: "Terrasse parfaite, chantier propre.", date: "Il y a 3 semaines" },
    ],
  },

  // CARRELAGE
  {
    id: "ca1",
    firstName: "Roberto",
    lastName: "Silva",
    initials: "RS",
    categoryId: "carrelage",
    rating: 4.9,
    reviewCount: 134,
    yearsExp: 13,
    distance: 2.5,
    priceRange: "45 – 70 €/m²",
    availability: "tomorrow",
    verified: true,
    insured: true,
    bio: "Carreleur mosaïste, pose de tous types de carrelage. Salle de bain, cuisine, terrasse. Découpes complexes maîtrisées.",
    services: ["Carrelage sol", "Carrelage mural", "Mosaïque", "Faïence", "Terrasse extérieure"],
    reviews: [
      { id: "r18", author: "Anne G.", rating: 5, text: "Salle de bain sublimée. Travail de précision.", date: "Il y a 1 semaine" },
    ],
  },

  // CLIMATISATION
  {
    id: "cl1",
    firstName: "Fabien",
    lastName: "Girard",
    initials: "FG",
    categoryId: "climatisation",
    rating: 4.8,
    reviewCount: 92,
    yearsExp: 9,
    distance: 3.0,
    priceRange: "100 – 400 €",
    availability: "today",
    verified: true,
    insured: true,
    bio: "Climaticien certifié. Installation, entretien et dépannage de climatisations réversibles. Devis personnalisé.",
    services: ["Installation clim", "Entretien", "Dépannage", "Clim réversible", "Gainable"],
    reviews: [
      { id: "r19", author: "Stéphane B.", rating: 5, text: "Installation clim parfaite, frais en 2h.", date: "Il y a 4 jours" },
    ],
  },

  // JARDINAGE
  {
    id: "j1",
    firstName: "Élodie",
    lastName: "Mercier",
    initials: "EM",
    categoryId: "jardinage",
    rating: 4.7,
    reviewCount: 67,
    yearsExp: 7,
    distance: 4.5,
    priceRange: "35 – 55 €/h",
    availability: "tomorrow",
    verified: true,
    insured: true,
    bio: "Jardinière paysagiste, entretien et création de jardins. Taille, tonte, plantations, aménagement paysager.",
    services: ["Tonte pelouse", "Taille haies", "Élagage", "Plantation", "Aménagement"],
    reviews: [
      { id: "r20", author: "Patrick V.", rating: 5, text: "Jardin transformé, très créative.", date: "Il y a 2 semaines" },
    ],
  },
];
