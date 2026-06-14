// Logique d'équité PARTAGÉE entre le terminal et l'Excel, pour que les deux
// rendent EXACTEMENT le même verdict. Le verdict est un score pondéré sur 4 indices
// (prix, valeur nominale, tirage, qualité), pas seulement le prix.

import type { Verdict } from "./types/index.js";

/** Poids par défaut de chaque indice (l'Excel les rend ajustables ; le terminal utilise ceux-ci). */
export const DEFAULT_WEIGHTS = { price: 3, nominal: 1, mintage: 3, quality: 3 } as const;

/** Seuils du verdict, appliqués à la valeur absolue du score pondéré. */
export const VERDICT_THRESHOLDS = { fair: 8, acceptable: 20 } as const;

export interface DimensionPair {
  received: number;
  given: number;
}

export interface Dimensions {
  price?: DimensionPair;
  nominal?: DimensionPair;
  mintage?: DimensionPair;
  quality?: DimensionPair;
}

/** Écart % signé d'un indice. `null` si le côté « donné » n'est pas chiffré (> 0) → indice exclu. */
export function gapPercent(received: number, given: number): number | null {
  if (!(given > 0)) return null;
  return ((received - given) / given) * 100;
}

/**
 * Score d'équité = moyenne pondérée des écarts des indices DISPONIBLES (renormalisée).
 * Le tirage est compté en NÉGATIF (moins de tirage = plus rare = favorable à celui qui reçoit).
 * Renvoie `null` si aucun indice n'est chiffrable.
 */
export function compositeScore(
  dims: Dimensions,
  weights: { price: number; nominal: number; mintage: number; quality: number },
): number | null {
  let num = 0;
  let den = 0;
  const add = (pair: DimensionPair | undefined, weight: number, sign: number) => {
    if (!pair) return;
    const g = gapPercent(pair.received, pair.given);
    if (g == null) return;
    num += weight * sign * g;
    den += weight;
  };
  add(dims.price, weights.price, +1);
  add(dims.nominal, weights.nominal, +1);
  add(dims.mintage, weights.mintage, -1);
  add(dims.quality, weights.quality, +1);
  return den === 0 ? null : num / den;
}

export function verdictFromScore(score: number | null): Verdict {
  if (score == null) return "indetermine";
  const abs = Math.abs(score);
  if (abs <= VERDICT_THRESHOLDS.fair) return "equitable";
  if (abs <= VERDICT_THRESHOLDS.acceptable) return "acceptable";
  return "desequilibre";
}
