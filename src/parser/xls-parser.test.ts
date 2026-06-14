import { describe, it, expect } from "vitest";
import path from "path";
import { existsSync } from "fs";
import { parseNumistaXls, isDataRow, extractSections, decodeRK, type CellMap } from "./xls-parser.js";

const EXAMPLE_FILE = path.resolve("doc/echange_etangua_jonlepage_1.example.xls");

// La fixture binaire n'est pas versionnée : on saute ce bloc plutôt que de le
// faire échouer silencieusement à chaque exécution.
describe.skipIf(!existsSync(EXAMPLE_FILE))("parseNumistaXls", () => {
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

describe("decodeRK — nombres compressés (fichiers ré-enregistrés par Excel)", () => {
  it("décode un entier RK (année 1980)", () => {
    // (1980 << 2) | 0x02 (drapeau entier) = 7922
    expect(decodeRK(7922)).toBe(1980);
  });

  it("applique le drapeau /100", () => {
    // (1980 << 2) | 0x02 | 0x01 = 7923 → 19.80
    expect(decodeRK(7923)).toBeCloseTo(19.8, 5);
  });

  it("décode un flottant RK (30 bits de poids fort d'un double)", () => {
    // 100.0 → double 0x4059000000000000 → high32 = 0x40590000
    expect(decodeRK(0x40590000)).toBe(100);
  });
});

describe("isDataRow", () => {
  it("retourne true pour une ligne avec année numérique en colonne 4", () => {
    expect(isDataRow({ 0: "Canada", 1: "KM# 81", 2: "N# 365", 3: "25 cents", 4: 1973, 5: "" })).toBe(true);
  });

  it("retourne true pour une ligne avec N# mais sans année", () => {
    expect(isDataRow({ 0: "Canada", 2: "N# 12345", 3: "Some coin" })).toBe(true);
  });

  it("retourne false pour un en-tête de section (texte seul)", () => {
    expect(isDataRow({ 0: "Pièces et billets que je demande :" })).toBe(false);
  });

  it("retourne false pour un en-tête de section russe", () => {
    expect(isDataRow({ 0: "Монеты и банкноты, которые я хочу получить :" })).toBe(false);
  });

  it("retourne false pour une ligne d'en-têtes de colonnes", () => {
    expect(isDataRow({ 0: "Émetteur", 1: "Référence", 2: "N#", 3: "Désignation", 4: "Année" })).toBe(false);
  });

  it("retourne false pour une ligne d'en-têtes anglais", () => {
    expect(isDataRow({ 0: "Issuer", 1: "Reference", 2: "N#", 3: "Designation", 4: "Year" })).toBe(false);
  });

  it("retourne false pour une ligne TOTAL", () => {
    expect(isDataRow({ 0: "TOTAL :", 6: 5, 7: 5 })).toBe(false);
  });

  it("retourne false pour une ligne TOTAL russe", () => {
    expect(isDataRow({ 0: "ИТОГО :", 6: 3, 7: 4 })).toBe(false);
  });

  it("retourne false pour une ligne vide", () => {
    expect(isDataRow({})).toBe(false);
  });

  it("retourne true pour année = 0 (nombre)", () => {
    expect(isDataRow({ 0: "Unknown", 4: 0 })).toBe(true);
  });
});

describe("extractSections — agnostique de la langue", () => {
  it("parse une structure XLS russe", () => {
    const rows: CellMap = {
      0: { 0: "Обмен №1 : aephi - jonlepage" },
      2: { 0: "Монеты и банкноты, которые я хочу получить :" },
      3: { 0: "Эмитент", 1: "Каталожный номер", 2: "N#", 3: "Описание", 4: "Год" },
      4: { 0: "Канада", 1: "KM# 81", 2: "N# 365", 3: "25 центов", 4: 1973, 5: "", 6: "x", 7: "" },
      5: { 0: "Куба", 1: "KM# 35", 2: "N# 2859", 3: "20 сентаво", 4: 1972, 5: "", 6: "x", 7: "" },
      6: { 0: "ИТОГО :", 6: 2, 7: 0 },
      8: { 0: "Монеты и банкноты, которые я отдаю :" },
      9: { 0: "Эмитент", 1: "Каталожный номер", 2: "N#", 3: "Описание", 4: "Год" },
      10: { 0: "Россия", 1: "Y# 834", 2: "N# 999", 3: "1 рубль", 4: 2005, 5: "", 6: "", 7: "x" },
      11: { 0: "ИТОГО :", 6: 0, 7: 1 },
    };
    const result = extractSections(rows);
    expect(result.demanded).toHaveLength(2);
    expect(result.offered).toHaveLength(1);
    expect(result.demanded[0].typeId).toBe(365);
    expect(result.demanded[0].issuer).toBe("Канада");
    expect(result.demanded[1].typeId).toBe(2859);
    expect(result.offered[0].typeId).toBe(999);
    expect(result.title).toContain("aephi");
  });

  it("parse une structure XLS anglaise", () => {
    const rows: CellMap = {
      0: { 0: "Exchange #3: alice - bob" },
      2: { 0: "Coins and banknotes I am requesting:" },
      3: { 0: "Issuer", 1: "Reference", 2: "N#", 3: "Designation", 4: "Year" },
      4: { 0: "France", 1: "KM# 925", 2: "N# 100", 3: "1 euro", 4: 2001, 5: "", 6: "x", 7: "" },
      5: { 0: "TOTAL:", 6: 1, 7: 0 },
      7: { 0: "Coins and banknotes I am giving in exchange:" },
      8: { 0: "Issuer", 1: "Reference", 2: "N#", 3: "Designation", 4: "Year" },
      9: { 0: "Germany", 1: "KM# 210", 2: "N# 200", 3: "2 euro", 4: 2002, 5: "D", 6: "", 7: "x" },
      10: { 0: "TOTAL:", 6: 0, 7: 1 },
    };
    const result = extractSections(rows);
    expect(result.demanded).toHaveLength(1);
    expect(result.offered).toHaveLength(1);
    expect(result.demanded[0].typeId).toBe(100);
    expect(result.demanded[0].issuer).toBe("France");
    expect(result.offered[0].mintMark).toBe("D");
    expect(result.title).toContain("alice");
  });

  it("parse une structure XLS allemande", () => {
    const rows: CellMap = {
      0: { 0: "Tausch Nr. 5: hans - peter" },
      2: { 0: "Münzen und Banknoten, die ich anfrage:" },
      3: { 0: "Ausgabeland", 1: "Referenz", 2: "N#", 3: "Bezeichnung", 4: "Jahr" },
      4: { 0: "Österreich", 1: "KM# 3150", 2: "N# 500", 3: "1 Euro", 4: 2008, 5: "", 6: "x", 7: "" },
      5: { 0: "GESAMT:", 6: 1, 7: 0 },
      7: { 0: "Münzen und Banknoten, die ich zum Tausch anbiete:" },
      8: { 0: "Ausgabeland", 1: "Referenz", 2: "N#", 3: "Bezeichnung", 4: "Jahr" },
      9: { 0: "Schweiz", 1: "KM# 24", 2: "N# 600", 3: "2 Franken", 4: 1995, 5: "B", 6: "", 7: "x" },
      10: { 0: "GESAMT:", 6: 0, 7: 1 },
    };
    const result = extractSections(rows);
    expect(result.demanded).toHaveLength(1);
    expect(result.offered).toHaveLength(1);
    expect(result.demanded[0].typeId).toBe(500);
    expect(result.offered[0].issuer).toBe("Schweiz");
  });

  it("gère le flag selected correctement", () => {
    const rows: CellMap = {
      0: { 0: "Title" },
      2: { 0: "Section 1" },
      3: { 0: "Header", 4: "Year" },
      4: { 0: "A", 2: "N# 1", 3: "Coin A", 4: 2000, 6: "x", 7: "" },
      5: { 0: "B", 2: "N# 2", 3: "Coin B", 4: 2001, 6: "", 7: "" },
      6: { 0: "TOTAL", 6: 1, 7: 0 },
      8: { 0: "Section 2" },
      9: { 0: "Header", 4: "Year" },
      10: { 0: "C", 2: "N# 3", 3: "Coin C", 4: 2002, 6: "", 7: "x" },
      11: { 0: "D", 2: "N# 4", 3: "Coin D", 4: 2003, 6: "", 7: "" },
      12: { 0: "TOTAL", 6: 0, 7: 1 },
    };
    const result = extractSections(rows);
    expect(result.demanded[0].selected).toBe(true);
    expect(result.demanded[1].selected).toBe(false);
    expect(result.offered[0].selected).toBe(true);
    expect(result.offered[1].selected).toBe(false);
  });

  it("gère un échange avec une seule section", () => {
    const rows: CellMap = {
      0: { 0: "Title" },
      3: { 0: "Header", 4: "Year" },
      4: { 0: "A", 2: "N# 1", 3: "Coin", 4: 2000, 6: "x", 7: "" },
      5: { 0: "TOTAL", 6: 1, 7: 0 },
    };
    const result = extractSections(rows);
    expect(result.demanded).toHaveLength(1);
    expect(result.offered).toHaveLength(0);
  });
});
