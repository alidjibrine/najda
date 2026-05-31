import React from "react";
import Svg, { Path } from "react-native-svg";

/**
 * Logo Apple officiel (silhouette pomme + feuille).
 * Couleur paramétrable (noir par défaut pour fond clair).
 */
export function AppleLogo({
  size = 20,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.543 13.398c-.027-2.92 2.385-4.32 2.495-4.388-1.358-1.985-3.473-2.256-4.228-2.288-1.804-.182-3.523 1.062-4.44 1.062-.918 0-2.336-1.034-3.84-1.005-1.977.029-3.797 1.149-4.812 2.917-2.052 3.555-.525 8.81 1.474 11.692.978 1.412 2.144 3.001 3.677 2.943 1.479-.06 2.034-.957 3.82-.957 1.785 0 2.286.957 3.847.926 1.587-.029 2.59-1.44 3.563-2.86 1.123-1.641 1.586-3.232 1.614-3.314-.035-.014-3.099-1.188-3.13-4.708l-.04-.02ZM14.642 4.832c.816-.989 1.367-2.36 1.216-3.726-1.176.048-2.6.783-3.443 1.769-.756.88-1.418 2.275-1.24 3.615 1.31.103 2.652-.667 3.467-1.658Z"
      />
    </Svg>
  );
}

/**
 * Logo Google officiel (G avec les 4 couleurs de marque).
 * Toujours multi-couleur — c'est la signature Google.
 */
export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Bleu */}
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      {/* Vert */}
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      {/* Jaune */}
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      {/* Rouge */}
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}
