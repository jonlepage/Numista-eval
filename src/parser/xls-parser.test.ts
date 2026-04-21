import { describe, it, expect } from "vitest";
import path from "path";
import { parseNumistaXls } from "./xls-parser.js";

const EXAMPLE_FILE = path.resolve("doc/echange_etangua_jonlepage_1.example.xls");

describe("parseNumistaXls", () => {
  it("parse le titre de l'échange", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    expect(result.title).toContain("JonLepage");
    expect(result.title).toContain("Etangua");
  });

  it("extrait 10 pièces demandées", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    expect(result.demanded).toHaveLength(10);
  });

  it("extrait 10 pièces offertes", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    expect(result.offered).toHaveLength(10);
  });

  it("extrait les type_id Numista correctement", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    const firstCoin = result.demanded[0];
    expect(firstCoin.typeId).toBe(365);
    expect(firstCoin.issuer).toBe("Canada");
    expect(firstCoin.year).toBe(1973);
  });

  it("extrait les ateliers de frappe", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    const usCoin = result.demanded.find((c) => c.typeId === 130422);
    expect(usCoin?.mintMark).toBe("P");
  });

  it("n'inclut pas les lignes d'en-tête ou TOTAL", () => {
    const result = parseNumistaXls(EXAMPLE_FILE);
    const titles = result.demanded.map((c) => c.title);
    expect(titles).not.toContain("Désignation");
    expect(titles).not.toContain("TOTAL :");
  });
});
