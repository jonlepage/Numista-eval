// Extraction tolérante de l'année et de l'atelier depuis les cellules « Année » /
// « Atelier » du XLS Numista, qui sont du TEXTE LIBRE saisi par des membres.
//
// Stratégie volontairement simple et robuste (pas de conversion calendaire) :
//   1. Si la cellule est déjà un nombre → on la prend.
//   2. Sinon on tente `Number()` (chaîne purement numérique).
//   3. Sinon regex : premier nombre 3–4 chiffres = le millésime (« 1975 (1977) » → 1975).
// L'année de frappe entre parenthèses (« 1977 ») est extraite à part, comme indice
// de variante — jamais comme année principale.

/** Espaces fins/insécables exportés par Numista (U+00A0, U+2007, U+2009, U+202F). */
const THIN_SPACES = /[    ]/g;

/** Premier nombre de 3 ou 4 chiffres (millésime plausible), non collé à d'autres chiffres. */
const YEAR_RE = /(?<!\d)(\d{3,4})(?!\d)/;

/** Nombre 3–4 chiffres entre parenthèses (année de frappe). */
const PAREN_YEAR_RE = /\(\s*(\d{3,4})\s*\)/;

/** Glyphes d'atelier non lettrés (étoile Aureo U+1F7CC, astérisque, étoiles…). */
const STAR_GLYPH_RE = /^[*★☆✦✧✱✲\u{1F7CC}]+$/u;

export interface YearExtraction {
  /** Millésime principal (premier nombre), ou `null` si rien d'extractible. */
  year: number | null;
  /** Année de frappe parenthésée, ou `null`. */
  strikeYear: number | null;
  /** Cellule brute conservée pour audit / rapport. */
  yearRaw: string;
}

export interface MintExtraction {
  /** Atelier normalisé (lettre/code majuscule) ou `null` si glyphe-seul / vide. */
  mintMark: string | null;
  /** Cellule brute conservée (le glyphe d'origine). */
  rawMintMark: string;
  /** L'atelier n'est qu'un glyphe (étoile) → ne pas imposer d'égalité avec une lettre. */
  isGlyphOnly: boolean;
}

function normalize(raw: string): string {
  return raw.normalize("NFC").replace(THIN_SPACES, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extrait le millésime et l'année de frappe d'une cellule « Année ».
 * Accepte un nombre (record NUMBER du XLS) ou une chaîne libre.
 */
export function extractYear(cell: string | number | null | undefined): YearExtraction {
  if (typeof cell === "number") {
    return {
      year: Number.isFinite(cell) ? Math.floor(cell) : null,
      strikeYear: null,
      yearRaw: String(cell),
    };
  }

  const raw = cell == null ? "" : String(cell);
  const norm = normalize(raw);

  const paren = norm.match(PAREN_YEAR_RE);
  const strikeYear = paren ? parseInt(paren[1], 10) : null;

  // Chaîne purement numérique : `Number()` d'abord (rapide et exact).
  let year: number | null = null;
  if (norm !== "" && !Number.isNaN(Number(norm))) {
    year = Math.floor(Number(norm));
  } else {
    const m = norm.match(YEAR_RE);
    year = m ? parseInt(m[1], 10) : null;
  }

  return { year, strikeYear, yearRaw: raw };
}

/**
 * Extrait l'atelier d'une cellule « Atelier ». Les glyphes étoile (ex. pesetas
 * espagnoles) ne sont pas des lettres d'atelier API → marqués `isGlyphOnly`.
 */
export function extractMint(cell: string | number | null | undefined): MintExtraction {
  const raw = cell == null ? "" : String(cell);
  const norm = normalize(raw);

  if (norm === "") return { mintMark: null, rawMintMark: raw, isGlyphOnly: false };
  if (STAR_GLYPH_RE.test(norm)) return { mintMark: null, rawMintMark: raw, isGlyphOnly: true };

  const letters = norm.replace(/[^\p{L}\p{N}]/gu, "");
  return {
    mintMark: letters ? letters.toUpperCase() : null,
    rawMintMark: raw,
    isGlyphOnly: letters === "",
  };
}

/** Indique si une cellule « Année » texte contient un nombre exploitable (pour isDataRow). */
export function yearCellHasNumber(cell: string | number | null | undefined): boolean {
  if (typeof cell === "number") return true;
  if (cell == null) return false;
  return /\d{3,4}/.test(String(cell));
}
