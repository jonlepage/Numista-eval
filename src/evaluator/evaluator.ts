import type {
  RawCoin,
  CoinWithPrices,
  ExchangeSide,
  EvaluationReport,
  Verdict,
  Grade,
} from "../types/index.js";
import { GRADE_ORDER } from "../types/index.js";
import { NumistaClient } from "../api/numista-client.js";

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

const HISTORICAL_CURRENCY_MAP: Record<string, string> = {
  "lire": "ITL", "lira": "ITL",
  "franc": "FRF",
  "mark": "DEM",
  "peseta": "ESP",
  "escudo": "PTE",
  "schilling": "ATS",
  "drachme": "GRD", "drachma": "GRD",
  "florin": "NLG", "gulden": "NLG",
  "cruzeiro": "BRZ",
  "sol de oro": "PEH",
  "austral": "ARA",
  "peso moneda nacional": "ARM",
};

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
    for (const [key, code] of Object.entries(HISTORICAL_CURRENCY_MAP)) {
      if (lower.includes(key)) return code;
    }
  }

  return null;
}

function computeRarityScore(mintage: number | null): number | null {
  if (mintage == null) return null;
  if (mintage > 100_000_000) return 1;
  if (mintage > 10_000_000) return 3;
  if (mintage > 1_000_000) return 5;
  if (mintage > 100_000) return 7;
  return 9;
}

function buildNumistaUrl(typeId: number): string {
  return `https://fr.numista.com/catalogue/pieces${typeId}.html`;
}

async function evaluateCoin(coin: RawCoin, client: NumistaClient, currency: string): Promise<CoinWithPrices> {
  const empty: CoinWithPrices = {
    raw: coin, issue: null,
    price: null, priceGrade: null, allPrices: new Array(7).fill(0),
    faceValue: null, faceValueText: null,
    currencyCode: null, mintage: null, rarityScore: null, numistaUrl: null,
  };

  if (!coin.typeId) return empty;

  const [typeInfo, issues] = await Promise.all([
    client.getType(coin.typeId),
    client.getIssues(coin.typeId),
  ]);

  const bestIssue = client.findBestIssue(issues, coin.year, coin.mintMark);
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
  };
}

function buildSide(coins: CoinWithPrices[]): ExchangeSide {
  let totalPrice = 0;
  let totalFaceValue = 0;
  let noPriceCount = 0;
  const rarityScores: number[] = [];

  for (const c of coins) {
    if (c.price != null) {
      totalPrice += c.price;
    } else {
      noPriceCount++;
    }
    totalFaceValue += c.faceValue ?? 0;
    if (c.rarityScore != null) rarityScores.push(c.rarityScore);
  }

  const avgRarity = rarityScores.length > 0
    ? rarityScores.reduce((a, b) => a + b, 0) / rarityScores.length
    : null;

  return { coins, totalPrice, totalFaceValue, avgRarity, noPriceCount };
}

function getVerdict(balancePercent: number): Verdict {
  const abs = Math.abs(balancePercent);
  if (abs <= 10) return "equitable";
  if (abs <= 25) return "acceptable";
  return "desequilibre";
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

  const demandedCoins: CoinWithPrices[] = [];
  for (const coin of demanded) {
    onProgress?.(`  → ${coin.title || coin.issuer}`);
    demandedCoins.push(await evaluateCoin(coin, client, currency));
  }

  const offeredCoins: CoinWithPrices[] = [];
  for (const coin of offered) {
    onProgress?.(`  ← ${coin.title || coin.issuer}`);
    offeredCoins.push(await evaluateCoin(coin, client, currency));
  }

  const demandedSide = buildSide(demandedCoins);
  const offeredSide = buildSide(offeredCoins);

  const balance = demandedSide.totalPrice - offeredSide.totalPrice;
  const balancePercent = offeredSide.totalPrice > 0 ? (balance / offeredSide.totalPrice) * 100 : 0;

  return {
    title,
    timestamp: new Date().toISOString(),
    currency,
    demanded: demandedSide,
    offered: offeredSide,
    balance,
    balancePercent,
    verdict: getVerdict(balancePercent),
    apiCallsUsed: client.callCount,
  };
}
