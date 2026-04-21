import type {
  RawCoin,
  CoinWithPrices,
  ExchangeSide,
  EvaluationReport,
  Verdict,
} from "../types/index.js";
import { NumistaClient } from "../api/numista-client.js";

const DEFAULT_GRADE = "vf" as const;

// L'API Numista retourne des noms génériques ("Dollar", "Peso") — il faut croiser avec le pays
const ISSUER_CURRENCY_MAP: Record<string, string> = {
  "canada": "CAD",
  "états-unis": "USD", "united states": "USD",
  "france": "EUR", "allemagne": "EUR", "italie": "EUR", "espagne": "EUR",
  "belgique": "EUR", "pays-bas": "EUR", "autriche": "EUR", "portugal": "EUR",
  "finlande": "EUR", "grèce": "EUR", "irlande": "EUR", "luxembourg": "EUR",
  "royaume-uni": "GBP", "united kingdom": "GBP",
  "philippines": "PHP",
  "cuba": "CUP",
  "république dominicaine": "DOP",
  "mexique": "MXN",
  "japon": "JPY",
  "suisse": "CHF",
  "australie": "AUD",
  "brésil": "BRL",
  "chine": "CNY",
  "inde": "INR",
  "russie": "RUB",
  "corée du sud": "KRW",
  "suède": "SEK",
  "norvège": "NOK",
  "danemark": "DKK",
  "nouvelle-zélande": "NZD",
  "argentine": "ARS",
  "colombie": "COP",
  "pérou": "PEN",
  "chili": "CLP",
  "thaïlande": "THB",
  "turquie": "TRY",
  "pologne": "PLN",
  "roumanie": "RON",
  "hongrie": "HUF",
  "république tchèque": "CZK",
};

// Devises historiques (non convertibles) détectées via le nom de devise
const HISTORICAL_CURRENCY_MAP: Record<string, string> = {
  "lire": "ITL", "lira": "ITL",
  "franc": "FRF",
  "mark": "DEM",
  "peseta": "ESP",
  "escudo": "PTE",
  "schilling": "ATS",
  "drachme": "GRD", "drachma": "GRD",
  "florin": "NLG", "gulden": "NLG",
};

function guessCurrencyCode(issuer: string, currencyName: string | undefined): string | null {
  if (!currencyName) return null;

  // D'abord vérifier les devises historiques par le nom
  const lowerCurrency = currencyName.toLowerCase();
  for (const [key, code] of Object.entries(HISTORICAL_CURRENCY_MAP)) {
    if (lowerCurrency.includes(key)) return code;
  }

  // Sinon, déduire depuis le pays émetteur
  const lowerIssuer = issuer.toLowerCase();
  for (const [key, code] of Object.entries(ISSUER_CURRENCY_MAP)) {
    if (lowerIssuer.includes(key)) return code;
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
  if (!coin.typeId) {
    return {
      raw: coin, issue: null,
      priceVF: null, faceValue: null, faceValueText: null,
      currencyCode: null, mintage: null, rarityScore: null, numistaUrl: null,
    };
  }

  const [typeInfo, issues] = await Promise.all([
    client.getType(coin.typeId),
    client.getIssues(coin.typeId),
  ]);

  const bestIssue = client.findBestIssue(issues, coin.year, coin.mintMark);
  const numistaUrl = buildNumistaUrl(coin.typeId);
  const faceValue = typeInfo?.value?.numeric_value ?? null;
  const faceValueText = typeInfo?.value?.text ?? null;
  const currencyCode = guessCurrencyCode(coin.issuer, typeInfo?.value?.currency?.name);
  const mintage = bestIssue?.mintage ?? null;

  let priceVF: number | null = null;

  if (bestIssue) {
    const priceData = await client.getPrices(coin.typeId, bestIssue.id, currency);
    for (const p of priceData?.prices ?? []) {
      if (p.grade === DEFAULT_GRADE) {
        priceVF = p.price;
        break;
      }
    }
  }

  return {
    raw: coin,
    issue: bestIssue,
    priceVF,
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
    if (c.priceVF != null) {
      totalPrice += c.priceVF;
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
