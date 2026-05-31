/**
 * lib/api-extras.ts
 * Extensions de l'API pour Najda v2 :
 *   - Favoris
 *   - Notifications in-app
 *   - Profil pro étendu + disponibilités
 *   - Actions sur bookings (accept / reject / complete)
 *   - Création d'avis
 *   - Choix du rôle (client / pro)
 */

import { supabase } from "@/lib/supabase";

// =====================================================
// RÔLE
// =====================================================

export type UserRole = "client" | "pro";

export async function setMyRole(role: UserRole): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  // Priorité 1 : utiliser la RPC sécurisée installée par la migration 009
  const { error: rpcError } = await supabase.rpc("set_my_role", {
    new_role: role,
  });
  if (!rpcError) return;

  // Fallback : upsert direct (anciennes installations sans la RPC)
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role }, { onConflict: "id" });
  if (error) throw error;
}

// =====================================================
// FAVORIS
// =====================================================

export type FavoriteRow = {
  user_id: string;
  artisan_id: string;
  created_at: string;
};

export async function getMyFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_favorites")
    .select("artisan_id")
    .eq("user_id", user.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.artisan_id as string);
}

export async function addFavorite(artisanId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { error } = await supabase
    .from("user_favorites")
    .insert({ user_id: user.id, artisan_id: artisanId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeFavorite(artisanId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("artisan_id", artisanId);
  if (error) throw error;
}

export async function toggleFavorite(artisanId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { data: existing } = await supabase
    .from("user_favorites")
    .select("artisan_id")
    .eq("user_id", user.id)
    .eq("artisan_id", artisanId)
    .maybeSingle();
  if (existing) {
    await removeFavorite(artisanId);
    return false;
  } else {
    await addFavorite(artisanId);
    return true;
  }
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export type NotificationType =
  | "booking_request"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_reminder"
  | "booking_completed"
  | "new_message"
  | "review_request"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    data: (n.data as Record<string, unknown>) ?? {},
    read: !!n.read,
    createdAt: n.created_at,
  }));
}

export async function countUnreadNotifications(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) throw error;
}

// =====================================================
// PROFIL PRO
// =====================================================

export interface ProProfile {
  id: string;
  categoryId: string | null;
  city: string | null;
  zoneKm: number;
  priceRange: string;
  priceHourlyEur: number | null;
  bio: string;
  services: string[];
  photos: string[];
  yearsExp: number;
  verified: boolean;
  insured: boolean;
  acceptsEmergency: boolean;
  active: boolean;
}

export async function getMyProProfile(): Promise<ProProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("pro_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    categoryId: data.category_id,
    city: data.city,
    zoneKm: data.zone_km ?? 15,
    priceRange: data.price_range ?? "€€",
    priceHourlyEur: data.price_hourly_eur,
    bio: data.bio ?? "",
    services: data.services ?? [],
    photos: data.photos ?? [],
    yearsExp: data.years_exp ?? 0,
    verified: !!data.verified,
    insured: !!data.insured,
    acceptsEmergency: !!data.accepts_emergency,
    active: data.active !== false,
  };
}

/**
 * Crée/met à jour le record artisan public lié au pro connecté.
 * C'est ce record que les clients voient dans leur recherche.
 */
export async function upsertMyArtisanCard(input: {
  firstName: string;
  lastName: string;
  categoryId: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string;
  services?: string[];
  priceRange?: string;
  yearsExp?: number;
  avatarUrl?: string | null;
}): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const artisanId = `pro-${user.id.replace(/-/g, "").slice(0, 12)}`;
  const initials = `${input.firstName.charAt(0)}${input.lastName.charAt(0)}`.toUpperCase();

  const { error } = await supabase
    .from("artisans")
    .upsert({
      id: artisanId,
      first_name: input.firstName,
      last_name: input.lastName,
      initials,
      category_id: input.categoryId,
      city: input.city,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      bio: input.bio ?? "",
      services: input.services ?? [],
      price_range: input.priceRange ?? "€€",
      years_exp: input.yearsExp ?? 0,
      availability: "today",
      verified: false,
      insured: false,
      rating: 5.0,
      review_count: 0,
      distance_km: 0,
      avatar_url: input.avatarUrl ?? null,
    });
  if (error) throw error;

  // Lier l'artisan au pro_profile
  await supabase
    .from("pro_profiles")
    .update({ artisan_id: artisanId })
    .eq("id", user.id);

  return artisanId;
}

export async function upsertMyProProfile(
  input: Partial<Omit<ProProfile, "id">>,
): Promise<ProProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const row: Record<string, unknown> = { id: user.id };
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.city !== undefined) row.city = input.city;
  if (input.zoneKm !== undefined) row.zone_km = input.zoneKm;
  if (input.priceRange !== undefined) row.price_range = input.priceRange;
  if (input.priceHourlyEur !== undefined)
    row.price_hourly_eur = input.priceHourlyEur;
  if (input.bio !== undefined) row.bio = input.bio;
  if (input.services !== undefined) row.services = input.services;
  if (input.photos !== undefined) row.photos = input.photos;
  if (input.yearsExp !== undefined) row.years_exp = input.yearsExp;
  if (input.acceptsEmergency !== undefined)
    row.accepts_emergency = input.acceptsEmergency;
  if (input.active !== undefined) row.active = input.active;
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("pro_profiles")
    .upsert(row)
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    categoryId: data.category_id,
    city: data.city,
    zoneKm: data.zone_km ?? 15,
    priceRange: data.price_range ?? "€€",
    priceHourlyEur: data.price_hourly_eur,
    bio: data.bio ?? "",
    services: data.services ?? [],
    photos: data.photos ?? [],
    yearsExp: data.years_exp ?? 0,
    verified: !!data.verified,
    insured: !!data.insured,
    acceptsEmergency: !!data.accepts_emergency,
    active: data.active !== false,
  };
}

// =====================================================
// PLANNING — disponibilités hebdomadaires
// =====================================================

export interface AvailabilitySlot {
  id: string;
  proId: string;
  dayOfWeek: number; // 0 = dim, 1 = lun, … 6 = sam
  startTime: string; // "HH:MM"
  endTime: string;
  active: boolean;
}

export async function getProAvailability(
  proId: string,
): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("artisan_availability")
    .select("*")
    .eq("pro_id", proId)
    .eq("active", true)
    .order("day_of_week");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    proId: row.pro_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    active: !!row.active,
  }));
}

export async function setMyAvailability(
  slots: { dayOfWeek: number; startTime: string; endTime: string }[],
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  // Remplacer entièrement les créneaux
  await supabase.from("artisan_availability").delete().eq("pro_id", user.id);
  if (slots.length === 0) return;

  const rows = slots.map((s) => ({
    pro_id: user.id,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    active: true,
  }));
  const { error } = await supabase.from("artisan_availability").insert(rows);
  if (error) throw error;
}

// =====================================================
// ACTIONS sur bookings (côté pro)
// =====================================================

export async function getProIncomingBookings(): Promise<
  { id: string; userId: string; service: string; date: string; time: string; status: string; description: string | null }[]
> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("id, user_id, service, booking_date, booking_time, status, description")
    .eq("pro_id", user.id)
    .order("booking_date", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id,
    userId: b.user_id,
    service: b.service,
    date: b.booking_date,
    time: b.booking_time,
    status: b.status,
    description: b.description,
  }));
}

export async function acceptBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function rejectBooking(
  bookingId: string,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason ?? null,
    })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function completeBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (error) throw error;
}

// =====================================================
// AVIS (création post-mission)
// =====================================================

export async function createReviewForBooking(input: {
  bookingId: string;
  artisanId: string;
  rating: number;
  text: string;
  author: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { error: reviewError } = await supabase.from("reviews").insert({
    booking_id: input.bookingId,
    artisan_id: input.artisanId,
    user_id: user.id,
    rating: input.rating,
    text: input.text,
    author: input.author,
  });
  if (reviewError) throw reviewError;

  // Marquer le booking comme reviewed
  await supabase
    .from("bookings")
    .update({ status: "reviewed" })
    .eq("id", input.bookingId);
}

// =====================================================
// STATS PRO — Tableau de bord
// =====================================================

export interface ProStats {
  pendingCount: number;
  confirmedCount: number;
  todayCount: number;
  completedThisMonth: number;
  earnedThisMonthEur: number;
  earnedAllTimeEur: number;
  rating: number;
  reviewCount: number;
  completionPct: number;
}

/**
 * Calcule un revenu estimé depuis le champ price_estimate (peut être
 * une chaîne libre type "50 €", "120-180 €", "—"). On extrait le
 * premier nombre rencontré.
 */
function parsePriceEur(raw: string | null | undefined): number {
  if (!raw) return 0;
  const match = raw.replace(/\s/g, "").match(/(\d+([.,]\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(",", "."));
}

export async function getProStats(): Promise<ProStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      pendingCount: 0,
      confirmedCount: 0,
      todayCount: 0,
      completedThisMonth: 0,
      earnedThisMonthEur: 0,
      earnedAllTimeEur: 0,
      rating: 0,
      reviewCount: 0,
      completionPct: 0,
    };
  }

  // 1. Toutes les bookings du pro
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("status, booking_date, price_estimate, completed_at")
    .eq("pro_id", user.id);

  const bookings = bookingsData ?? [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter(
    (b) => b.status === "accepted" || b.status === "in_progress",
  ).length;
  const todayCount = bookings.filter(
    (b) =>
      b.booking_date === todayStr &&
      (b.status === "accepted" || b.status === "in_progress"),
  ).length;

  const completedBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "reviewed",
  );
  const completedThisMonth = completedBookings.filter((b) => {
    if (!b.completed_at) return false;
    return new Date(b.completed_at) >= monthStart;
  }).length;

  const earnedThisMonthEur = completedBookings
    .filter((b) => b.completed_at && new Date(b.completed_at) >= monthStart)
    .reduce((acc, b) => acc + parsePriceEur(b.price_estimate), 0);
  const earnedAllTimeEur = completedBookings.reduce(
    (acc, b) => acc + parsePriceEur(b.price_estimate),
    0,
  );

  // 2. Rating depuis l'artisan public
  let rating = 0;
  let reviewCount = 0;
  const { data: artisanLink } = await supabase
    .from("pro_profiles")
    .select("artisan_id")
    .eq("id", user.id)
    .maybeSingle();
  if (artisanLink?.artisan_id) {
    const { data: artisan } = await supabase
      .from("artisans")
      .select("rating, review_count")
      .eq("id", artisanLink.artisan_id)
      .maybeSingle();
    if (artisan) {
      rating = Number(artisan.rating) || 0;
      reviewCount = artisan.review_count ?? 0;
    }
  }

  // 3. Taux de complétion du profil pro
  const { data: pro } = await supabase
    .from("pro_profiles")
    .select("category_id, city, bio, services, photos, years_exp, price_range")
    .eq("id", user.id)
    .maybeSingle();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const checks = [
    !!profile?.first_name,
    !!profile?.last_name,
    !!profile?.phone,
    !!profile?.avatar_url,
    !!pro?.category_id,
    !!pro?.city,
    !!pro?.bio && pro.bio.length > 20,
    (pro?.services ?? []).length > 0,
    (pro?.photos ?? []).length > 0,
    (pro?.years_exp ?? 0) > 0,
  ];
  const completionPct = Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );

  return {
    pendingCount,
    confirmedCount,
    todayCount,
    completedThisMonth,
    earnedThisMonthEur,
    earnedAllTimeEur,
    rating,
    reviewCount,
    completionPct,
  };
}

// =====================================================
// AVIS REÇUS — pour le pro
// =====================================================

export interface ProReview {
  id: string;
  rating: number;
  text: string;
  author: string;
  createdAt: string;
}

export async function getMyReceivedReviews(): Promise<ProReview[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: pro } = await supabase
    .from("pro_profiles")
    .select("artisan_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!pro?.artisan_id) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, author, created_at")
    .eq("artisan_id", pro.artisan_id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return [];

  return (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text ?? "",
    author: r.author,
    createdAt: r.created_at,
  }));
}
