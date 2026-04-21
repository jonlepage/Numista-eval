export interface RawCoin {
  issuer: string;
  refKM: string;
  typeId: number | null;
  title: string;
  year: number;
  mintMark: string;
}

export interface ParsedExchange {
  title: string;
  demanded: RawCoin[];
  offered: RawCoin[];
}

export interface NumistaIssue {
  id: number;
  is_dated: boolean;
  year?: number;
  gregorian_year?: number;
  mint_letter?: string;
  mintage?: number;
  comment?: string;
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

export interface CoinWithPrices {
  raw: RawCoin;
  issue: NumistaIssue | null;
  priceVF: number | null;
  faceValue: number | null;
  faceValueText: string | null;
  currencyCode: string | null;
  mintage: number | null;
  rarityScore: number | null;
  numistaUrl: string | null;
}

export interface ExchangeSide {
  coins: CoinWithPrices[];
  totalPrice: number;
  totalFaceValue: number;
  avgRarity: number | null;
  noPriceCount: number;
}

export type Verdict = "equitable" | "acceptable" | "desequilibre";

export interface EvaluationReport {
  title: string;
  timestamp: string;
  currency: string;
  demanded: ExchangeSide;
  offered: ExchangeSide;
  balance: number;
  balancePercent: number;
  verdict: Verdict;
  apiCallsUsed: number;
}
