import type {
  RawCoin,
  CoinWithPrices,
  ExchangeSide,
  EvaluationReport,
  Grade,
  IssueQuery,
} from "../types/index.js";
import { GRADE_ORDER } from "../types/index.js";
import { NumistaClient, QuotaExceededError } from "../api/numista-client.js";
import { selectIssue, refBaseFromRefKM } from "../api/issue-selector.js";
import { fetchExchangeRates, convertToCurrency } from "../currency.js";
import { compositeScore, verdictFromScore, DEFAULT_WEIGHTS } from "../fairness.js";

const ISSUER_CODE_TO_ISO: Record<string, string> = {
  // Amériques
  "canada": "CAD", "etats-unis": "USD", "mexique": "MXN",
  "bresil": "BRL", "argentine": "ARS", "colombie": "COP",
  "chili": "CLP", "perou": "PEN", "cuba": "CUP",
  "republique_dominicaine": "DOP", "jamaique": "JMD",
  "uruguay": "UYU", "venezuela": "VES", "costa_rica": "CRC",
  "panama": "PAB", "guatemala": "GTQ", "honduras": "HNL",
  "paraguay": "PYG", "bolivie": "BOB", "nicaragua": "NIO",
  "equateur": "USD", "el_salvador": "USD",
  "trinite-et-tobago": "TTD", "barbade": "BBD",
  "bahamas": "BSD", "bermudes": "BMD",

  // Europe (Euro)
  "france": "EUR", "allemagne": "EUR", "italie": "EUR",
  "espagne": "EUR", "belgique": "EUR", "pays-bas": "EUR",
  "autriche": "EUR", "portugal": "EUR", "finlande": "EUR",
  "grece": "EUR", "irlande": "EUR", "luxembourg": "EUR",
  "slovaquie": "EUR", "slovenie": "EUR", "estonie": "EUR",
  "lettonie": "EUR", "lituanie": "EUR", "malte": "EUR",
  "chypre": "EUR", "croatie": "EUR", "andorre": "EUR",
  "monaco": "EUR", "saint-marin": "EUR", "vatican": "EUR",
  "kosovo": "EUR", "montenegro": "EUR",

  // Europe (non-Euro)
  "royaume-uni": "GBP", "suisse": "CHF", "suede": "SEK",
  "norvege": "NOK", "danemark": "DKK", "pologne": "PLN",
  "roumanie": "RON", "hongrie": "HUF", "republique_tcheque": "CZK",
  "turquie": "TRY", "ukraine": "UAH", "russie": "RUB",
  "serbie": "RSD", "bulgarie": "BGN", "islande": "ISK",
  "moldavie": "MDL", "bielorussie": "BYN", "albanie": "ALL",
  "macedoine_du_nord": "MKD", "bosnie-herzegovine": "BAM",

  // Caucase / Asie centrale
  "armenie": "AMD", "georgie": "GEL", "azerbaidjan": "AZN",
  "kazakhstan": "KZT", "ouzbekistan": "UZS", "kirghizistan": "KGS",
  "tadjikistan": "TJS", "turkmenistan": "TMT",

  // Moyen-Orient
  "iran": "IRR", "irak": "IQD", "emirats_arabes_unis": "AED",
  "arabie_saoudite": "SAR", "israel": "ILS", "jordanie": "JOD",
  "liban": "LBP", "koweit": "KWD", "qatar": "QAR",
  "bahrain": "BHD", "oman": "OMR", "yemen": "YER", "syrie": "SYP",

  // Asie
  "japon": "JPY", "chine": "CNY", "coree_du_sud": "KRW",
  "coree_du_nord": "KPW", "inde": "INR", "thailande": "THB",
  "philippines": "PHP", "indonesie": "IDR", "malaisie": "MYR",
  "singapour": "SGD", "pakistan": "PKR", "sri_lanka": "LKR",
  "vietnam": "VND", "bangladesh": "BDT", "nepal": "NPR",
  "myanmar": "MMK", "cambodge": "KHR", "laos": "LAK",
  "mongolie": "MNT", "taiwan": "TWD", "hong_kong": "HKD",
  "macao": "MOP",

  // Afrique
  "afrique_du_sud": "ZAR", "egypte": "EGP", "maroc": "MAD",
  "tunisie": "TND", "algerie": "DZD", "nigeria": "NGN",
  "kenya": "KES", "tanzanie": "TZS", "ghana": "GHS",
  "ethiopie": "ETB", "ouganda": "UGX", "mozambique": "MZN",
  "maurice": "MUR", "libye": "LYD", "soudan": "SDG",

  // Océanie
  "australie": "AUD", "nouvelle-zelande": "NZD", "fidji": "FJD",
  "papouasie-nouvelle-guinee": "PGK",
};

// Devises historiques, matchées par MOT ENTIER (jamais une sous-chaîne) et,
// pour les noms ambigus (franc, lire, mark…), désambiguïsées par émetteur.
// Évite « Franc CFA » → FRF, « Markka » → DEM, « Lira turca » → ITL.
const HISTORICAL_RULES: { re: RegExp; issuers?: string[]; code: string }[] = [
  { re: /\bpeseta\b/, issuers: ["espagne", "andorre"], code: "ESP" },
  { re: /\bescudo\b/, code: "PTE" },
  { re: /\bschilling\b/, code: "ATS" },
  { re: /\bdrachm/, code: "GRD" },
  { re: /\bflorin\b|\bgulden\b/, code: "NLG" },
  { re: /\bcruzeiro\b/, code: "BRZ" },
  { re: /\bsol de oro\b/, code: "PEH" },
  { re: /\baustral\b/, code: "ARA" },
  // Noms ambigus → garde par émetteur :
  { re: /\bfranc\b/, issuers: ["france", "monaco"], code: "FRF" },
  { re: /\blire\b|\blira\b/, issuers: ["italie", "saint-marin", "vatican"], code: "ITL" },
  { re: /\bmark\b/, issuers: ["allemagne"], code: "DEM" },
];

function resolveCurrencyCode(
  issuerCode: string | undefined,
  currencyName: string | undefined,
  currencyFullName: string | undefined,
): string | null {
  if (!issuerCode) return null;

  const isCurrent = currencyFullName?.includes("présent")
    || currencyFullName?.includes("date");

  if (isCurrent) {
    return ISSUER_CODE_TO_ISO[issuerCode] ?? null;
  }

  if (currencyName) {
    const lower = currencyName.toLowerCase();
    for (const { re, issuers, code } of HISTORICAL_RULES) {
      if (re.test(lower) && (!issuers || issuers.includes(issuerCode))) return code;
    }
  }

  return null;
}

function computeRarityScore(mintage: number | null): number | null {
  if (mintage == null || mintage <= 0) return null; // 0 / inconnu ≠ « ultra-rare »
  if (mintage > 100_000_000) return 1;
  if (mintage > 10_000_000) return 3;
  if (mintage > 1_000_000) return 5;
  if (mintage > 100_000) return 7;
  return 9;
}

function buildNumistaUrl(typeId: number): string {
  return `https://fr.numista.com/catalogue/pieces${typeId}.html`;
}

function emptyCoin(coin: RawCoin): CoinWithPrices {
  return {
    raw: coin, issue: null,
    price: null, priceGrade: null, allPrices: new Array(7).fill(0),
    faceValue: null, faceValueText: null,
    currencyCode: null, mintage: null, rarityScore: null, numistaUrl: null,
    confidence: "none", ambiguous: false, qualityGuess: "unknown", matchReason: "",
  };
}

async function evaluateCoin(coin: RawCoin, client: NumistaClient, currency: string): Promise<CoinWithPrices> {
  if (!coin.typeId) return emptyCoin(coin);

  const [typeInfo, issues] = await Promise.all([
    client.getType(coin.typeId),
    client.getIssues(coin.typeId),
  ]);

  const query: IssueQuery = {
    year: coin.year,
    strikeYear: coin.strikeYear,
    mintMark: coin.mintMark,
    mintIsGlyphOnly: coin.mintIsGlyphOnly,
    refBase: refBaseFromRefKM(coin.refKM),
    expectsProof: false,
  };
  const selection = selectIssue(issues, query);
  const bestIssue = selection.issue;

  const numistaUrl = buildNumistaUrl(coin.typeId);
  const faceValue = typeInfo?.value?.numeric_value ?? null;
  const faceValueText = typeInfo?.value?.text ?? null;
  const currencyCode = resolveCurrencyCode(
    typeInfo?.issuer?.code,
    typeInfo?.value?.currency?.name,
    typeInfo?.value?.currency?.full_name,
  );
  const mintage = bestIssue?.mintage ?? null;

  const allPrices = new Array(7).fill(0);
  let price: number | null = null;
  let priceGrade: Grade | null = null;

  if (bestIssue) {
    const priceData = await client.getPrices(coin.typeId, bestIssue.id, currency);
    for (const p of priceData?.prices ?? []) {
      const idx = GRADE_ORDER.indexOf(p.grade as Grade);
      if (idx !== -1) allPrices[idx] = p.price;
    }
    const lowestIdx = allPrices.findIndex((p: number) => p > 0);
    if (lowestIdx !== -1) {
      price = allPrices[lowestIdx];
      priceGrade = GRADE_ORDER[lowestIdx];
    }
  }

  return {
    raw: coin,
    issue: bestIssue,
    price,
    priceGrade,
    allPrices,
    faceValue,
    faceValueText,
    currencyCode,
    mintage,
    rarityScore: computeRarityScore(mintage),
    numistaUrl,
    confidence: selection.confidence,
    ambiguous: selection.ambiguous,
    qualityGuess: selection.qualityGuess,
    matchReason: selection.reason,
  };
}

export function buildSide(coins: CoinWithPrices[], rates: Record<string, number>, currency: string): ExchangeSide {
  let totalPrice = 0;
  let totalFaceValue = 0;
  let totalConvertedNominal = 0;
  let totalMintage = 0;
  let noPriceCount = 0;

  for (const c of coins) {
    // On ne somme que les pièces INCLUSES (raw.selected), exactement comme l'Excel
    // qui filtre tous ses totaux sur la colonne d'inclusion (SUMIF …,"✓",…). Sans ce
    // filtre, terminal et Excel partiraient d'entrées différentes → verdicts divergents.
    if (!c.raw.selected) continue;
    if (c.price != null) {
      totalPrice += c.price;
    } else {
      noPriceCount++;
    }
    totalFaceValue += c.faceValue ?? 0;
    totalConvertedNominal += convertToCurrency(c.faceValue, c.currencyCode, currency, rates) ?? 0;
    totalMintage += c.mintage ?? 0;
  }

  return { coins, totalPrice, totalFaceValue, totalConvertedNominal, totalMintage, noPriceCount };
}

/**
 * Évalue une liste de pièces. Une erreur réseau sur une pièce ne perd pas les
 * précédentes (pièce vide à la place) ; un quota atteint (429) stoppe net.
 */
async function evaluateList(
  coins: RawCoin[],
  client: NumistaClient,
  currency: string,
  arrow: string,
  onProgress?: (msg: string) => void,
): Promise<{ results: CoinWithPrices[]; stopped: boolean }> {
  const results: CoinWithPrices[] = [];
  for (const coin of coins) {
    onProgress?.(`  ${arrow} ${coin.title || coin.issuer}`);
    try {
      results.push(await evaluateCoin(coin, client, currency));
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        onProgress?.("  ⚠ Quota API atteint (429) — évaluation interrompue.");
        return { results, stopped: true };
      }
      onProgress?.(`  ⚠ Échec pour ${coin.title || coin.issuer} — pièce ignorée.`);
      results.push(emptyCoin(coin));
    }
  }
  return { results, stopped: false };
}

export async function evaluate(
  title: string,
  demanded: RawCoin[],
  offered: RawCoin[],
  client: NumistaClient,
  currency: string,
  onProgress?: (msg: string) => void,
): Promise<EvaluationReport> {
  onProgress?.(`Évaluation de ${demanded.length + offered.length} pièces...`);

  const demandedRun = await evaluateList(demanded, client, currency, "→", onProgress);
  const offeredRun = demandedRun.stopped
    ? { results: offered.map(emptyCoin), stopped: true }
    : await evaluateList(offered, client, currency, "←", onProgress);
  const incomplete = demandedRun.stopped || offeredRun.stopped;

  const rates = await fetchExchangeRates(currency.toLowerCase());
  if (Object.keys(rates).length === 0) {
    onProgress?.("  ⚠ Taux de change indisponibles — valeurs nominales non converties (indice nominal ignoré).");
  }
  const demandedSide = buildSide(demandedRun.results, rates, currency);
  const offeredSide = buildSide(offeredRun.results, rates, currency);

  const missingCurrency = [...demandedRun.results, ...offeredRun.results]
    .filter((c) => c.faceValue != null && c.currencyCode == null).length;
  if (missingCurrency > 0) {
    onProgress?.(`  ⚠ ${missingCurrency} pièce(s) sans devise reconnue — valeur nominale non convertie.`);
  }

  const balance = demandedSide.totalPrice - offeredSide.totalPrice;
  const balancePercent = offeredSide.totalPrice > 0 ? (balance / offeredSide.totalPrice) * 100 : 0;

  // Verdict = score pondéré sur prix + nominal + tirage (mêmes poids/seuils que l'Excel).
  // La qualité (QA) n'existe qu'en saisie Excel → absente côté terminal, donc exclue ici.
  const fairnessScore = compositeScore(
    {
      price: { received: demandedSide.totalPrice, given: offeredSide.totalPrice },
      nominal: { received: demandedSide.totalConvertedNominal, given: offeredSide.totalConvertedNominal },
      mintage: { received: demandedSide.totalMintage, given: offeredSide.totalMintage },
    },
    DEFAULT_WEIGHTS,
  );

  return {
    title,
    timestamp: new Date().toISOString(),
    currency,
    demanded: demandedSide,
    offered: offeredSide,
    balance,
    balancePercent,
    fairnessScore,
    verdict: verdictFromScore(fairnessScore),
    apiCallsUsed: client.callCount,
    incomplete,
  };
}
