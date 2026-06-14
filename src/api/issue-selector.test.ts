import { describe, it, expect } from "vitest";
import { selectIssue, detectQuality, refBaseOf, refBaseFromRefKM } from "./issue-selector.js";
import type { NumistaIssue, IssueQuery } from "../types/index.js";

const iss = (o: Partial<NumistaIssue> & { id: number }): NumistaIssue => ({ is_dated: true, ...o });

const query = (o: Partial<IssueQuery> = {}): IssueQuery => ({
  year: null,
  strikeYear: null,
  mintMark: null,
  mintIsGlyphOnly: false,
  refBase: null,
  expectsProof: false,
  ...o,
});

describe("selectIssue — cas réels diagnostiqués", () => {
  it("peseta 1975 (1977) : retient la circulation (243 M), pas la Belle Épreuve", () => {
    const issues = [
      iss({ id: 130978, year: 1975, gregorian_year: 1977, comment: "Belle Épreuve" }),
      iss({ id: 26624, year: 1975, gregorian_year: 1977, mintage: 243380000, comment: '(en) "77" on star' }),
    ];
    const sel = selectIssue(issues, query({ year: 1975, strikeYear: 1977, mintIsGlyphOnly: true }));
    expect(sel.issue?.id).toBe(26624);
    expect(sel.qualityGuess).toBe("circulation");
    expect(sel.confidence).toBe("high");
  });

  it("franc 1992 : retient la circulation (30 M), pas l'Essai (tirage 1850)", () => {
    const issues = [
      iss({ id: 34344, year: 1992, gregorian_year: 1992, mintage: 1850, comment: "Essai" }),
      iss({ id: 281, year: 1992, gregorian_year: 1992, mintage: 30000033, comment: "" }),
    ];
    const sel = selectIssue(issues, query({ year: 1992 }));
    expect(sel.issue?.id).toBe(281);
  });

  it("franc 1988 : retient « avec différents » (49 M) via la richesse d'information", () => {
    const issues = [
      iss({ id: 274066, year: 1988, gregorian_year: 1988, comment: "sans différents" }),
      iss({ id: 279, year: 1988, gregorian_year: 1988, mintage: 49917011, marks: [{ letters: "" }], comment: "avec différents" }),
    ];
    const sel = selectIssue(issues, query({ year: 1988 }));
    expect(sel.issue?.id).toBe(279);
  });
});

describe("selectIssue — angles morts du scoring naïf", () => {
  it("type 100 % épreuves : retient l'épreuve sans la pénaliser à tort", () => {
    const issues = [iss({ id: 10, gregorian_year: 2010, comment: "Belle Épreuve" })];
    const sel = selectIssue(issues, query({ year: 2010 }));
    expect(sel.issue?.id).toBe(10);
    expect(sel.qualityGuess).toBe("proof");
    expect(sel.issue).not.toBeNull();
  });

  it("ordre serveur mélangé : choix déterministe par tirage max", () => {
    const a = [iss({ id: 1, gregorian_year: 2000, mintage: 100 }), iss({ id: 2, gregorian_year: 2000, mintage: 200 })];
    const b = [iss({ id: 2, gregorian_year: 2000, mintage: 200 }), iss({ id: 1, gregorian_year: 2000, mintage: 100 })];
    expect(selectIssue(a, query({ year: 2000 })).issue?.id).toBe(2);
    expect(selectIssue(b, query({ year: 2000 })).issue?.id).toBe(2);
  });

  it("aucune ancre (ND) sur plusieurs émissions sans info : renvoie null, jamais issues[0]", () => {
    const issues = [iss({ id: 1, gregorian_year: 1990, comment: "" }), iss({ id: 2, gregorian_year: 1991, comment: "" })];
    const sel = selectIssue(issues, query({ year: null }));
    expect(sel.issue).toBeNull();
    expect(sel.confidence).toBe("none");
  });

  it("atelier glyphe : neutre, ne disqualifie pas une émission qui matche l'année", () => {
    const issues = [iss({ id: 7, gregorian_year: 1977, mint_letter: "R", mintage: 1000 })];
    const sel = selectIssue(issues, query({ year: 1975, strikeYear: 1977, mintIsGlyphOnly: true }));
    expect(sel.issue?.id).toBe(7);
  });

  it("référence de base départage deux émissions par ailleurs identiques", () => {
    const issues = [
      iss({ id: 1, gregorian_year: 2005, mintage: 500, references: [{ number: "100/1" }] }),
      iss({ id: 2, gregorian_year: 2005, mintage: 500, references: [{ number: "227/2" }] }),
    ];
    const sel = selectIssue(issues, query({ year: 2005, refBase: "227" }));
    expect(sel.issue?.id).toBe(2);
  });

  it("variétés indécidables (même année, tirages égaux) : déterministe + drapeau ambigu", () => {
    const issues = [
      iss({ id: 5, gregorian_year: 1978, mintage: 1000, comment: "variété A" }),
      iss({ id: 9, gregorian_year: 1978, mintage: 1000, comment: "variété B" }),
    ];
    const sel = selectIssue(issues, query({ year: 1978 }));
    expect(sel.issue?.id).toBe(5); // id croissant en départage final
    expect(sel.ambiguous).toBe(true);
  });
});

describe("selectIssue — corrections de revue", () => {
  it("un pair vide (unknown) ne pénalise pas une vraie épreuve : l'épreuve renseignée gagne", () => {
    const issues = [
      iss({ id: 1, gregorian_year: 2010, mintage: 8000, comment: "Belle Épreuve" }),
      iss({ id: 2, gregorian_year: 2010, comment: "" }), // placeholder vide, aucun tirage
    ];
    const sel = selectIssue(issues, query({ year: 2010 }));
    expect(sel.issue?.id).toBe(1); // pas le placeholder vide
    expect(sel.qualityGuess).toBe("proof");
  });

  it("« high » n'est pas atteint quand le gain ne vient que de la pénalité du second", () => {
    const issues = [
      iss({ id: 1, gregorian_year: 2000, mintage: 8000, comment: "Belle Épreuve" }), // pénalisée -25
      iss({ id: 2, gregorian_year: 2000, comment: "pièce courante" }), // circulation, richness 0
    ];
    const sel = selectIssue(issues, query({ year: 2000 }));
    expect(sel.issue?.id).toBe(2); // la circulation l'emporte (0 > 11-25)
    expect(sel.confidence).not.toBe("high"); // vainqueur sans info positive → pas « high »
  });

  it("émission unique sans correspondance d'année → null (pas le prix d'une année erronée)", () => {
    const issues = [iss({ id: 99, gregorian_year: 2020, comment: "" })];
    const sel = selectIssue(issues, query({ year: 1850 }));
    expect(sel.issue).toBeNull();
    expect(sel.confidence).toBe("none");
  });
});

describe("helpers", () => {
  it("detectQuality : commentaire vide = inconnu (≠ circulation)", () => {
    expect(detectQuality(undefined)).toBe("unknown");
    expect(detectQuality("")).toBe("unknown");
    expect(detectQuality("Belle Épreuve")).toBe("proof");
    expect(detectQuality("Essai")).toBe("proof");
    expect(detectQuality("avec différents")).toBe("circulation");
  });

  it("refBaseOf / refBaseFromRefKM extraient le bon numéro de base", () => {
    expect(refBaseOf("227/3")).toBe("227");
    expect(refBaseFromRefKM("Franc 2014# 227")).toBe("227"); // pas « 2014 »
    expect(refBaseFromRefKM("KM# 806")).toBe("806");
  });
});
