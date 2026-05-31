import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";

/**
 * Logo Najda — maison + porte arche évidée, sur dégradé bleu→violet.
 *
 * Usage :
 *   <NajdaLogo size={96} />
 *   <NajdaLogo size={28} />
 *
 * Le dégradé est verrouillé (#9BB5FF → #A89BFF → #C58BEC).
 * Le borderRadius suit le ratio iOS app icon (22%).
 */
interface NajdaLogoProps {
  size?: number;
  withShadow?: boolean;
}

export function NajdaLogo({ size = 96, withShadow = false }: NajdaLogoProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        withShadow && styles.shadow,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="najdaGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9BB5FF" />
            <Stop offset="0.55" stopColor="#A89BFF" />
            <Stop offset="1" stopColor="#C58BEC" />
          </LinearGradient>
        </Defs>

        {/* Fond dégradé */}
        <Rect width="120" height="120" fill="url(#najdaGrad)" />

        {/* Maison + porte arche évidée (fill-rule evenodd) */}
        <Path
          d="M 60 28 L 90 56 L 83 56 L 83 92 L 37 92 L 37 56 L 30 56 Z M 50 92 L 50 74 C 50 66 54 62 60 62 C 66 62 70 66 70 74 L 70 92 Z"
          fill="#FFFFFF"
          fillRule="evenodd"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shadow: Platform.select({
    ios: {
      shadowColor: "#7C8FFF",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }) as object,
});
