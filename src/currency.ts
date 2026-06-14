// Taux de change (CDN @fawazahmed0/currency-api) + conversion de valeur nominale.
// Partagé entre l'évaluateur (verdict pondéré) et le rapport Excel (table de conversion).

/** Récupère les taux pour 1 unité de `targetCurrency` → autres devises. */
export async function fetchExchangeRates(targetCurrency: string): Promise<Record<string, number>> {
  try {
    const base = targetCurrency.toLowerCase();
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, Record<string, number>>;
    return data[base] ?? {};
  } catch {
    return {};
  }
}

/**
 * Convertit `amount` exprimé dans `fromCode` vers `target`, via les taux de `target`.
 * Renvoie `null` si la conversion est impossible (devise inconnue / taux absent).
 */
export function convertToCurrency(
  amount: number | null,
  fromCode: string | null,
  target: string,
  rates: Record<string, number>,
): number | null {
  if (amount == null || !fromCode) return null;
  if (fromCode.toLowerCase() === target.toLowerCase()) return amount;
  const rate = rates[fromCode.toLowerCase()]; // unités de fromCode pour 1 target
  if (!rate) return null;
  return amount / rate;
}
