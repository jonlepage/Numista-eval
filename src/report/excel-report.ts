import ExcelJS from "exceljs";
import path from "path";
import type { EvaluationReport, CoinWithPrices } from "../types/index.js";

const GREY = "FF9E9E9E";
const BLUE = "FF2196F3";
const GOLD = "FFFFA000";
const BLACK = "FF212121";
const WHITE = "FFFFFFFF";
const RECEIVE_BG = "FFE8F5E9";
const GIVE_BG = "FFFCE4EC";
const SUBTOTAL_BG = "FFF5F5F5";
const BORDER = "FFE0E0E0";
const LINK_COLOR = "FF1565C0";
const VERDICT_GREEN = "FF4CAF50";
const VERDICT_YELLOW = "FFFFC107";
const VERDICT_RED = "FFF44336";

// Grades par langue — l'API Numista utilise les codes EN
const GRADE_TABLES: Record<string, string[]> = {
  fr: ["AB", "B", "TB", "TTB", "SUP", "SPL", "FDC"],
  en: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  de: ["GE", "SGE", "S", "SS", "VZ", "UNZ", "St"],
  es: ["RC", "BC", "BC+", "MBC", "EBC", "SC", "FDC"],
};

// Colonnes du tableau principal
// A=#  B=Nom  C=Pays  D=Année  E=A.  F=V.Nom  G=Dev  H=V.Nom(conv)  I=Prix  J=Tirage  K=Rareté  L=Qual.
const HEADERS = ["#", "Nom", "Pays", "Année", "A.", "V.Nom.", "Dev.", "V.Nom (conv)", "Prix", "Tirage", "Rareté", "QA"];
const HEADER_COLORS = [GREY, GREY, BLUE, BLUE, BLUE, GOLD, GOLD, GOLD, BLACK, GREY, GREY, GREY];

// Tables de référence à droite
const REF_START_COL = 15; // O: Devise
const REF_RATE_COL = 16;  // P: Taux
const REF_LINK_COL = 17;  // Q: Lien Google
const GRADE_START_COL = 19; // S: Score
const GRADE_CODE_COL = 20;  // T: Code grade

function hs(color: string): Partial<ExcelJS.Style> {
  return {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: color } },
    font: { bold: true, color: { argb: WHITE }, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { bottom: { style: "thin", color: { argb: BORDER } } },
  };
}

function writeHeaders(ws: ExcelJS.Worksheet, row: number): void {
  const r = ws.getRow(row);
  HEADERS.forEach((h, i) => {
    const cell = r.getCell(i + 1);
    cell.value = h;
    Object.assign(cell, hs(HEADER_COLORS[i]));
  });
}

function writeCoinRows(
  ws: ExcelJS.Worksheet,
  coins: CoinWithPrices[],
  startRow: number,
  bg: string,
  convStart: number,
  convEnd: number,
): number {
  let row = startRow;
  const border: Partial<ExcelJS.Borders> = { bottom: { style: "hair", color: { argb: BORDER } } };

  for (const c of coins) {
    const r = ws.getRow(row);

    // A: lien Numista
    if (c.numistaUrl) {
      r.getCell(1).value = { text: `N# ${c.raw.typeId}`, hyperlink: c.numistaUrl };
      r.getCell(1).font = { size: 10, color: { argb: LINK_COLOR }, underline: true };
    } else {
      r.getCell(1).value = c.raw.typeId ?? "";
    }

    r.getCell(2).value = c.raw.title;
    r.getCell(3).value = c.raw.issuer;
    r.getCell(4).value = c.raw.year || "";
    r.getCell(5).value = c.raw.mintMark || "";
    r.getCell(6).value = c.faceValue;
    r.getCell(6).numFmt = "#,##0.00";
    r.getCell(7).value = c.currencyCode ?? "";

    // H: VLOOKUP conversion
    r.getCell(8).value = { formula: `IFERROR(F${row}*VLOOKUP(G${row},$O$${convStart}:$P$${convEnd},2,FALSE),"")` } as any;
    r.getCell(8).numFmt = "#,##0.00";

    // I: Prix VF
    r.getCell(9).value = c.priceVF;
    r.getCell(9).numFmt = "#,##0.00";

    // J: Tirage
    r.getCell(10).value = c.mintage;
    r.getCell(10).numFmt = "#,##0";

    // K: Rareté — formule
    r.getCell(11).value = {
      formula: `IF(J${row}="","",IF(J${row}>100000000,1,IF(J${row}>10000000,3,IF(J${row}>1000000,5,IF(J${row}>100000,7,9)))))`,
    } as any;

    // L: QA — dropdown 1-7, vide par défaut (l'utilisateur évalue)
    r.getCell(12).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"1,2,3,4,5,6,7"'],
    };

    // Style
    r.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      if (!cell.font?.underline) cell.font = { ...cell.font, size: 10 };
      cell.alignment = { vertical: "middle" };
      cell.border = border;
    });

    row++;
  }

  return row;
}

function writeBilan(
  ws: ExcelJS.Worksheet,
  bilanRow: number,
  recvPrixRow: number,
  givePrixRow: number,
  recvNomRow: number,
  giveNomRow: number,
  recvRarRow: number,
  giveRarRow: number,
  recvQualStart: number,
  recvQualEnd: number,
  giveQualStart: number,
  giveQualEnd: number,
  currency: string,
): void {
  const fill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTOTAL_BG } };
  const brd: Partial<ExcelJS.Borders> = { bottom: { style: "thin", color: { argb: BORDER } } };
  const bold = (size = 10): Partial<ExcelJS.Font> => ({ bold: true, size });

  let r = bilanRow;

  // Titre
  ws.getRow(r).getCell(2).value = "BILAN COMPARATIF";
  ws.getRow(r).getCell(2).font = bold(13);
  r++;

  // Bilan compact — colonnes F à J (largeur ≥12px chacune, pas de ####)
  // F=Label(12)  G=Reçu(7→merged)  H=Donné(14)  I=Diff(14)  J=Écart%(14)
  // On utilise les colonnes H à K qui font 14px chacune
  const cLabel = 2; // B: label (44px)
  const cRecv = 8;  // H: V.Nom conv (14px)
  const cGive = 9;  // I: Prix (14px)
  const cDiff = 10; // J: Tirage (14px)
  const cPct = 11;  // K: Rareté (8px → OK pour %)

  const hdrRow = ws.getRow(r);
  hdrRow.getCell(cLabel).value = "";
  hdrRow.getCell(cRecv).value = "Je reçois";
  hdrRow.getCell(cRecv).font = { bold: true, size: 10, color: { argb: VERDICT_GREEN } };
  hdrRow.getCell(cGive).value = "Je donne";
  hdrRow.getCell(cGive).font = { bold: true, size: 10, color: { argb: VERDICT_RED } };
  hdrRow.getCell(cDiff).value = "Diff.";
  hdrRow.getCell(cDiff).font = bold();
  hdrRow.getCell(cPct).value = "Écart %";
  hdrRow.getCell(cPct).font = bold();
  hdrRow.eachCell((cell) => { cell.fill = fill; cell.border = brd; cell.alignment = { horizontal: "center" }; });
  r++;

  const colR = String.fromCharCode(64 + cRecv);  // H
  const colG = String.fromCharCode(64 + cGive);  // I
  const colD = String.fromCharCode(64 + cDiff);  // J
  const colP = String.fromCharCode(64 + cPct);   // K

  const writeLine = (label: string, recvFormula: string, giveFormula: string, numFmt: string, labelFont?: Partial<ExcelJS.Font>) => {
    const row = ws.getRow(r);
    row.getCell(cLabel).value = label;
    row.getCell(cLabel).font = labelFont ?? bold();
    row.getCell(cRecv).value = { formula: recvFormula } as any;
    row.getCell(cRecv).numFmt = numFmt;
    row.getCell(cGive).value = { formula: giveFormula } as any;
    row.getCell(cGive).numFmt = numFmt;
    row.getCell(cDiff).value = { formula: `${colR}${r}-${colG}${r}` } as any;
    row.getCell(cDiff).numFmt = numFmt.includes("#") ? `+${numFmt};-${numFmt}` : "+0.0;-0.0";
    row.getCell(cPct).value = { formula: `IFERROR(IF(${colG}${r}=0,0,(${colR}${r}-${colG}${r})/${colG}${r}*100),0)` } as any;
    row.getCell(cPct).numFmt = `+0.0"%";-0.0"%"`;
    row.eachCell((cell) => { cell.fill = fill; cell.border = brd; });
    r++;
  };

  const prixRow = r;
  writeLine(`Prix (${currency})`, `I${recvPrixRow}`, `I${givePrixRow}`, "#,##0.00");
  writeLine(`Nominal conv. (${currency})`, `H${recvNomRow}`, `H${giveNomRow}`, "#,##0.00",
    { bold: true, size: 10, color: { argb: GOLD } });
  writeLine("Rareté moy. (/10)", `K${recvRarRow}`, `K${giveRarRow}`, "0.0");
  writeLine("QA moy. (/7)",
    `IFERROR(AVERAGE(L${recvQualStart}:L${recvQualEnd}),"—")`,
    `IFERROR(AVERAGE(L${giveQualStart}:L${giveQualEnd}),"—")`,
    "0.0");

  // Verdict
  r++;
  const verdictRow = ws.getRow(r);
  verdictRow.getCell(cLabel).value = "VERDICT";
  verdictRow.getCell(cLabel).font = bold(12);
  verdictRow.getCell(cRecv).value = {
    formula: `IF(ABS(${colP}${prixRow})<=10,"ÉQUITABLE",IF(ABS(${colP}${prixRow})<=25,"ACCEPTABLE","DÉSÉQUILIBRÉ"))`,
  } as any;
  verdictRow.getCell(cRecv).font = bold(14);

  // Formatage conditionnel verdict
  ws.addConditionalFormatting({
    ref: `${colR}${r}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "ÉQUITABLE", style: { font: { color: { argb: VERDICT_GREEN } } }, priority: 1 },
      { type: "containsText", operator: "containsText", text: "ACCEPTABLE", style: { font: { color: { argb: VERDICT_YELLOW } } }, priority: 2 },
      { type: "containsText", operator: "containsText", text: "DÉSÉQUILIBRÉ", style: { font: { color: { argb: VERDICT_RED } } }, priority: 3 },
    ],
  });

  // Formatage conditionnel différences (vert +, rouge -)
  for (let diffRow = prixRow; diffRow < prixRow + 4; diffRow++) {
    ws.addConditionalFormatting({
      ref: `${colD}${diffRow}`,
      rules: [
        { type: "cellIs", operator: "greaterThan", formulae: ["0"], style: { font: { color: { argb: VERDICT_GREEN } } }, priority: 10 },
        { type: "cellIs", operator: "lessThan", formulae: ["0"], style: { font: { color: { argb: VERDICT_RED } } }, priority: 11 },
      ],
    });
  }
}

function writeSectionTotals(
  ws: ExcelJS.Worksheet,
  row: number,
  label: string,
  dataStart: number,
  dataEnd: number,
): number {
  const fill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTOTAL_BG } };
  const brd: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: BORDER } },
    bottom: { style: "double", color: { argb: BLUE } },
  };

  const r = ws.getRow(row);
  r.getCell(1).value = label;
  r.getCell(1).font = { bold: true, size: 10 };

  // H: Nominal converti
  r.getCell(8).value = { formula: `SUM(H${dataStart}:H${dataEnd})` } as any;
  r.getCell(8).numFmt = "#,##0.00";
  r.getCell(8).font = { bold: true, size: 10 };

  // I: Prix
  r.getCell(9).value = { formula: `SUM(I${dataStart}:I${dataEnd})` } as any;
  r.getCell(9).numFmt = "#,##0.00";
  r.getCell(9).font = { bold: true, size: 11 };

  // K: Rareté moyenne
  r.getCell(11).value = { formula: `IFERROR(AVERAGE(K${dataStart}:K${dataEnd}),"")` } as any;
  r.getCell(11).numFmt = "0.0";

  // L: Qualité moyenne
  r.getCell(12).value = { formula: `IFERROR(AVERAGE(L${dataStart}:L${dataEnd}),"")` } as any;
  r.getCell(12).numFmt = "0.0";

  r.eachCell((cell) => { cell.fill = fill; cell.border = brd; });

  return row + 1;
}

async function fetchExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    const base = baseCurrency.toLowerCase();
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`);
    if (!res.ok) return {};
    const data = await res.json() as Record<string, any>;
    return data[base] ?? {};
  } catch {
    return {};
  }
}

export async function generateExcelReport(
  report: EvaluationReport,
  outputDir: string,
  lang = "fr",
): Promise<string> {
  const { currency } = report;
  const grades = GRADE_TABLES[lang] ?? GRADE_TABLES.fr;

  const wb = new ExcelJS.Workbook();
  wb.creator = "numista-eval";
  wb.created = new Date();

  const ws = wb.addWorksheet("Évaluation", { views: [{ state: "frozen", ySplit: 4 }] });

  ws.columns = [
    { width: 12 }, { width: 44 }, { width: 16 }, { width: 7 }, { width: 5 },
    { width: 12 }, { width: 7 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 8 }, { width: 6 },
    { width: 2 }, { width: 2 },
    { width: 10 }, { width: 14 }, { width: 20 },
    { width: 2 },
    { width: 8 }, { width: 8 },
  ];

  // Titre
  ws.mergeCells("A1:F1");
  ws.getRow(1).getCell(1).value = report.title;
  ws.getRow(1).getCell(1).font = { bold: true, size: 14 };

  ws.mergeCells("A2:F2");
  ws.getRow(2).getCell(1).value = `${new Date(report.timestamp).toLocaleString("fr-CA")} — ${currency}`;
  ws.getRow(2).getCell(1).font = { size: 9, italic: true, color: { argb: "FF757575" } };

  // === Table de conversion devises (O-P-Q) ===
  const allCoins = [...report.demanded.coins, ...report.offered.coins];
  const uniqueCurrencies = [...new Set(allCoins.map((c) => c.currencyCode).filter(Boolean))] as string[];
  if (!uniqueCurrencies.includes(currency)) uniqueCurrencies.unshift(currency);

  ws.getRow(3).getCell(REF_START_COL).value = "Devise";
  ws.getRow(3).getCell(REF_RATE_COL).value = `1 → ${currency}`;
  ws.getRow(3).getCell(REF_LINK_COL).value = "Vérifier";
  Object.assign(ws.getRow(3).getCell(REF_START_COL), hs(GOLD));
  Object.assign(ws.getRow(3).getCell(REF_RATE_COL), hs(GOLD));
  Object.assign(ws.getRow(3).getCell(REF_LINK_COL), hs(GOLD));

  const rates = await fetchExchangeRates(currency.toLowerCase());
  const convStart = 4;

  for (let i = 0; i < uniqueCurrencies.length; i++) {
    const code = uniqueCurrencies[i];
    const r = ws.getRow(convStart + i);
    r.getCell(REF_START_COL).value = code;
    r.getCell(REF_START_COL).font = { bold: true, size: 10 };

    const rate = code === currency ? 1 : (rates[code.toLowerCase()] ? 1 / rates[code.toLowerCase()] : null);
    r.getCell(REF_RATE_COL).value = rate;
    r.getCell(REF_RATE_COL).numFmt = "#,##0.0000";

    const url = `https://www.google.com/search?q=1+${code}+to+${currency}`;
    r.getCell(REF_LINK_COL).value = { text: `1 ${code} → ${currency}`, hyperlink: url };
    r.getCell(REF_LINK_COL).font = { size: 9, color: { argb: LINK_COLOR }, underline: true };
  }

  const convEnd = convStart + uniqueCurrencies.length - 1;

  // === Table de qualité (S-T) ===
  ws.getRow(3).getCell(GRADE_START_COL).value = "Score";
  ws.getRow(3).getCell(GRADE_CODE_COL).value = "Grade";
  Object.assign(ws.getRow(3).getCell(GRADE_START_COL), hs(GREY));
  Object.assign(ws.getRow(3).getCell(GRADE_CODE_COL), hs(GREY));

  const gradeStart = 4;
  for (let i = 0; i < grades.length; i++) {
    const r = ws.getRow(gradeStart + i);
    r.getCell(GRADE_START_COL).value = i + 1;
    r.getCell(GRADE_START_COL).font = { bold: true, size: 10 };
    r.getCell(GRADE_CODE_COL).value = grades[i];
    r.getCell(GRADE_CODE_COL).font = { size: 10 };
  }
  const gradeEnd = gradeStart + grades.length - 1;

  // === Données ===
  writeHeaders(ws, 4);

  let currentRow = 5;
  const receiveStart = currentRow;
  currentRow = writeCoinRows(ws, report.demanded.coins, currentRow, RECEIVE_BG, convStart, convEnd);
  const receiveEnd = currentRow - 1;
  const recvTotalRow = currentRow;
  currentRow = writeSectionTotals(ws, currentRow, "TOTAL REÇU", receiveStart, receiveEnd);
  currentRow++;

  writeHeaders(ws, currentRow);
  currentRow++;

  const giveStart = currentRow;
  currentRow = writeCoinRows(ws, report.offered.coins, currentRow, GIVE_BG, convStart, convEnd);
  const giveEnd = currentRow - 1;
  const giveTotalRow = currentRow;
  currentRow = writeSectionTotals(ws, currentRow, "TOTAL DONNÉ", giveStart, giveEnd);
  currentRow += 2;

  // === Bilan comparatif ===
  writeBilan(
    ws, currentRow,
    recvTotalRow, giveTotalRow,     // prix
    recvTotalRow, giveTotalRow,     // nominal (même ligne, col H)
    recvTotalRow, giveTotalRow,     // rareté (même ligne, col K)
    receiveStart, receiveEnd,       // qualité reçue
    giveStart, giveEnd,             // qualité donnée
    currency,
  );

  // Sauvegarder
  const datestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const safeName = report.title.replace(/[^a-zA-Z0-9àâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s-]/g, "").trim().replace(/\s+/g, "_");
  const filename = `${safeName}_${datestamp}.xlsx`;
  const outputPath = path.join(outputDir, filename);

  await wb.xlsx.writeFile(outputPath);
  return outputPath;
}
