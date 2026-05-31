import React, { createContext, useContext, useState } from "react";

/**
 * FiltersContext — partage les filtres entre l'accueil et la page Prestations.
 *
 * - radiusKm : rayon de recherche (utilisé sur la map du home)
 * - onlyAvailable : ne montrer que les artisans disponibles
 * - onlyVerified : ne montrer que les artisans vérifiés
 *
 * Quand l'utilisateur active "Disponible" ou "Vérifié" sur l'accueil,
 * le filtre est aussi actif sur Prestations, et vice-versa.
 */

interface FiltersState {
  radiusKm: number;
  onlyAvailable: boolean;
  onlyVerified: boolean;
}

interface FiltersContextValue extends FiltersState {
  setRadiusKm: (km: number) => void;
  setOnlyAvailable: (v: boolean) => void;
  setOnlyVerified: (v: boolean) => void;
  reset: () => void;
  activeCount: number;
}

const DEFAULT_RADIUS = 15;

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  const reset = () => {
    setRadiusKm(DEFAULT_RADIUS);
    setOnlyAvailable(false);
    setOnlyVerified(false);
  };

  const activeCount =
    (radiusKm !== DEFAULT_RADIUS ? 1 : 0) +
    (onlyAvailable ? 1 : 0) +
    (onlyVerified ? 1 : 0);

  return (
    <FiltersContext.Provider
      value={{
        radiusKm,
        onlyAvailable,
        onlyVerified,
        setRadiusKm,
        setOnlyAvailable,
        setOnlyVerified,
        reset,
        activeCount,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return ctx;
}
