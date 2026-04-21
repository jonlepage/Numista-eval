import type { NumistaIssue, NumistaPriceResponse, NumistaType } from "../types/index.js";

const API_BASE = "https://api.numista.com/v3";
const RATE_LIMIT_MS = 250;

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
      if (res.status === 429) {
        console.error("  ⚠ Quota API atteint (429). Arrêt.");
      }
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

  findBestIssue(issues: NumistaIssue[], year: number, mintMark: string): NumistaIssue | null {
    if (issues.length === 0) return null;

    for (const issue of issues) {
      const issueYear = issue.gregorian_year ?? issue.year ?? 0;
      const issueMint = issue.mint_letter ?? "";
      if (issueYear === year && (!mintMark || issueMint === mintMark)) {
        return issue;
      }
    }

    for (const issue of issues) {
      const issueYear = issue.gregorian_year ?? issue.year ?? 0;
      if (issueYear === year) {
        return issue;
      }
    }

    return issues[0];
  }
}
