import { describe, it, expect } from "vitest";
import { buildSide } from "./evaluator.js";
import type { CoinWithPrices, RawCoin } from "../types/index.js";

const rawCoin = (selected: boolean): RawCoin => ({
  issuer: "X",
  refKM: "",
  typeId: 1,
  title: "t",
  year: 2000,
  yearRaw: "2000",
  strikeYear: null,
  mintMark: null,
  rawMintMark: "",
  mintIsGlyphOnly: false,
  selected,
});

const coin = (selected: boolean, price: number | null, mintage: number): CoinWithPrices => ({
  raw: rawCoin(selected),
  issue: null,
  price,
  priceGrade: price != null ? "f" : null,
  allPrices: new Array(7).fill(0),
  faceValue: null,
  faceValueText: null,
  currencyCode: null,
  mintage,
  rarityScore: null,
  numistaUrl: null,
  confidence: "high",
  ambiguous: false,
  qualityGuess: "circulation",
  matchReason: "",
});

describe("buildSide — n'agrège que les pièces incluses (parité avec l'Excel SUMIF \"✓\")", () => {
  it("exclut les pièces non sélectionnées des totaux et du compteur sans-prix", () => {
    const side = buildSide(
      [
        coin(true, 10, 1000), // incluse, avec prix
        coin(false, 999, 999_999), // EXCLUE — ne doit rien apporter
        coin(true, null, 2000), // incluse, sans prix
      ],
      {},
      "CAD",
    );
    expect(side.totalPrice).toBe(10); // 999 de la pièce exclue ignoré
    expect(side.totalMintage).toBe(3000); // 1000 + 2000, pas 999 999
    expect(side.noPriceCount).toBe(1); // seule la pièce INCLUSE sans prix compte
  });
});
