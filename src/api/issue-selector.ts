// Sélecteur d'émission par scoring de confiance.
//
// L'API Numista n'est pas stricte : pour un même type, plusieurs émissions
// peuvent partager année + atelier (épreuves, essais, variétés de coin, doublons
// « weird » ajoutés par des membres). Le XLS ne porte pas la variante exacte.
//
// Principe : on ne prend jamais « la première qui matche ». On score chaque
// émission par une somme de SIGNAUX INDÉPENDANTS (SOLID / Open-Closed), où
// l'année est l'ancre dominante et la RICHESSE D'INFORMATION (tirage, marques,
// référence) départage. Les variantes peu renseignées (essais, proofs sans
// tirage) reçoivent une priorité minimale par construction. Si rien n'est
// fiable, on renvoie `issue: null` plutôt qu'un choix inventé.

import type {
  NumistaIssue,
  IssueQuery,
  IssueSelection,
  IssueQuality,
  Confidence,
} from "../types/index.js";

/** Motifs « variante spéciale » (français d'abord : l'API sert `comment` en fr). */
const PROOF_PATTERNS = [
  /belle\s*epreuve/, /\bepreuve\b/, /flan\s*bruni/, /\bessai\b/, /piefort/, /pre[-\s]?serie/,
  /\bprueba\b/, /\bensayo\b/, // es
  /\bproof\b/, /\bpattern\b/, // en (filet)
];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Qualité présumée d'après le commentaire. Absence de commentaire = inconnu (≠ circulation). */
export function detectQuality(comment: string | undefined): IssueQuality {
  if (comment == null || comment.trim() === "") return "unknown";
  const n = normalize(comment);
  return PROOF_PATTERNS.some((re) => re.test(n)) ? "proof" : "circulation";
}

/** Numéro de référence de base d'une émission API (« 227/3 » → « 227 »). */
export function refBaseOf(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = String(ref).match(/(\d+)/);
  return m ? m[1] : null;
}

/** Numéro de base depuis le refKM du XLS, pris APRÈS le « # » (« Franc 2014# 227 » → « 227 »). */
export function refBaseFromRefKM(refKM: string | null | undefined): string | null {
  if (!refKM) return null;
  const m = String(refKM).match(/#\s*(\d+)/);
  return m ? m[1] : null;
}

interface Signal {
  weight: number;
  reason: string;
}

const NO_SIGNAL: Signal = { weight: 0, reason: "" };

interface YearMatch {
  tier: number; // 3 = grégorien, 2 = millésime, 1 = intervalle, 0 = aucun
  matchedOn: IssueSelection["matchedOn"];
}

/** Compare les années saisies (frappe puis millésime) à `gregorian_year` ET `year`, jamais aplatis. */
function yearMatch(issue: NumistaIssue, q: IssueQuery): YearMatch {
  const wanted = [q.strikeYear, q.year].filter((y): y is number => y != null && y > 0);
  if (wanted.length === 0) return { tier: 0, matchedOn: null };

  if (issue.gregorian_year && issue.gregorian_year > 0 && wanted.includes(issue.gregorian_year)) {
    return { tier: 3, matchedOn: "gregorian_year" };
  }
  if (issue.year && issue.year > 0 && wanted.includes(issue.year)) {
    return { tier: 2, matchedOn: "year" };
  }
  if (issue.is_dated === false && issue.min_year && issue.max_year &&
      wanted.some((y) => y >= issue.min_year! && y <= issue.max_year!)) {
    return { tier: 1, matchedOn: "min_max" };
  }
  return { tier: 0, matchedOn: null };
}

/** Atelier : match exact = bonus, conflit = malus, glyphe/vide = neutre (jamais d'égalité imposée). */
function mintSignal(issue: NumistaIssue, q: IssueQuery): Signal {
  if (q.mintIsGlyphOnly || !q.mintMark) return NO_SIGNAL;
  const want = normalize(q.mintMark);
  const candidates = [issue.mint_letter, ...(issue.marks?.map((m) => m.letters) ?? [])]
    .filter((x): x is string => !!x)
    .map(normalize);
  if (candidates.length === 0) return NO_SIGNAL;
  return candidates.includes(want)
    ? { weight: 30, reason: `atelier ${q.mintMark}` }
    : { weight: -40, reason: "atelier différent" };
}

/** Tirage présent = richesse d'info + proxy de « pièce de circulation courante ». Échelonné par magnitude. */
function mintageSignal(issue: NumistaIssue): Signal {
  const m = issue.mintage ?? 0;
  if (m <= 0) return NO_SIGNAL;
  return { weight: 8 + Math.min(12, Math.floor(Math.log10(m))), reason: `tirage ${m}` };
}

/** Référence de base du XLS retrouvée dans les références de l'émission. */
function refSignal(issue: NumistaIssue, q: IssueQuery): Signal {
  if (!q.refBase) return NO_SIGNAL;
  const bases = (issue.references ?? []).map((r) => refBaseOf(r.number));
  return bases.includes(q.refBase) ? { weight: 20, reason: `réf ${q.refBase}` } : NO_SIGNAL;
}

/** Marques (différents de graveur/atelier) présentes = renseignement supplémentaire. */
function marksSignal(issue: NumistaIssue): Signal {
  return (issue.marks?.length ?? 0) > 0 ? { weight: 4, reason: "marques présentes" } : NO_SIGNAL;
}

interface Scored {
  issue: NumistaIssue;
  tier: number;
  matchedOn: IssueSelection["matchedOn"];
  richness: number;
  quality: IssueQuality;
  reasons: string[];
}

function scoreIssue(issue: NumistaIssue, q: IssueQuery, circulationPeerExists: boolean): Scored {
  const ym = yearMatch(issue, q);
  const quality = detectQuality(issue.comment);

  const signals = [mintSignal(issue, q), mintageSignal(issue), refSignal(issue, q), marksSignal(issue)];
  let richness = 0;
  const reasons: string[] = [];
  for (const s of signals) {
    richness += s.weight;
    if (s.reason) reasons.push(s.reason);
  }

  // Pénalité « variante spéciale » : RELATIVE (seulement si un pair de CIRCULATION
  // avéré existe — pas un simple commentaire vide) et CONDITIONNELLE (l'utilisateur
  // n'échange pas une épreuve). Neutralisée sur un type 100 % épreuves → pas d'inversion.
  if (quality === "proof" && circulationPeerExists && !q.expectsProof) {
    richness -= 25;
    reasons.push("épreuve dépriorisée");
  }

  return { issue, tier: ym.tier, matchedOn: ym.matchedOn, richness, quality, reasons };
}

function toConfidence(winner: Scored, runnerUp: Scored | null, ambiguous: boolean): Confidence {
  if (winner.matchedOn === null) {
    // Aucune ancre d'année : viable seulement via atelier/référence.
    return winner.richness > 0 ? "low" : "none";
  }
  if (ambiguous) return "low";
  if (winner.matchedOn === "gregorian_year") {
    if (runnerUp == null || runnerUp.tier < winner.tier) return "high";
    // « high » exige une info POSITIVE du vainqueur (richness>0), pas seulement un écart
    // creusé par la pénalité épreuve infligée au second (sinon confiance trompeuse).
    return winner.richness - runnerUp.richness >= 10 && winner.richness > 0 ? "high" : "medium";
  }
  return "medium"; // millésime / intervalle
}

function buildReason(winner: Scored, ambiguous: boolean): string {
  const parts: string[] = [];
  if (winner.matchedOn === "gregorian_year") parts.push(`année ${winner.issue.gregorian_year}`);
  else if (winner.matchedOn === "year") parts.push(`millésime ${winner.issue.year}`);
  else if (winner.matchedOn === "min_max") parts.push(`intervalle ${winner.issue.min_year}-${winner.issue.max_year}`);
  parts.push(...winner.reasons);
  if (winner.issue.comment) parts.push(`« ${winner.issue.comment} »`);
  let reason = parts.filter(Boolean).join(", ");
  if (ambiguous) reason += " — variante ambiguë, à vérifier";
  return reason || "sélection par défaut";
}

/**
 * Choisit l'émission la plus probable parmi `issues` pour la pièce décrite par `query`.
 * Tri lexicographique : (1) niveau de correspondance d'année, (2) richesse d'information,
 * (3) tirage décroissant, (4) id croissant (déterministe, indépendant de l'ordre serveur).
 */
export function selectIssue(issues: NumistaIssue[], q: IssueQuery): IssueSelection {
  if (issues.length === 0) {
    return { issue: null, confidence: "none", ambiguous: false, qualityGuess: "unknown", reason: "aucune émission", matchedOn: null };
  }

  const circulationPeerExists = issues.some((i) => detectQuality(i.comment) === "circulation");
  const scored = issues.map((issue) => scoreIssue(issue, q, circulationPeerExists));

  const sorted = [...scored].sort((a, b) =>
    b.tier - a.tier ||
    b.richness - a.richness ||
    (b.issue.mintage ?? -1) - (a.issue.mintage ?? -1) ||
    a.issue.id - b.issue.id,
  );

  const winner = sorted[0];
  const runnerUp = sorted[1] ?? null;

  // Rien d'ancré (ni année, ni atelier, ni référence) → on ne tranche pas à l'aveugle :
  // on renvoie null plutôt qu'un prix inventé. Vrai aussi pour un candidat UNIQUE dès
  // lors qu'on avait une année à matcher et qu'aucune n'a matché (sinon on retournerait
  // le prix d'une année erronée qui entrerait dans les totaux).
  const anchored = winner.tier > 0 || winner.richness > 0;
  const hadYear = q.year != null || q.strikeYear != null;
  if (!anchored && (issues.length > 1 || hadYear)) {
    return { issue: null, confidence: "none", ambiguous: false, qualityGuess: winner.quality, reason: "aucune correspondance fiable", matchedOn: null };
  }

  const ambiguous = runnerUp != null &&
    runnerUp.tier === winner.tier &&
    runnerUp.richness === winner.richness &&
    (runnerUp.issue.mintage ?? -1) === (winner.issue.mintage ?? -1);

  const confidence = anchored ? toConfidence(winner, runnerUp, ambiguous) : "low";

  return {
    issue: winner.issue,
    confidence,
    ambiguous,
    qualityGuess: winner.quality,
    reason: buildReason(winner, ambiguous),
    matchedOn: winner.matchedOn,
  };
}
