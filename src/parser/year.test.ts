import { describe, it, expect } from "vitest";
import { extractYear, extractMint, yearCellHasNumber } from "./year.js";

describe("extractYear", () => {
  const cases: [string | number, number | null, number | null][] = [
    // entrée, year attendu, strikeYear attendu
    [1973, 1973, null],
    ["1992", 1992, null],
    ["1975 (1977)", 1975, 1977], // millésime gelé + frappe réelle (cas peseta)
    ["1980 (1981)", 1980, 1981],
    ["1939-1945", 1939, null], // plage → premier nombre
    ["1939–1945", 1939, null], // tiret long normalisé
    ["ND (1970)", 1970, 1970], // sans date mais frappe connue
    ["ND", null, null],
    ["", null, null],
    ["1880 M", 1880, null], // atelier collé : l'année reste extraite
    ["foo bar", null, null],
  ];

  for (const [input, year, strikeYear] of cases) {
    it(`extrait year=${year} strike=${strikeYear} de ${JSON.stringify(input)}`, () => {
      const r = extractYear(input);
      expect(r.year).toBe(year);
      expect(r.strikeYear).toBe(strikeYear);
    });
  }

  it("conserve toujours la chaîne brute", () => {
    expect(extractYear("1975 (1977)").yearRaw).toBe("1975 (1977)");
  });

  it("ne renvoie jamais 0 comme sentinelle (null à la place)", () => {
    expect(extractYear("inconnu").year).toBeNull();
  });
});

describe("extractMint", () => {
  it("normalise une lettre d'atelier", () => {
    expect(extractMint("P")).toMatchObject({ mintMark: "P", isGlyphOnly: false });
    expect(extractMint("d")).toMatchObject({ mintMark: "D" });
  });

  it("traite un glyphe étoile comme atelier non lettré", () => {
    const r = extractMint("🟌");
    expect(r.mintMark).toBeNull();
    expect(r.isGlyphOnly).toBe(true);
    expect(r.rawMintMark).toBe("🟌");
  });

  it("vide → mintMark null, non glyphe", () => {
    expect(extractMint("")).toMatchObject({ mintMark: null, isGlyphOnly: false });
  });
});

describe("yearCellHasNumber", () => {
  it("vrai pour un nombre, vrai pour un texte avec millésime, faux pour un en-tête", () => {
    expect(yearCellHasNumber(1992)).toBe(true);
    expect(yearCellHasNumber("1975 (1977)")).toBe(true);
    expect(yearCellHasNumber("Année")).toBe(false);
    expect(yearCellHasNumber(undefined)).toBe(false);
  });
});
