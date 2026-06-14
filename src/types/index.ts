export type Confidence = "high" | "medium" | "low" | "none";

export type IssueQuality = "proof" | "circulation" | "unknown";

export interface RawCoin {
  issuer: string;
  refKM: string;
  typeId: number | null;
  title: string;
  /** Millésime principal (texte ou nombre). `null` = année non déterminée (jamais `0`). */
  year: number | null;
  /** Cellule « Année » brute, conservée pour audit et rapport. */
  yearRaw: string;
  /** Année de frappe entre parenthèses (« 1975 (1977) » → 1977), indice de variante. */
  strikeYear: number | null;
  /** Atelier normalisé (lettre/code) ou `null` si glyphe-seul/vide. */
  mintMark: string | null;
  /** Atelier brut (« 🟌 ») conservé pour affichage. */
  rawMintMark: string;
  /** L'atelier n'est qu'un glyphe (étoile) → non comparable à une lettre. */
  mintIsGlyphOnly: boolean;
  selected: boolean;
}

export interface ParsedExchange {
  title: string;
  demanded: RawCoin[];
  offered: RawCoin[];
}

export interface NumistaIssueReference {
  catalogue?: { id?: number; code?: string };
  number?: string;
}

export interface NumistaIssueMark {
  id?: number;
  letters?: string;
  title?: string;
  picture?: string;
}

export interface NumistaIssue {
  id: number;
  is_dated: boolean;
  year?: number;
  gregorian_year?: number;
  min_year?: number;
  max_year?: number;
  mint_letter?: string;
  mintage?: number;
  comment?: string;
  references?: NumistaIssueReference[];
  marks?: NumistaIssueMark[];
}

/** Critères de correspondance extraits d'une pièce du XLS, passés au sélecteur d'émission. */
export interface IssueQuery {
  year: number | null;
  strikeYear: number | null;
  mintMark: string | null;
  mintIsGlyphOnly: boolean;
  /** Numéro de référence de base (« Franc 2014# 227 » → « 227 »), sans le sous-numéro de variante. */
  refBase: string | null;
  /** L'utilisateur échange-t-il explicitement une épreuve ? (le XLS ne le dit pas → false) */
  expectsProof: boolean;
}

/** Résultat du sélecteur : l'émission retenue + la confiance et le pourquoi. */
export interface IssueSelection {
  issue: NumistaIssue | null;
  confidence: Confidence;
  ambiguous: boolean;
  qualityGuess: IssueQuality;
  reason: string;
  matchedOn: "gregorian_year" | "year" | "min_max" | null;
}

export interface NumistaPrice {
  grade: Grade;
  price: number;
}

export interface NumistaPriceResponse {
  currency: string;
  prices: NumistaPrice[];
}

export interface NumistaType {
  id: number;
  title: string;
  url?: string;
  issuer?: { code: string; name: string };
  min_year?: number;
  max_year?: number;
  value?: {
    text?: string;
    numeric_value?: number;
    currency?: { id?: number; name?: string; full_name?: string };
  };
  composition?: { text?: string };
  weight?: number;
  size?: number;
}

export type Grade = "g" | "vg" | "f" | "vf" | "xf" | "au" | "unc";

export const GRADE_ORDER: Grade[] = ["g", "vg", "f", "vf", "xf", "au", "unc"];

export interface CoinWithPrices {
  raw: RawCoin;
  issue: NumistaIssue | null;
  price: number | null;
  priceGrade: Grade | null;
  allPrices: number[];
  faceValue: number | null;
  faceValueText: string | null;
  currencyCode: string | null;
  mintage: number | null;
  rarityScore: number | null;
  numistaUrl: string | null;
  /** Confiance de la sélection d'émission. */
  confidence: Confidence;
  /** L'émission a été choisie en départageant un ex-aequo indécidable. */
  ambiguous: boolean;
  /** Qualité présumée de l'émission retenue (proof / circulation / inconnu). */
  qualityGuess: IssueQuality;
  /** Explication de la sélection (pour la note de cellule Excel / le terminal). */
  matchReason: string;
}

export interface ExchangeSide {
  coins: CoinWithPrices[];
  totalPrice: number;
  totalFaceValue: number;
  /** Somme des valeurs nominales converties dans la devise cible. */
  totalConvertedNominal: number;
  /** Somme des tirages connus du côté (proxy de rareté cumulée). */
  totalMintage: number;
  noPriceCount: number;
}

export type Verdict = "equitable" | "acceptable" | "desequilibre" | "indetermine";

export interface EvaluationReport {
  title: string;
  timestamp: string;
  currency: string;
  demanded: ExchangeSide;
  offered: ExchangeSide;
  balance: number;
  balancePercent: number;
  /** Score d'équité pondéré (même calcul que l'Excel) ; `null` si non chiffrable. */
  fairnessScore: number | null;
  verdict: Verdict;
  apiCallsUsed: number;
  /** L'évaluation a été interrompue (ex: quota API atteint) → résultats partiels. */
  incomplete: boolean;
}
