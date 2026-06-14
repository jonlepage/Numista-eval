import type { NumistaIssue, NumistaPriceResponse, NumistaType } from "../types/index.js";

const API_BASE = "https://api.numista.com/v3";
const RATE_LIMIT_MS = 250;

/** Levée quand l'API renvoie 429 : le quota mensuel est atteint, il faut arrêter. */
export class QuotaExceededError extends Error {
  constructor() {
    super("Quota API Numista atteint (429)");
    this.name = "QuotaExceededError";
  }
}

export class NumistaClient {
  private apiKey: string;
  private lang = "fr";
  private lastCallTime = 0;
  public callCount = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    this.lastCallTime = Date.now();
  }

  private async request<T>(path: string): Promise<T | null> {
    await this.throttle();
    this.callCount++;

    const url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}lang=${this.lang}`;
    const res = await fetch(url, {
      headers: { "Numista-API-Key": this.apiKey },
    });

    if (!res.ok) {
      if (res.status === 429) throw new QuotaExceededError();
      // Erreur serveur (5xx) = panne transitoire → on lève pour la distinguer d'une
      // absence réelle de données (4xx → null) ; l'évaluateur l'isole par pièce.
      if (res.status >= 500) throw new Error(`Erreur serveur Numista (${res.status})`);
      return null;
    }

    return res.json() as Promise<T>;
  }

  async getType(typeId: number): Promise<NumistaType | null> {
    return this.request<NumistaType>(`/types/${typeId}`);
  }

  async getIssues(typeId: number): Promise<NumistaIssue[]> {
    const result = await this.request<NumistaIssue[]>(`/types/${typeId}/issues`);
    return result ?? [];
  }

  async getPrices(typeId: number, issueId: number, currency = "CAD"): Promise<NumistaPriceResponse | null> {
    return this.request<NumistaPriceResponse>(
      `/types/${typeId}/issues/${issueId}/prices?currency=${currency}`,
    );
  }
}
