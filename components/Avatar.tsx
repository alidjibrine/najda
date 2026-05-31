import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";
import { brand, radius } from "@/constants/theme";

type Props = {
  uri?: string | null;
  initials: string;
  size?: number;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
};

/**
 * Avatar composant réutilisable.
 * Affiche la photo si uri est fourni, sinon un cercle de couleur avec les initiales.
 */
export function Avatar({
  uri,
  initials,
  size = 48,
  bgColor = brand.primary500,
  borderColor,
  borderWidth = 0,
  style,
}: Props) {
  const base: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth,
    ...(borderColor ? { borderColor } : {}),
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[base as object, { backgroundColor: brand.gray200 }, style] as never}
      />
    );
  }

  return (
    <View style={[base, { backgroundColor: bgColor }, style]}>
      <Text
        style={{
          fontSize: Math.max(11, size * 0.4),
          fontWeight: "700",
          color: brand.white,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/**
 * Avatar carré (utilisé dans certaines listes où l'esthétique carrée est préférée).
 */
export function AvatarSquare({
  uri,
  initials,
  size = 48,
  bgColor = brand.primary500,
  style,
}: Props) {
  const base: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[base as object, { backgroundColor: brand.gray200 }, style] as never}
      />
    );
  }

  return (
    <View style={[base, { backgroundColor: bgColor }, style]}>
      <Text
        style={{
          fontSize: Math.max(11, size * 0.36),
          fontWeight: "700",
          color: brand.white,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
