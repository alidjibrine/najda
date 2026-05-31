import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Circle, Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  space,
  radius,
  shadow,
  text as T,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getMyProfile,
  getAllArtisans,
  getMyBookings,
  availabilityLabel,
  type Profile,
  type Artisan,
  type Booking,
} from "@/lib/api";
import { CATEGORIES, getCategory } from "@/constants/categories";
import { Avatar } from "@/components/Avatar";
import { useFilters } from "@/contexts/FiltersContext";

const DEFAULT_REGION: Region = {
  latitude: 45.764,
  longitude: 4.8357,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

// =====================================================
// Haversine — distance en km entre 2 coordonnées GPS
// =====================================================
function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function isAvailable(a: Artisan): boolean {
  return a.availability === "now" || a.availability === "today";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userAddress, setUserAddress] = useState<string>("Localisation…");
  const [userCity, setUserCity] = useState<string | null>(null);

  // ===== Filtres partagés via context =====
  const {
    radiusKm,
    onlyAvailable,
    onlyVerified,
    setRadiusKm,
    setOnlyAvailable,
    setOnlyVerified,
    reset: resetFilters,
    activeCount: activeFilterCount,
  } = useFilters();
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // ===== GPS + reverse geocoding au mount =====
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setUserAddress("Position non autorisée");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coords);

        // Reverse geocode pour obtenir l'adresse précise
        try {
          const results = await Location.reverseGeocodeAsync(coords);
          const addr = results[0];
          if (addr) {
            const street = addr.street ?? addr.name ?? "";
            const numStreet = addr.streetNumber
              ? `${addr.streetNumber} ${street}`.trim()
              : street;
            const city = addr.city ?? addr.subregion ?? "";
            const formatted = [numStreet, city].filter(Boolean).join(", ");
            if (formatted) setUserAddress(formatted);
            if (city) setUserCity(city);
          }
        } catch {
          setUserAddress("Position détectée");
        }

        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          });
        }, 500);
      } catch {
        setUserAddress("Position indisponible");
      }
    })();
  }, []);

  // ===== Data =====
  const loadData = useCallback(async () => {
    const [p, ars, bookings] = await Promise.all([
      getMyProfile(),
      getAllArtisans(),
      getMyBookings("upcoming"),
    ]);
    setProfile(p);
    setArtisans(ars);
    setUpcomingBooking(bookings[0] ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => {});
      return () => {};
    }, [loadData]),
  );

  // ===== Tri proximité + dispo =====
  const geoArtisans = useMemo(
    () => artisans.filter((a) => a.latitude != null && a.longitude != null),
    [artisans],
  );

  const nearbyArtisans = useMemo(() => {
    if (!userLocation) return geoArtisans;
    return [...geoArtisans]
      .map((a) => ({
        ...a,
        _dist: distanceKm(userLocation, {
          latitude: a.latitude!,
          longitude: a.longitude!,
        }),
      }))
      .filter((a) => a._dist <= radiusKm)
      .filter((a) => (onlyAvailable ? isAvailable(a) : true))
      .filter((a) => (onlyVerified ? a.verified : true))
      .sort((a, b) => {
        const ad = isAvailable(a) ? 0 : 1;
        const bd = isAvailable(b) ? 0 : 1;
        if (ad !== bd) return ad - bd;
        return a._dist - b._dist;
      });
  }, [geoArtisans, userLocation, radiusKm, onlyAvailable, onlyVerified]);

  // Top 5 dans la ville (sinon fallback dans le rayon)
  const top5InCity = useMemo(() => {
    if (userCity) {
      const inCity = artisans.filter(
        (a) =>
          a.city && a.city.toLowerCase() === userCity.toLowerCase(),
      );
      if (inCity.length > 0) {
        return [...inCity].sort((a, b) => b.rating - a.rating).slice(0, 5);
      }
    }
    return [...nearbyArtisans]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [artisans, nearbyArtisans, userCity]);

  const mapMarkers = nearbyArtisans.slice(0, 14);


  // ===== Urgences avec compteur dispo =====
  const urgentCats = CATEGORIES.filter((c) => c.urgent);
  const urgentCounts = useMemo(() => {
    const m = new Map<string, number>();
    urgentCats.forEach((cat) => {
      const count = artisans.filter(
        (a) => a.categoryId === cat.id && isAvailable(a),
      ).length;
      m.set(cat.id, count);
    });
    return m;
  }, [artisans, urgentCats]);

  // ===== Identité utilisateur =====
  const firstName = useMemo(() => {
    if (profile?.firstName) return profile.firstName;
    if (user?.email) {
      const prefix = user.email.split("@")[0];
      const clean = prefix.replace(/[^a-zA-Z]/g, "").slice(0, 12);
      if (clean.length >= 2)
        return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return "";
  }, [profile, user]);

  const fullName = useMemo(() => {
    if (profile?.firstName && profile?.lastName)
      return `${profile.firstName} ${profile.lastName}`;
    return firstName;
  }, [profile, firstName]);

  const userInitial = (
    profile?.firstName?.charAt(0) ??
    user?.email?.charAt(0) ??
    "?"
  ).toUpperCase();

  // ===== Navigation =====
  const openProfile = () => router.push("/(app)/(tabs)/profile");
  const openSearch = () => router.push("/(app)/search");
  const openPrestations = () => router.push("/(app)/prestations");
  const openArtisan = (id: string) =>
    router.push({ pathname: "/(app)/artisan/[id]", params: { id } });
  const openBookings = () => router.push("/(app)/(tabs)/bookings");
  const openCategory = (cId: string, name: string) =>
    router.push({
      pathname: "/(app)/artisans",
      params: { category: cId, categoryName: name },
    });
  const openFilters = () => setFilterOpen(true);
  const closeFilters = () => setFilterOpen(false);

  // Calcul du delta map pour englober tout le cercle de rayon
  const mapDelta = useMemo(() => {
    const km = radiusKm * 2.4; // facteur visuel : un peu plus large que le diamètre
    return Math.max(km / 111, 0.04);
  }, [radiusKm]);

  const initialRegion: Region = userLocation
    ? { ...userLocation, latitudeDelta: mapDelta, longitudeDelta: mapDelta }
    : DEFAULT_REGION;

  // Recentre la map quand le rayon change
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: mapDelta, longitudeDelta: mapDelta },
        500,
      );
    }
  }, [mapDelta, userLocation]);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* ============= DÉGRADÉ TOP ============= */}
      <LinearGradient
        colors={[
          "rgba(155,181,255,0.30)",
          "rgba(168,155,255,0.18)",
          "rgba(197,139,236,0.08)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.topGradient, { height: 280 + insets.top }]}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ============= HEADER : Avatar + Nom/Adresse + Search + Notif ============= */}
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={s.header}
          >
            <Pressable style={s.headerLeft} onPress={openProfile}>
              <Avatar
                uri={profile?.avatarUrl}
                initials={userInitial}
                size={44}
              />
              <View style={s.headerInfo}>
                <Text
                  style={[s.hello, { color: t.text }]}
                  numberOfLines={1}
                >
                  Bonjour{firstName ? `, ${firstName}` : ""}
                </Text>
                <View style={s.addressRow}>
                  <Ionicons
                    name="location"
                    size={11}
                    color={t.primary}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={[s.addressTxt, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    {userAddress}
                  </Text>
                </View>
              </View>
            </Pressable>

            <View style={s.headerRight}>
              <Pressable
                onPress={openSearch}
                style={({ pressed }) => [
                  s.iconBtn,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && s.pressed,
                ]}
                hitSlop={6}
              >
                <Ionicons name="search" size={18} color={t.text} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(app)/notifications")}
                style={({ pressed }) => [
                  s.iconBtn,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && s.pressed,
                ]}
                hitSlop={6}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={t.text}
                />
              </Pressable>
            </View>
          </Animated.View>

          {/* ============= RDV à venir ============= */}
          {upcomingBooking && (
            <Animated.View entering={FadeInDown.delay(140).duration(450)}>
              <Pressable
                style={({ pressed }) => [
                  s.upcomingCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                  pressed && s.pressed,
                ]}
                onPress={openBookings}
              >
                <View style={s.upcomingDot}>
                  <View style={[s.dotInner, { backgroundColor: t.primary }]} />
                  <View style={[s.dotRing, { borderColor: t.primary }]} />
                </View>
                <View style={s.upcomingInfo}>
                  <Text
                    style={[s.upcomingLabel, { color: t.textSecondary }]}
                  >
                    Prochain rendez-vous
                  </Text>
                  <Text
                    style={[s.upcomingTitle, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {upcomingBooking.serviceName ?? "Intervention"}
                    {upcomingBooking.artisanName
                      ? ` · ${upcomingBooking.artisanName}`
                      : ""}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={t.textTertiary}
                />
              </Pressable>
            </Animated.View>
          )}

          {/* ============= URGENCES ============= */}
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <View style={s.sectionHead}>
              <Text style={[s.sectionTitle, { color: t.text }]}>Urgences</Text>
              <Text style={[s.sectionSub, { color: t.textSecondary }]}>
                Disponibles maintenant
              </Text>
            </View>

            <View style={s.urgentGrid}>
              {urgentCats.map((cat) => {
                const count = urgentCounts.get(cat.id) ?? 0;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => openCategory(cat.id, cat.name)}
                    style={({ pressed }) => [
                      s.urgentCard,
                      {
                        backgroundColor: t.surface,
                        borderColor: t.border,
                      },
                      pressed && s.pressed,
                    ]}
                  >
                    <View
                      style={[
                        s.urgentIconBox,
                        { backgroundColor: t.primaryMuted },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={20}
                        color={t.primary}
                      />
                    </View>
                    <Text
                      style={[s.urgentName, { color: t.text }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <View style={s.urgentMeta}>
                      <View
                        style={[
                          s.availDot,
                          {
                            backgroundColor:
                              count > 0 ? "#10B981" : t.textTertiary,
                          },
                        ]}
                      />
                      <Text
                        style={[s.urgentCount, { color: t.textSecondary }]}
                        numberOfLines={1}
                      >
                        {count > 0
                          ? `${count} disponible${count > 1 ? "s" : ""}`
                          : "Aucun pour l'instant"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ============= MAP (autour de vous) ============= */}
          <Animated.View entering={FadeInDown.delay(280).duration(450)}>
            <View style={s.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[s.sectionTitle, { color: t.text }]}>
                  Autour de vous
                </Text>
                <Text
                  style={[s.sectionSub, { color: t.textSecondary }]}
                  numberOfLines={1}
                >
                  {userLocation
                    ? `Les pros les plus proches d'ici`
                    : `Recherche de votre position…`}
                </Text>
              </View>
              <Pressable
                onPress={openFilters}
                style={({ pressed }) => [
                  s.filterBtn,
                  { borderColor: t.border, backgroundColor: t.surface },
                  pressed && s.pressed,
                ]}
                hitSlop={4}
              >
                <Ionicons name="options-outline" size={16} color={t.text} />
                <Text style={[s.filterTxt, { color: t.text }]}>
                  {radiusKm} km
                </Text>
                {activeFilterCount > 0 && (
                  <View style={[s.filterBadge, { backgroundColor: t.primary }]}>
                    <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={[s.mapWrap, { borderColor: t.border }]}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={s.map}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                showsBuildings={false}
                showsTraffic={false}
                showsIndoors={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {/* Cercle de rayon — affiche visuellement le diamètre de recherche */}
                {userLocation && (
                  <Circle
                    center={userLocation}
                    radius={radiusKm * 1000}
                    strokeColor={t.primary}
                    strokeWidth={1.5}
                    fillColor="rgba(124,143,255,0.10)"
                  />
                )}

                {mapMarkers.map((a) => (
                  <Marker
                    key={a.id}
                    coordinate={{
                      latitude: a.latitude!,
                      longitude: a.longitude!,
                    }}
                    onPress={() => openArtisan(a.id)}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={s.markerPin}>
                      <View
                        style={[
                          s.markerHead,
                          {
                            backgroundColor: isAvailable(a)
                              ? t.primary
                              : t.textSecondary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          s.markerTail,
                          {
                            borderTopColor: isAvailable(a)
                              ? t.primary
                              : t.textSecondary,
                          },
                        ]}
                      />
                    </View>
                  </Marker>
                ))}
              </MapView>
            </View>
          </Animated.View>


          {/* ============= CTA Prestations ============= */}
          <Animated.View entering={FadeInDown.delay(360).duration(450)}>
            <Pressable
              onPress={openPrestations}
              style={({ pressed }) => [s.ctaWrap, pressed && s.ctaPressed]}
            >
              <LinearGradient
                colors={najdaGradient as unknown as [string, string, ...string[]]}
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.cta}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.ctaTitle}>
                    Explorer toutes les prestations
                  </Text>
                  <Text style={s.ctaSub}>
                    10 catégories, des centaines d&apos;artisans vérifiés
                  </Text>
                </View>
                <View style={s.ctaArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ============= TOP 5 — CARROUSEL PAR VILLE ============= */}
          {top5InCity.length > 0 && (
            <Animated.View entering={FadeInDown.delay(440).duration(450)}>
              <View style={s.sectionHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { color: t.text }]}>
                    Top 5 {userCity ? `à ${userCity}` : "près de vous"}
                  </Text>
                  <Text
                    style={[s.sectionSub, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    Les artisans les mieux notés, tous métiers confondus
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.top5Row}
                snapToInterval={188}
                decelerationRate="fast"
              >
                {top5InCity.map((a, idx) => {
                  const cat = getCategory(a.categoryId);
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => openArtisan(a.id)}
                      style={({ pressed }) => [
                        s.top5Card,
                        { backgroundColor: t.surface, borderColor: t.border },
                        pressed && s.pressed,
                      ]}
                    >
                      {/* Top row : rang à gauche + métier à droite */}
                      <View style={s.top5TopRow}>
                        <View style={s.rankBadgeWrap}>
                          <LinearGradient
                            colors={najdaGradient as unknown as [string, string, ...string[]]}
                            start={najdaGradientDirection.start}
                            end={najdaGradientDirection.end}
                            style={s.rankBadgeGrad}
                          >
                            <Text style={s.rankBadgeTxt}>{idx + 1}</Text>
                          </LinearGradient>
                        </View>
                        {cat && (
                          <View
                            style={[
                              s.catChip,
                              { backgroundColor: t.primaryMuted },
                            ]}
                          >
                            <Ionicons
                              name={cat.icon}
                              size={12}
                              color={t.primary}
                            />
                          </View>
                        )}
                      </View>

                      {/* Avatar centré */}
                      <View style={s.top5AvatarWrap}>
                        <Avatar
                          uri={a.avatarUrl}
                          initials={`${a.firstName.charAt(0)}${a.lastName.charAt(0)}`}
                          size={60}
                        />
                      </View>

                      {/* Nom + verified */}
                      <View style={s.top5NameRow}>
                        <Text
                          style={[s.top5Name, { color: t.text }]}
                          numberOfLines={1}
                        >
                          {a.firstName} {a.lastName.charAt(0)}.
                        </Text>
                        {a.verified && (
                          <Ionicons
                            name="shield-checkmark"
                            size={12}
                            color={t.primary}
                          />
                        )}
                      </View>

                      {/* Métier */}
                      <Text
                        style={[s.top5Job, { color: t.textSecondary }]}
                        numberOfLines={1}
                      >
                        {a.categoryName}
                      </Text>

                      {/* Rating */}
                      <View style={s.top5Rating}>
                        <Ionicons name="star" size={12} color="#C9A961" />
                        <Text style={[s.top5RatingTxt, { color: t.text }]}>
                          {a.rating.toFixed(1)}
                        </Text>
                        <Text
                          style={[s.top5Review, { color: t.textTertiary }]}
                        >
                          ({a.reviewCount})
                        </Text>
                      </View>

                      {/* Dispo */}
                      <View style={s.top5AvailRow}>
                        <View
                          style={[
                            s.availDot,
                            {
                              backgroundColor: isAvailable(a)
                                ? "#10B981"
                                : t.textTertiary,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            s.top5Avail,
                            {
                              color: isAvailable(a)
                                ? "#10B981"
                                : t.textTertiary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {availabilityLabel[a.availability]}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          <View style={{ height: space.xl }} />
        </ScrollView>
      </SafeAreaView>

      {/* ============= MODAL FILTRES ============= */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={closeFilters}
      >
        <Pressable style={s.modalBackdrop} onPress={closeFilters}>
          <Pressable
            style={[
              s.modalSheet,
              { backgroundColor: t.surface, paddingBottom: insets.bottom + 20 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[s.modalHandle, { backgroundColor: t.border }]} />

            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.text }]}>
                Affiner la recherche
              </Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={resetFilters} hitSlop={6}>
                  <Text style={[s.modalReset, { color: t.primary }]}>
                    Réinitialiser
                  </Text>
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* DISTANCE */}
              <View style={s.modalSection}>
                <Text style={[s.modalLabel, { color: t.textSecondary }]}>
                  Distance maximale
                </Text>
                <View style={s.radiusRow}>
                  {[5, 10, 15, 25, 50].map((km) => {
                    const active = radiusKm === km;
                    return (
                      <Pressable
                        key={km}
                        onPress={() => setRadiusKm(km)}
                        style={({ pressed }) => [
                          s.radiusChip,
                          {
                            backgroundColor: active
                              ? t.primary
                              : t.surfaceMuted,
                            borderColor: active ? t.primary : t.border,
                          },
                          pressed && s.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            s.radiusChipTxt,
                            { color: active ? "#FFFFFF" : t.text },
                          ]}
                        >
                          {km} km
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* TOGGLES */}
              <View style={s.modalSection}>
                <Text style={[s.modalLabel, { color: t.textSecondary }]}>
                  Préférences
                </Text>

                <Pressable
                  onPress={() => setOnlyAvailable(!onlyAvailable)}
                  style={[
                    s.toggleRow,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                >
                  <View style={s.toggleLeft}>
                    <View
                      style={[
                        s.toggleIcon,
                        { backgroundColor: t.primaryMuted },
                      ]}
                    >
                      <Ionicons name="flash" size={16} color={t.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.toggleTitle, { color: t.text }]}>
                        Disponibles maintenant
                      </Text>
                      <Text
                        style={[s.toggleSub, { color: t.textSecondary }]}
                      >
                        Aujourd&apos;hui uniquement
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      s.switchTrack,
                      {
                        backgroundColor: onlyAvailable
                          ? t.primary
                          : t.borderStrong,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.switchThumb,
                        { left: onlyAvailable ? 22 : 2 },
                      ]}
                    />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setOnlyVerified(!onlyVerified)}
                  style={[
                    s.toggleRow,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                >
                  <View style={s.toggleLeft}>
                    <View
                      style={[
                        s.toggleIcon,
                        { backgroundColor: t.primaryMuted },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color={t.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.toggleTitle, { color: t.text }]}>
                        Vérifiés uniquement
                      </Text>
                      <Text
                        style={[s.toggleSub, { color: t.textSecondary }]}
                      >
                        Identité, assurance, Kbis contrôlés
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      s.switchTrack,
                      {
                        backgroundColor: onlyVerified
                          ? t.primary
                          : t.borderStrong,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.switchThumb,
                        { left: onlyVerified ? 22 : 2 },
                      ]}
                    />
                  </View>
                </Pressable>
              </View>
            </ScrollView>

            {/* CTA Appliquer */}
            <Pressable
              onPress={closeFilters}
              style={({ pressed }) => [
                s.modalCtaWrap,
                pressed && s.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={najdaGradient as unknown as [string, string, ...string[]]}
                start={najdaGradientDirection.start}
                end={najdaGradientDirection.end}
                style={s.modalCta}
              >
                <Text style={s.modalCtaTxt}>
                  Voir {nearbyArtisans.length} résultat
                  {nearbyArtisans.length > 1 ? "s" : ""}
                </Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.lg,
  },

  // ===== HEADER (tout sur une ligne) =====
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  hello: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  addressRow: { flexDirection: "row", alignItems: "center" },
  addressTxt: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },

  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },

  // ===== RDV À VENIR =====
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  upcomingDot: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  dotRing: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    opacity: 0.4,
  },
  upcomingInfo: { flex: 1 },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  upcomingTitle: { fontSize: 15, fontWeight: "600" },

  // ===== SECTIONS =====
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: { fontSize: 19, fontWeight: "700", letterSpacing: -0.5 },
  sectionSub: { ...T.sm, marginTop: 2 },
  sectionLink: { ...T.sm, fontWeight: "600" },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTxt: { fontSize: 13, fontWeight: "600" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  filterBadgeTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ===== MODAL FILTRES =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,15,24,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: 10,
    maxHeight: "85%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modalReset: {
    fontSize: 13,
    fontWeight: "600",
  },

  modalSection: { marginBottom: 20 },
  modalLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Distance chips
  radiusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  radiusChipTxt: { fontSize: 14, fontWeight: "600" },

  // Toggles
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  toggleSub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  switchThumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  modalCtaWrap: {
    marginTop: 8,
    borderRadius: 16,
    ...shadow.lg,
  },
  modalCta: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCtaTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  // ===== URGENCES =====
  urgentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  urgentCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  urgentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentName: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  urgentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  urgentCount: { fontSize: 12, fontWeight: "500", flex: 1 },

  // ===== MAP =====
  mapWrap: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: { flex: 1 },
  markerPin: { alignItems: "center" },
  markerHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...shadow.sm,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },

  // ===== TOP 5 CARROUSEL =====
  top5Row: { gap: 12, paddingRight: space.lg },
  top5Card: {
    width: 176,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    ...shadow.sm,
  },
  top5TopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rankBadgeWrap: {
    borderRadius: 10,
    overflow: "hidden",
  },
  rankBadgeGrad: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  catChip: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  top5AvatarWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  top5NameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  top5Name: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  top5Job: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  top5Rating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginTop: 8,
  },
  top5RatingTxt: { fontSize: 12, fontWeight: "700" },
  top5Review: { fontSize: 11, fontWeight: "500" },
  top5AvailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
  },
  top5Avail: { fontSize: 11, fontWeight: "600" },

  // ===== CTA =====
  ctaWrap: { borderRadius: 18, ...shadow.lg },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 18,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  ctaSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: { opacity: 0.85 },
});
