import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { brand, space, radius } from "@/constants/theme";

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(20);
  const sloganOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(30);
  const arrowX = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.back(1.4)),
    });
    logoOpacity.value = withTiming(1, { duration: 600 });

    nameOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    nameY.value = withDelay(
      500,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    sloganOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));

    btnOpacity.value = withDelay(1300, withTiming(1, { duration: 500 }));
    btnY.value = withDelay(
      1300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    arrowX.value = withDelay(
      1800,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

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
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <LinearGradient
      colors={[brand.primary400, brand.primary500, brand.primary900]}
      locations={[0, 0.5, 1]}
      style={s.container}
    >
      <View style={s.topSpace} />

      <View style={s.center}>
        <Animated.View style={[s.logoBox, logoStyle]}>
          <View style={s.logoInner}>
            <Ionicons name="construct" size={32} color={brand.white} />
          </View>
        </Animated.View>

        <Animated.Text style={[s.brandName, nameStyle]}>
          Najda
        </Animated.Text>

        <Animated.Text style={[s.slogan, sloganStyle]}>
          L&apos;artisan qu&apos;il vous faut,{"\n"}quand il vous faut.
        </Animated.Text>
      </View>

      <Animated.View style={[s.bottomBlock, btnStyle]}>
        <Pressable
          style={({ pressed }) => [s.startBtn, pressed && s.startBtnPressed]}
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="button"
          accessibilityLabel="Commencer"
        >
          <Text style={s.startBtnText}>Commencer</Text>
          <Animated.View style={arrowStyle}>
            <Ionicons name="arrow-forward" size={20} color={brand.white} />
          </Animated.View>
        </Pressable>

        <View style={s.indicator}>
          <View style={s.indicatorDotActive} />
          <View style={s.indicatorDot} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topSpace: { flex: 0.3 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  logoBox: {
    marginBottom: space.xl,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontSize: 48,
    fontWeight: "700",
    color: brand.white,
    letterSpacing: -2,
    marginBottom: space.md,
  },
  slogan: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    fontWeight: "400",
  },

  bottomBlock: {
    alignItems: "center",
    paddingBottom: 60,
    gap: space.xl,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: 200,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  startBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.28)",
    transform: [{ scale: 0.97 }],
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: brand.white,
    letterSpacing: -0.2,
  },
  indicator: {
    flexDirection: "row",
    gap: 8,
  },
  indicatorDotActive: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.white,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
