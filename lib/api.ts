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
  category_ids?: string[] | null;
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
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
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
  categoryIds: string[];
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
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
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
    categoryIds: Array.isArray(db.category_ids) && db.category_ids.length > 0
      ? db.category_ids
      : [db.category_id],
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
    city: db.city ?? null,
    latitude: db.latitude != null ? Number(db.latitude) : null,
    longitude: db.longitude != null ? Number(db.longitude) : null,
    avatarUrl: db.avatar_url ?? null,
  };
}

export async function getAllArtisans(): Promise<Artisan[]> {
  const { data, error } = await supabase
    .from("artisans")
    .select("*")
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data as DbArtisan[]).map(mapArtisan);
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
  filters?: { service?: string },
): Promise<Artisan[]> {
  // Supporte multi-métiers : on cherche dans category_id OU category_ids
  // (OR sur le serveur via or() pour ne pas faire 2 requêtes)
  let query = supabase
    .from("artisans")
    .select("*")
    .or(`category_id.eq.${categoryId},category_ids.cs.{"${categoryId}"}`);

  if (filters?.service) {
    query = query.contains("services", [filters.service]);
  }

  const { data, error } = await query.order("rating", { ascending: false });
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

export async function getTopArtisans(limit: number = 6): Promise<Artisan[]> {
  const { data, error } = await supabase
    .from("artisans")
    .select("*")
    .eq("verified", true)
    .order("rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as DbArtisan[]).map(mapArtisan);
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
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = "client" | "pro";

export type Profile = {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  avatarUrl: string | null;
  isComplete: boolean;
};

function mapProfile(db: DbProfile & { role?: string }): Profile {
  const role: UserRole = db.role === "pro" ? "pro" : "client";
  const profile: Profile = {
    id: db.id,
    role,
    firstName: db.first_name ?? "",
    lastName: db.last_name ?? "",
    phone: db.phone ?? "",
    address: db.address ?? "",
    city: db.city ?? "",
    postalCode: db.postal_code ?? "",
    avatarUrl: db.avatar_url ?? null,
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
  avatarUrl?: string | null;
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
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl;

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
// Messagerie
// =========================

type DbConversation = {
  id: string;
  booking_id: string;
  user_id: string;
  artisan_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  user_unread_count: number;
  created_at: string;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_type: "user" | "artisan" | "system";
  text: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  bookingId: string;
  artisanId: string;
  artisan: Artisan | null;
  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderType: "user" | "artisan" | "system";
  text: string;
  createdAt: string;
};

function mapConversation(
  db: DbConversation & { artisan?: DbArtisan | null },
): Conversation {
  return {
    id: db.id,
    bookingId: db.booking_id,
    artisanId: db.artisan_id,
    artisan: db.artisan ? mapArtisan(db.artisan) : null,
    lastMessageText: db.last_message_text ?? "",
    lastMessageAt: db.last_message_at,
    unreadCount: db.user_unread_count,
    createdAt: db.created_at,
  };
}

function mapMessage(db: DbMessage): Message {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    senderType: db.sender_type,
    text: db.text,
    createdAt: db.created_at,
  };
}

export async function getMyConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, artisan:artisans(*)")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data as (DbConversation & { artisan: DbArtisan | null })[]).map(
    mapConversation,
  );
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, artisan:artisans(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapConversation(data as DbConversation & { artisan: DbArtisan | null });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbMessage[]).map(mapMessage);
}

export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<Message> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message vide.");
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "user",
      text: trimmed,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data as DbMessage);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ user_unread_count: 0 })
    .eq("id", conversationId);
  if (error) throw error;
}

/**
 * S'abonne aux nouveaux messages d'une conversation en temps réel.
 * Retourne la fonction de nettoyage à appeler dans le cleanup useEffect.
 */
export function subscribeToConversation(
  conversationId: string,
  onNewMessage: (msg: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(mapMessage(payload.new as DbMessage));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =========================
// Avatar (Storage)
// =========================

import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

/**
 * Upload une photo de profil dans le bucket "avatars".
 * Path: {userId}/avatar.{ext}
 * Met à jour profiles.avatar_url avec l'URL publique (avec cache buster).
 */
export async function uploadAvatar(localUri: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const extMatch = localUri.match(/\.(\w+)(\?.*)?$/);
  const ext = (extMatch?.[1] ?? "jpg").toLowerCase();
  const safeExt = ext === "jpeg" ? "jpg" : ext;
  const filePath = `${user.id}/avatar.${safeExt}`;
  const contentType =
    safeExt === "png" ? "image/png" : safeExt === "webp" ? "image/webp" : "image/jpeg";

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(filePath, decode(base64), {
      contentType,
      upsert: true,
    });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Cache buster pour forcer le rafraîchissement client après modification
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await updateMyProfile({ avatarUrl: publicUrl });
  return publicUrl;
}

/**
 * Supprime la photo de profil (fichier Storage + champ avatar_url).
 */
export async function deleteAvatar(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  // Tente de supprimer les extensions courantes
  const candidates = ["jpg", "png", "webp"].map((e) => `${user.id}/avatar.${e}`);
  await supabase.storage.from("avatars").remove(candidates);

  await updateMyProfile({ avatarUrl: null });
}

// =========================
// API Search
// =========================

export type SearchFilters = {
  query?: string;
  categoryId?: string;
  availableNow?: boolean;
  verifiedOnly?: boolean;
  topRated?: boolean;
};

export async function searchArtisans(filters: SearchFilters = {}): Promise<Artisan[]> {
  let req = supabase.from("artisans").select("*");

  // Filtre catégorie
  if (filters.categoryId) {
    // Supporte multi-métiers : match category_id OR contient le métier dans category_ids
    req = req.or(
      `category_id.eq.${filters.categoryId},category_ids.cs.{"${filters.categoryId}"}`,
    );
  }

  // Filtre vérifié
  if (filters.verifiedOnly) {
    req = req.eq("verified", true);
  }

  // Filtre dispo maintenant (now ou today)
  if (filters.availableNow) {
    req = req.in("availability", ["now", "today"]);
  }

  // Top rated (note >= 4.7)
  if (filters.topRated) {
    req = req.gte("rating", 4.7);
  }

  // Recherche libre
  const q = filters.query?.trim() ?? "";
  if (q.length >= 2) {
    const pattern = `%${q.toLowerCase()}%`;
    req = req.or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},bio.ilike.${pattern},category_id.ilike.${pattern}`,
    );
  }

  req = req.order("rating", { ascending: false }).limit(50);

  const { data, error } = await req;
  if (error) throw error;

  let results = (data as DbArtisan[]).map(mapArtisan);

  // Filtrage supplémentaire côté client pour les services
  // (PostgreSQL array recherche partielle pas dispo en RLS pour `services`)
  if (q.length >= 2) {
    const lowerQ = q.toLowerCase();
    const all = results;
    const serviceMatches = all.filter((a) =>
      a.services.some((sv) => sv.toLowerCase().includes(lowerQ)),
    );
    if (serviceMatches.length > 0) {
      const ids = new Set(results.map((r) => r.id));
      for (const m of serviceMatches) if (!ids.has(m.id)) results.push(m);
    }
  }

  return results;
}
