import { useEffect } from "react";
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import {
  space,
  radius,
  shadow,
  najdaGradient,
  najdaGradientDirection,
} from "@/constants/theme";
import { useTheme, useIsDark } from "@/hooks/useTheme";
import { NajdaLogo } from "@/components/NajdaLogo";

export default function SplashScreen() {
  const router = useRouter();
  const t = useTheme();
  const isDark = useIsDark();

  // ====== Animations d'entrée ======
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(20);
  const sloganOpacity = useSharedValue(0);
  const sloganY = useSharedValue(15);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(24);
  const arrowX = useSharedValue(0);

  // ====== Breathing du halo ======
  const halo = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120, mass: 0.8 });

    nameOpacity.value = withDelay(450, withTiming(1, { duration: 550 }));
    nameY.value = withDelay(
      450,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );

    sloganOpacity.value = withDelay(700, withTiming(1, { duration: 550 }));
    sloganY.value = withDelay(
      700,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );

    btnOpacity.value = withDelay(1050, withTiming(1, { duration: 500 }));
    btnY.value = withDelay(
      1050,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    arrowX.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    halo.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [
    arrowX,
    btnOpacity,
    btnY,
    halo,
    logoOpacity,
    logoScale,
    nameOpacity,
    nameY,
    sloganOpacity,
    sloganY,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
    transform: [{ translateY: sloganY.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + halo.value * 0.15,
    transform: [{ scale: 1 + halo.value * 0.06 }],
  }));

  const handleStart = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/(auth)/login");
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent />

      {/* ===== Halo dégradé Najda (très diffus, derrière le logo) ===== */}
      <Animated.View style={[s.haloWrap, haloStyle]} pointerEvents="none">
        <LinearGradient
          colors={[
            "rgba(155,181,255,0)",
            "rgba(168,155,255,0.45)",
            "rgba(197,139,236,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.halo}
        />
      </Animated.View>

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* ===== HERO centré ===== */}
        <View style={s.center}>
          <Animated.View style={logoStyle}>
            <NajdaLogo size={112} withShadow />
          </Animated.View>

          <Animated.Text style={[s.brandName, { color: t.text }, nameStyle]}>
            Najda
          </Animated.Text>

          <Animated.Text
            style={[s.slogan, { color: t.textSecondary }, sloganStyle]}
          >
            L&apos;artisan qu&apos;il vous faut,{"\n"}quand il vous faut.
          </Animated.Text>
        </View>

        {/* ===== Bas : CTA + indicateur ===== */}
        <Animated.View style={[s.bottomBlock, btnStyle]}>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [s.startBtnWrap, pressed && s.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Commencer"
          >
            <LinearGradient
              colors={najdaGradient as unknown as [string, string, ...string[]]}
              start={najdaGradientDirection.start}
              end={najdaGradientDirection.end}
              style={s.startBtn}
            >
              <Text style={s.startBtnTxt}>Commencer</Text>
              <Animated.View style={arrowStyle}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </Pressable>

          {/* Indicateur de pages */}
          <View style={s.indicator}>
            <View style={[s.indicatorDotActive, { backgroundColor: t.primary }]} />
            <View
              style={[
                s.indicatorDot,
                { backgroundColor: t.border },
              ]}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Halo très diffus derrière le logo
  haloWrap: {
    position: "absolute",
    top: "18%",
    left: "50%",
    width: 520,
    height: 520,
    marginLeft: -260,
  },
  halo: { flex: 1, borderRadius: 260 },

  safe: {
    flex: 1,
    paddingHorizontal: space.xl,
    justifyContent: "space-between",
  },

  // ===== HERO =====
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.lg,
  },
  brandName: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.8,
    marginTop: space.md,
  },
  slogan: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "500",
    marginTop: -6,
  },

  // ===== Bottom =====
  bottomBlock: {
    alignItems: "center",
    paddingBottom: space.lg,
    gap: space.lg,
  },
  startBtnWrap: {
    borderRadius: radius.full,
    ...shadow.lg,
  },
  btnPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: 220,
    height: 56,
    borderRadius: radius.full,
  },
  startBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  indicator: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  indicatorDotActive: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
