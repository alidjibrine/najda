import { supabase } from "./supabase";

/**
 * Couche d'accès aux données de Najda.
 *
 * Centralise toutes les requêtes Supabase. Les types DB (snake_case)
 * sont mappés vers les types UI (camelCase) pour rester cohérent avec
 * le reste de l'app.
 */

// =========================
// Types DB (raw Supabase)
// =========================

type DbArtisan = {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  category_id: string;
  rating: number;
  review_count: number;
  years_exp: number;
  distance_km: number;
  price_range: string | null;
  availability: "now" | "today" | "tomorrow" | "week";
  verified: boolean;
  insured: boolean;
  bio: string | null;
  services: string[];
  created_at: string;
};

type DbReview = {
  id: string;
  artisan_id: string;
  author: string;
  rating: number;
  text: string | null;
  created_at: string;
};

type DbBooking = {
  id: string;
  user_id: string;
  artisan_id: string;
  service: string;
  booking_date: string;
  booking_time: string;
  description: string | null;
  status: BookingStatus;
  price_estimate: string | null;
  acompte: number | null;
  created_at: string;
  updated_at: string;
};

// =========================
// Types UI (camelCase)
// =========================

export type Availability = "now" | "today" | "tomorrow" | "week";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

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
  availability: Availability;
  verified: boolean;
  insured: boolean;
  bio: string;
  services: string[];
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

export type Booking = {
  id: string;
  artisanId: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  description: string;
  status: BookingStatus;
  priceEstimate: string;
  acompte: number;
  createdAt: string;
  artisan: Artisan | null;
};

// =========================
// Helpers
// =========================

export const availabilityLabel: Record<Availability, string> = {
  now: "Disponible maintenant",
  today: "Disponible aujourd'hui",
  tomorrow: "Disponible demain",
  week: "Cette semaine",
};

export const availabilityColor: Record<Availability, string> = {
  now: "#22C55E",
  today: "#22C55E",
  tomorrow: "#F59E0B",
  week: "#9CA3AF",
};

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const bookingStatusColor: Record<BookingStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#22C55E",
  in_progress: "#3B82F6",
  completed: "#6B7280",
  cancelled: "#EF4444",
};

function mapArtisan(db: DbArtisan): Artisan {
  return {
    id: db.id,
    firstName: db.first_name,
    lastName: db.last_name,
    initials: db.initials,
    categoryId: db.category_id,
    rating: Number(db.rating),
    reviewCount: db.review_count,
    yearsExp: db.years_exp,
    distance: Number(db.distance_km),
    priceRange: db.price_range ?? "",
    availability: db.availability,
    verified: db.verified,
    insured: db.insured,
    bio: db.bio ?? "",
    services: db.services,
  };
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 14) return "Il y a 1 semaine";
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 60) return "Il y a 1 mois";
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function mapReview(db: DbReview): Review {
  return {
    id: db.id,
    author: db.author,
    rating: db.rating,
    text: db.text ?? "",
    date: relativeDate(db.created_at),
  };
}

function mapBooking(
  db: DbBooking & { artisan?: DbArtisan | null },
): Booking {
  return {
    id: db.id,
    artisanId: db.artisan_id,
    service: db.service,
    bookingDate: db.booking_date,
    bookingTime: db.booking_time,
    description: db.description ?? "",
    status: db.status,
    priceEstimate: db.price_estimate ?? "",
    acompte: db.acompte != null ? Number(db.acompte) : 0,
    createdAt: db.created_at,
    artisan: db.artisan ? mapArtisan(db.artisan) : null,
  };
}

// =========================
// API Artisans
// =========================

export async function getArtisansByCategory(
  categoryId: string,
): Promise<Artisan[]> {
  const { data, error } = await supabase
    .from("artisans")
    .select("*")
    .eq("category_id", categoryId)
    .order("rating", { ascending: false });

  if (error) throw error;
  return (data as DbArtisan[]).map(mapArtisan);
}

export async function getArtisan(id: string): Promise<Artisan | null> {
  const { data, error } = await supabase
    .from("artisans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapArtisan(data as DbArtisan);
}

export async function getArtisanReviews(artisanId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("artisan_id", artisanId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data as DbReview[]).map(mapReview);
}

// =========================
// API Bookings
// =========================

export async function createBooking(input: {
  artisanId: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  description?: string;
  priceEstimate?: string;
  acompte?: number;
}): Promise<Booking> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté pour réserver.");

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      artisan_id: input.artisanId,
      service: input.service,
      booking_date: input.bookingDate,
      booking_time: input.bookingTime,
      description: input.description ?? null,
      price_estimate: input.priceEstimate ?? null,
      acompte: input.acompte ?? null,
    })
    .select("*, artisan:artisans(*)")
    .single();

  if (error) throw error;
  return mapBooking(data);
}

export async function getMyBookings(
  filter: "upcoming" | "past",
): Promise<Booking[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("bookings")
    .select("*, artisan:artisans(*)")
    .order("booking_date", { ascending: filter === "upcoming" });

  if (filter === "upcoming") {
    query = query
      .gte("booking_date", today)
      .in("status", ["pending", "confirmed", "in_progress"]);
  } else {
    query = query.or(
      `booking_date.lt.${today},status.in.(completed,cancelled)`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as (DbBooking & { artisan: DbArtisan | null })[]).map(
    mapBooking,
  );
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw error;
}

// =========================
// API Profiles
// =========================

type DbProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isComplete: boolean;
};

function mapProfile(db: DbProfile): Profile {
  const profile: Profile = {
    id: db.id,
    firstName: db.first_name ?? "",
    lastName: db.last_name ?? "",
    phone: db.phone ?? "",
    address: db.address ?? "",
    city: db.city ?? "",
    postalCode: db.postal_code ?? "",
    isComplete: false,
  };
  profile.isComplete = !!(
    profile.firstName &&
    profile.lastName &&
    profile.phone &&
    profile.city
  );
  return profile;
}

export async function getMyProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // Crée le profil s'il n'existe pas encore (filet de sécurité)
    const { data: created, error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select()
      .single();
    if (insertErr) throw insertErr;
    return mapProfile(created as DbProfile);
  }
  return mapProfile(data as DbProfile);
}

export async function updateMyProfile(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const update: Record<string, string | null> = {};
  if (input.firstName !== undefined) update.first_name = input.firstName.trim() || null;
  if (input.lastName !== undefined) update.last_name = input.lastName.trim() || null;
  if (input.phone !== undefined) update.phone = input.phone.trim() || null;
  if (input.address !== undefined) update.address = input.address.trim() || null;
  if (input.city !== undefined) update.city = input.city.trim() || null;
  if (input.postalCode !== undefined) update.postal_code = input.postalCode.trim() || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return mapProfile(data as DbProfile);
}

// =========================
// API Search
// =========================

export async function searchArtisans(query: string): Promise<Artisan[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // Recherche dans first_name, last_name, bio, services et category_id
  const pattern = `%${q.toLowerCase()}%`;

  const { data, error } = await supabase
    .from("artisans")
    .select("*")
    .or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},bio.ilike.${pattern},category_id.ilike.${pattern}`,
    )
    .order("rating", { ascending: false })
    .limit(20);

  if (error) throw error;

  // Filtrage supplémentaire côté client pour les services (PostgreSQL array)
  let results = (data as DbArtisan[]).map(mapArtisan);
  const lowerQ = q.toLowerCase();
  const extraMatches = results.filter((a) =>
    a.services.some((s) => s.toLowerCase().includes(lowerQ)),
  );
  // Fusionne (déjà dans results) — pas de doublon ici car même source
  if (extraMatches.length > 0 && results.length === 0) {
    results = extraMatches;
  }

  return results;
}
