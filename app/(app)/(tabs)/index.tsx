import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import * as Location from "expo-location";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { brand, space, radius, shadow, text as T, comp } from "@/constants/theme";
import {
  getMyProfile,
  getAllArtisans,
  getMyBookings,
  availabilityLabel,
  availabilityColor,
  type Profile,
  type Artisan,
  type Booking,
} from "@/lib/api";
import { getStoredCity, setStoredCity, POPULAR_CITIES } from "@/lib/storage";
import { getCategory } from "@/constants/categories";

const DEFAULT_REGION: Region = {
  latitude: 45.764,
  longitude: 4.8357,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [city, setCity] = useState<string>("Lyon");
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    const [p, ars, bookings, storedCity] = await Promise.all([
      getMyProfile(),
      getAllArtisans(),
      getMyBookings("upcoming"),
      getStoredCity(),
    ]);
    setProfile(p);
    setArtisans(ars);
    setUpcomingBooking(bookings[0] ?? null);
    if (storedCity) setCity(storedCity);
    else if (p?.city) setCity(p.city);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadData().catch(() => {});
      return () => {
        mounted = false;
      };
    }, [loadData]),
  );

  const geoArtisans = useMemo(
    () => artisans.filter((a) => a.latitude != null && a.longitude != null),
    [artisans],
  );

  const availableNowCount = useMemo(
    () => geoArtisans.filter((a) => a.availability === "now" || a.availability === "today").length,
    [geoArtisans],
  );

  const selectedArtisan = useMemo(
    () => geoArtisans.find((a) => a.id === selectedArtisanId) ?? null,
    [geoArtisans, selectedArtisanId],
  );

  const firstName = useMemo(() => {
    if (profile?.firstName) return profile.firstName;
    if (user?.email) {
      const prefix = user.email.split("@")[0];
      const clean = prefix.replace(/[^a-zA-Z]/g, "").slice(0, 8);
      if (clean.length >= 2) return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return "";
  }, [profile, user]);

  const initial = (profile?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? "?").toUpperCase();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "Bonne nuit";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const pickCity = () => {
    Alert.alert("Choisir une zone", undefined, [
      ...POPULAR_CITIES.slice(0, 6).map((c) => ({
        text: c,
        onPress: async () => {
          setCity(c);
          await setStoredCity(c);
        },
      })),
      { text: "Autres villes…", onPress: pickMoreCities },
      { text: "Annuler", style: "cancel" as const },
    ]);
  };

  const pickMoreCities = () => {
    Alert.alert("Plus de villes", undefined, [
      ...POPULAR_CITIES.slice(6).map((c) => ({
        text: c,
        onPress: async () => {
          setCity(c);
          await setStoredCity(c);
        },
      })),
      { text: "Annuler", style: "cancel" as const },
    ]);
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } else {
      Alert.alert(
        "Localisation indisponible",
        "Activez la localisation dans les paramètres pour utiliser cette fonction.",
      );
    }
  };

  const tapArtisanMarker = (id: string) => {
    setSelectedArtisanId(id);
    const a = artisans.find((x) => x.id === id);
    if (a?.latitude && a?.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: a.latitude,
        longitude: a.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }
  };

  const openArtisan = (id: string) =>
    router.push({ pathname: "/(app)/artisan/[id]", params: { id } });
  const openBooking = () => router.push("/(app)/(tabs)/bookings");
  const openSearch = () => router.push("/(app)/search");
  const openProfile = () => router.push("/(app)/(tabs)/profile");
  const openPrestations = () => router.push("/(app)/prestations");
  const openNotif = () => Alert.alert("Notifications", "Aucune notification.");

  const initialRegion: Region = userLocation
    ? { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.headerLeft, pressed && s.op]}
          onPress={openProfile}
        >
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={s.avatarImg} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{initial}</Text>
            </View>
          )}
          <View>
            <Text style={s.hello}>
              {greeting}
              {firstName ? ` ${firstName}` : ""}
            </Text>
            <Pressable onPress={pickCity} hitSlop={6}>
              <View style={s.cityRow}>
                <Ionicons name="location" size={11} color={brand.primary500} />
                <Text style={s.cityTxt}>{city}</Text>
                <Ionicons name="chevron-down" size={11} color={brand.gray500} />
              </View>
            </Pressable>
          </View>
        </Pressable>

        <View style={s.headerRight}>
          <Pressable
            style={({ pressed }) => [s.iconBtn, pressed && s.op]}
            onPress={openSearch}
            hitSlop={6}
          >
            <Ionicons name="search" size={20} color={brand.gray700} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.iconBtn, pressed && s.op]}
            onPress={openNotif}
            hitSlop={6}
          >
            <Ionicons name="notifications-outline" size={20} color={brand.gray700} />
            <View style={s.notifDot} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* BOOKING WIDGET si actif */}
        {upcomingBooking && upcomingBooking.artisan && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable
              style={({ pressed }) => [s.bookingWidget, pressed && s.cardP]}
              onPress={openBooking}
            >
              <View style={s.bookingPulse}>
                <View style={s.bookingPulseInner} />
              </View>
              <View style={s.bookingInfo}>
                <Text style={s.bookingTitle}>RDV en cours</Text>
                <Text style={s.bookingSub}>
                  {upcomingBooking.artisan.firstName}{" "}
                  {upcomingBooking.artisan.lastName} · {upcomingBooking.service}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={brand.white} />
            </Pressable>
          </Animated.View>
        )}

        {/* MAP */}
        <View style={s.mapBlock}>
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation={!!userLocation}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {geoArtisans.map((a) => {
              if (!a.latitude || !a.longitude) return null;
              const cat = getCategory(a.categoryId);
              const isSelected = a.id === selectedArtisanId;
              return (
                <Marker
                  key={a.id}
                  coordinate={{ latitude: a.latitude, longitude: a.longitude }}
                  onPress={() => tapArtisanMarker(a.id)}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View
                    style={[
                      s.pin,
                      isSelected && s.pinSelected,
                      { backgroundColor: cat?.iconColor ?? brand.primary500 },
                    ]}
                  >
                    <Ionicons
                      name={cat?.icon ?? "construct"}
                      size={isSelected ? 16 : 14}
                      color={brand.white}
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <Pressable
            style={({ pressed }) => [s.mapCenterBtn, pressed && s.op]}
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={18} color={brand.primary500} />
          </Pressable>

          <View style={s.mapBadge}>
            <View style={s.mapBadgeDot} />
            <Text style={s.mapBadgeTxt}>
              {availableNowCount} dispos maintenant
            </Text>
          </View>

          {selectedArtisan && (
            <Animated.View entering={FadeInDown.duration(200)} style={s.miniCard}>
              <Pressable
                style={({ pressed }) => [s.miniCardInner, pressed && s.op]}
                onPress={() => openArtisan(selectedArtisan.id)}
              >
                <View
                  style={[
                    s.miniAvatar,
                    {
                      backgroundColor:
                        getCategory(selectedArtisan.categoryId)?.iconColor ?? brand.primary500,
                    },
                  ]}
                >
                  <Text style={s.miniAvatarTxt}>{selectedArtisan.initials}</Text>
                </View>
                <View style={s.miniInfo}>
                  <View style={s.miniNameRow}>
                    <Text style={s.miniName}>
                      {selectedArtisan.firstName}{" "}
                      {selectedArtisan.lastName.charAt(0)}.
                    </Text>
                    {selectedArtisan.verified && (
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color={brand.primary500}
                      />
                    )}
                  </View>
                  <View style={s.miniMeta}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={s.miniMetaTxt}>
                      {selectedArtisan.rating} · {selectedArtisan.distance} km
                    </Text>
                  </View>
                  <View style={s.miniAvail}>
                    <View
                      style={[
                        s.dot,
                        {
                          backgroundColor:
                            availabilityColor[selectedArtisan.availability],
                        },
                      ]}
                    />
                    <Text style={s.miniAvailTxt}>
                      {availabilityLabel[selectedArtisan.availability]}
                    </Text>
                  </View>
                </View>
                <View style={s.miniArrow}>
                  <Ionicons name="chevron-forward" size={16} color={brand.white} />
                </View>
              </Pressable>
              <Pressable
                onPress={() => setSelectedArtisanId(null)}
                style={s.miniClose}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={brand.gray600} />
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* CTA principal: voir toutes les prestations */}
        <Pressable
          onPress={openPrestations}
          style={({ pressed }) => [s.cta, pressed && s.cardP]}
        >
          <View style={s.ctaIconBox}>
            <Ionicons name="grid" size={20} color={brand.white} />
          </View>
          <View style={s.ctaText}>
            <Text style={s.ctaTitle}>Voir nos prestations</Text>
            <Text style={s.ctaSub}>
              10 services · {geoArtisans.length} artisans certifiés
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={brand.primary500} />
        </Pressable>

        {/* TRUST */}
        <View style={s.trust}>
          <Ionicons name="shield-checkmark" size={13} color={brand.gold500} />
          <Text style={s.trustTxt}>Tous les artisans Najda sont vérifiés et assurés</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.gray50 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.gray100,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  op: { opacity: 0.7 },
  avatar: {
    width: comp.avatarMd,
    height: comp.avatarMd,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: comp.avatarMd,
    height: comp.avatarMd,
    borderRadius: radius.full,
    backgroundColor: brand.gray200,
  },
  avatarTxt: { fontSize: 17, fontWeight: "700", color: brand.white },
  hello: { ...T.base, fontWeight: "700", color: brand.gray900, letterSpacing: -0.3 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 },
  cityTxt: { ...T.xs, color: brand.gray600, fontWeight: "500" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.gray50,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.danger500,
    borderWidth: 1.5,
    borderColor: brand.gray50,
  },

  scroll: { paddingBottom: space["2xl"] },

  bookingWidget: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: space.lg,
    marginBottom: 0,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: brand.primary500,
    ...shadow.lg,
  },
  bookingPulse: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  bookingPulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
  },
  bookingInfo: { flex: 1, gap: 2 },
  bookingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bookingSub: { ...T.base, fontWeight: "700", color: brand.white },

  mapBlock: {
    height: 380,
    margin: space.lg,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: brand.gray100,
    position: "relative",
    ...shadow.md,
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapCenterBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: brand.white,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  mapBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: brand.white,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  mapBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  mapBadgeTxt: { ...T.xs, fontWeight: "700", color: brand.gray800 },

  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: brand.white,
    ...Platform.select({
      ios: {
        shadowColor: brand.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  pinSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: brand.gold500,
    borderWidth: 3,
  },

  miniCard: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.lg,
  },
  miniCardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  miniAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  miniAvatarTxt: { fontSize: 15, fontWeight: "700", color: brand.white },
  miniInfo: { flex: 1, gap: 2 },
  miniNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  miniName: { ...T.sm, fontWeight: "700", color: brand.gray900 },
  miniMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniMetaTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
  miniAvail: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  miniAvailTxt: { ...T.xs, fontWeight: "600", color: brand.gray700 },
  miniArrow: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  miniClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: brand.gray100,
    justifyContent: "center",
    alignItems: "center",
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: space.lg,
    padding: space.md,
    backgroundColor: brand.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: brand.primary100,
    ...shadow.md,
  },
  cardP: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: brand.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: { flex: 1, gap: 2 },
  ctaTitle: {
    ...T.base,
    fontWeight: "700",
    color: brand.gray900,
    letterSpacing: -0.3,
  },
  ctaSub: { ...T.xs, color: brand.gray500, fontWeight: "500" },

  trust: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
  },
  trustTxt: { ...T.xs, color: brand.gray500, fontWeight: "500" },
});
