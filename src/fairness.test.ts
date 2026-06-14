import { describe, it, expect } from "vitest";
import { gapPercent, compositeScore, verdictFromScore, DEFAULT_WEIGHTS } from "./fairness.js";

describe("gapPercent", () => {
  it("écart % signé, null si donné non chiffré", () => {
    expect(gapPercent(120, 100)).toBe(20);
    expect(gapPercent(80, 100)).toBe(-20);
    expect(gapPercent(50, 0)).toBeNull();
    expect(gapPercent(0, 0)).toBeNull();
  });
});

describe("compositeScore", () => {
  it("moyenne pondérée des écarts présents", () => {
    // prix +20 (poids 3), tirage écart 0 (poids 3, signe -) → (3*20 + 0)/6 = 10
    const s = compositeScore(
      { price: { received: 120, given: 100 }, mintage: { received: 100, given: 100 } },
      DEFAULT_WEIGHTS,
    );
    expect(s).toBeCloseTo(10, 5);
  });

  it("le tirage est compté à l'envers (moins de tirage = favorable)", () => {
    // tirage -50 % seul → -1 * -50 = +50
    const s = compositeScore({ mintage: { received: 50, given: 100 } }, DEFAULT_WEIGHTS);
    expect(s).toBeCloseTo(50, 5);
  });

  it("renormalise sur les dimensions disponibles (nominal absent ignoré)", () => {
    const s = compositeScore(
      { price: { received: 120, given: 100 }, nominal: { received: 0, given: 0 } },
      DEFAULT_WEIGHTS,
    );
    expect(s).toBeCloseTo(20, 5); // (3*20)/3, nominal exclu (donné 0)
  });

  it("aucune dimension chiffrable → null", () => {
    expect(compositeScore({ price: { received: 0, given: 0 } }, DEFAULT_WEIGHTS)).toBeNull();
    expect(compositeScore({}, DEFAULT_WEIGHTS)).toBeNull();
  });
});

describe("verdictFromScore", () => {
  it("applique les seuils 8/20 sur la valeur absolue", () => {
    expect(verdictFromScore(null)).toBe("indetermine");
    expect(verdictFromScore(5)).toBe("equitable");
    expect(verdictFromScore(-7)).toBe("equitable");
    expect(verdictFromScore(15)).toBe("acceptable");
    expect(verdictFromScore(-25)).toBe("desequilibre");
  });
});
