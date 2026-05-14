import ExcelJS from "exceljs";
import path from "path";
import type { EvaluationReport, CoinWithPrices, Grade } from "../types/index.js";
import { t, type ExcelStrings } from "../i18n.js";

// ── Grade mapping ──────────────────────────────────────────────────────

const GRADE_TO_QUALITY_SCORE: Record<Grade, number> = {
  g: 1, vg: 2, f: 3, vf: 4, xf: 5, au: 6, unc: 7,
};

// ── Palette ────────────────────────────────────────────────────────────

const COLORS = {
  grey: "FF9E9E9E",
  blue: "FF2196F3",
  gold: "FFFFA000",
  black: "FF212121",
  white: "FFFFFFFF",
  receivedBackground: "FFE8F5E9",
  givenBackground: "FFFCE4EC",
  subtotalBackground: "FFF5F5F5",
  border: "FFE0E0E0",
  link: "FF1565C0",
  verdictFair: "FF4CAF50",
  verdictAcceptable: "FFFFC107",
  verdictUnbalanced: "FFF44336",
  subtitle: "FF757575",
} as const;

// ── Column layout ──────────────────────────────────────────────────────
// When reordering columns, also update Excel formula strings in
// writeCoinRows, writeSectionTotals and writeBilan.

const COL = {
  numistaId: 1,       // A
  name: 2,            // B
  country: 3,         // C
  year: 4,            // D
  mintMark: 5,        // E
  faceValue: 6,       // F
  currencyCode: 7,    // G
  convertedValue: 8,  // H
  price: 9,           // I
  mintage: 10,        // J
  rarity: 11,         // K
  quality: 12,        // L
  reference: 13,      // M
  included: 14,       // N
} as const;

const CONVERSION_TABLE = {
  currency: 15,  // O
  rate: 16,      // P
  link: 17,      // Q
} as const;

const GRADE_TABLE = {
  score: 19,  // S
  label: 20,  // T
} as const;

const BILAN = {
  label: 2,       // B
  received: 8,    // H
  given: 9,       // I
  difference: 10, // J
  percent: 11,    // K
} as const;

// ── Column widths (A → T) ─────────────────────────────────────────────

const COLUMN_WIDTHS = [
  12, 44, 16, 7, 5,             // A-E
  12, 7, 14, 14, 14, 10, 6,     // F-L
  18, 6,                          // M (ref), N (Inc.)
  10, 14, 20,                    // O-Q (conversion table)
  2,                             // R (spacer)
  8, 8,                          // S-T (grade table)
];

// ── Header builder ─────────────────────────────────────────────────────

function buildHeaders(dict: ExcelStrings): { label: string; color: string }[] {
  return [
    { label: "#",                        color: COLORS.grey },
    { label: dict.headers.name,          color: COLORS.grey },
    { label: dict.headers.country,       color: COLORS.blue },
    { label: dict.headers.year,          color: COLORS.blue },
    { label: dict.headers.mintMark,      color: COLORS.blue },
    { label: dict.headers.faceValue,     color: COLORS.gold },
    { label: dict.headers.currency,      color: COLORS.gold },
    { label: dict.headers.convertedValue, color: COLORS.gold },
    { label: dict.headers.price,         color: COLORS.black },
    { label: dict.headers.mintage,       color: COLORS.grey },
    { label: dict.headers.rarity,        color: COLORS.grey },
    { label: "QA ",                      color: COLORS.grey },
    { label: "##",                       color: COLORS.grey },
    { label: "✔",                       color: COLORS.grey },
  ];
}

// ── Style helpers ──────────────────────────────────────────────────────

function headerStyle(backgroundColor: string): Partial<ExcelJS.Style> {
  return {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: backgroundColor } },
    font: { bold: true, color: { argb: COLORS.white }, size: 10 },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { bottom: { style: "thin", color: { argb: COLORS.border } } },
  };
}

function formula(expression: string): any {
  return { formula: expression };
}

function solidFill(color: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}

function boldFont(size = 10): Partial<ExcelJS.Font> {
  return { bold: true, size };
}

function columnLetter(colNumber: number): string {
  return String.fromCharCode(64 + colNumber);
}

// ── Section layout (for bilan references) ──────────────────────────────

interface SectionLayout {
  totalRow: number;
  dataStartRow: number;
  dataEndRow: number;
}

// ── Reference tables ───────────────────────────────────────────────────

async function writeConversionTable(
  worksheet: ExcelJS.Worksheet,
  coins: CoinWithPrices[],
  currency: string,
  dict: ExcelStrings,
): Promise<{ startRow: number; endRow: number }> {
  const uniqueCurrencies = [...new Set(coins.map(coin => coin.currencyCode).filter(Boolean))] as string[];
  if (!uniqueCurrencies.includes(currency)) uniqueCurrencies.unshift(currency);

  const conversionHeaderRow = worksheet.getRow(3);
  conversionHeaderRow.getCell(CONVERSION_TABLE.currency).value = dict.referenceTable.currency;
  conversionHeaderRow.getCell(CONVERSION_TABLE.rate).value = `1 → ${currency}`;
  conversionHeaderRow.getCell(CONVERSION_TABLE.link).value = dict.referenceTable.verify;
  for (const col of [CONVERSION_TABLE.currency, CONVERSION_TABLE.rate, CONVERSION_TABLE.link]) {
    Object.assign(conversionHeaderRow.getCell(col), headerStyle(COLORS.gold));
  }

  const exchangeRates = await fetchExchangeRates(currency.toLowerCase());
  const startRow = 4;

  for (let i = 0; i < uniqueCurrencies.length; i++) {
    const code = uniqueCurrencies[i];
    const excelRow = worksheet.getRow(startRow + i);

    excelRow.getCell(CONVERSION_TABLE.currency).value = code;
    excelRow.getCell(CONVERSION_TABLE.currency).font = boldFont();

    const rate = code === currency ? 1
      : exchangeRates[code.toLowerCase()] ? 1 / exchangeRates[code.toLowerCase()]
      : null;
    excelRow.getCell(CONVERSION_TABLE.rate).value = rate;
    excelRow.getCell(CONVERSION_TABLE.rate).numFmt = "#,##0.0000";

    const verifyUrl = `https://www.google.com/search?q=1+${code}+to+${currency}`;
    excelRow.getCell(CONVERSION_TABLE.link).value = { text: `1 ${code} → ${currency}`, hyperlink: verifyUrl };
    excelRow.getCell(CONVERSION_TABLE.link).font = { size: 9, color: { argb: COLORS.link }, underline: true };
  }

  return { startRow, endRow: startRow + uniqueCurrencies.length - 1 };
}

function writeGradeReferenceTable(worksheet: ExcelJS.Worksheet, dict: ExcelStrings): void {
  const gradeHeaderRow = worksheet.getRow(3);
  gradeHeaderRow.getCell(GRADE_TABLE.score).value = dict.referenceTable.score;
  gradeHeaderRow.getCell(GRADE_TABLE.label).value = dict.referenceTable.grade;
  Object.assign(gradeHeaderRow.getCell(GRADE_TABLE.score), headerStyle(COLORS.grey));
  Object.assign(gradeHeaderRow.getCell(GRADE_TABLE.label), headerStyle(COLORS.grey));

  const startRow = 4;
  for (let i = 0; i < dict.gradeLabels.length; i++) {
    const excelRow = worksheet.getRow(startRow + i);
    excelRow.getCell(GRADE_TABLE.score).value = i + 1;
    excelRow.getCell(GRADE_TABLE.score).font = boldFont();
    excelRow.getCell(GRADE_TABLE.label).value = dict.gradeLabels[i];
    excelRow.getCell(GRADE_TABLE.label).font = { size: 10 };
  }
}

// ── Data writers ───────────────────────────────────────────────────────

function writeHeaders(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  headers: { label: string; color: string }[],
): void {
  const excelRow = worksheet.getRow(rowNumber);
  headers.forEach((header, index) => {
    const cell = excelRow.getCell(index + 1);
    cell.value = header.label;
    Object.assign(cell, headerStyle(header.color));
  });
}

function writeCoinRows(
  worksheet: ExcelJS.Worksheet,
  coins: CoinWithPrices[],
  startRow: number,
  backgroundColor: string,
  conversionStartRow: number,
  conversionEndRow: number,
): number {
  let currentRow = startRow;
  const borderStyle: Partial<ExcelJS.Borders> = {
    bottom: { style: "hair", color: { argb: COLORS.border } },
  };

  for (const coin of coins) {
    const excelRow = worksheet.getRow(currentRow);

    if (coin.numistaUrl) {
      excelRow.getCell(COL.numistaId).value = { text: `N# ${coin.raw.typeId}`, hyperlink: coin.numistaUrl };
      excelRow.getCell(COL.numistaId).font = { size: 10, color: { argb: COLORS.link }, underline: true };
    } else {
      excelRow.getCell(COL.numistaId).value = coin.raw.typeId ?? "";
    }

    excelRow.getCell(COL.name).value = coin.raw.title;
    excelRow.getCell(COL.country).value = coin.raw.issuer;
    excelRow.getCell(COL.year).value = coin.raw.year || "";
    excelRow.getCell(COL.mintMark).value = coin.raw.mintMark || "";

    excelRow.getCell(COL.faceValue).value = coin.faceValue;
    excelRow.getCell(COL.faceValue).numFmt = "#,##0.00";
    excelRow.getCell(COL.currencyCode).value = coin.currencyCode ?? "";

    excelRow.getCell(COL.convertedValue).value = formula(
      `IFERROR(F${currentRow}*VLOOKUP(G${currentRow},$O$${conversionStartRow}:$P$${conversionEndRow},2,FALSE),"")`
    );
    excelRow.getCell(COL.convertedValue).numFmt = "#,##0.00";

    const pricesByGrade = coin.allPrices.map(p => p.toFixed(3)).join(",");
    excelRow.getCell(COL.price).value = formula(
      `IFERROR(IF(L${currentRow}="",0,CHOOSE(L${currentRow},${pricesByGrade})),0)`
    );
    excelRow.getCell(COL.price).numFmt = "#,##0.00";

    excelRow.getCell(COL.mintage).value = coin.mintage;
    excelRow.getCell(COL.mintage).numFmt = "#,##0";

    excelRow.getCell(COL.rarity).value = formula(
      `IF(J${currentRow}="","",IF(J${currentRow}>100000000,1,IF(J${currentRow}>10000000,3,IF(J${currentRow}>1000000,5,IF(J${currentRow}>100000,7,9)))))`
    );

    excelRow.getCell(COL.quality).value = coin.priceGrade ? GRADE_TO_QUALITY_SCORE[coin.priceGrade] : null;
    excelRow.getCell(COL.quality).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"1,2,3,4,5,6,7"'],
    };

    excelRow.getCell(COL.reference).value = coin.raw.refKM || "";

    excelRow.getCell(COL.included).value = coin.raw.selected ? "✓" : "✗";
    excelRow.getCell(COL.included).alignment = { horizontal: "center", vertical: "middle" };
    excelRow.getCell(COL.included).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"✓,✗"'],
    };

    excelRow.eachCell((cell) => {
      cell.fill = solidFill(backgroundColor);
      if (!cell.font?.underline) cell.font = { ...cell.font, size: 10 };
      cell.alignment = { vertical: "middle" };
      cell.border = borderStyle;
    });

    currentRow++;
  }

  return currentRow;
}

function writeSectionTotals(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  label: string,
  dataStartRow: number,
  dataEndRow: number,
): number {
  const excelRow = worksheet.getRow(rowNumber);
  excelRow.getCell(COL.numistaId).value = label;
  excelRow.getCell(COL.numistaId).font = boldFont();

  excelRow.getCell(COL.convertedValue).value = formula(`SUMIF(N${dataStartRow}:N${dataEndRow},"✓",H${dataStartRow}:H${dataEndRow})`);
  excelRow.getCell(COL.convertedValue).numFmt = "#,##0.00";
  excelRow.getCell(COL.convertedValue).font = boldFont();

  excelRow.getCell(COL.price).value = formula(`SUMIF(N${dataStartRow}:N${dataEndRow},"✓",I${dataStartRow}:I${dataEndRow})`);
  excelRow.getCell(COL.price).numFmt = "#,##0.00";
  excelRow.getCell(COL.price).font = boldFont(11);

  excelRow.getCell(COL.rarity).value = formula(`IFERROR(AVERAGEIF(N${dataStartRow}:N${dataEndRow},"✓",K${dataStartRow}:K${dataEndRow}),"")`);
  excelRow.getCell(COL.rarity).numFmt = "0.0";

  excelRow.getCell(COL.quality).value = formula(`IFERROR(AVERAGEIF(N${dataStartRow}:N${dataEndRow},"✓",L${dataStartRow}:L${dataEndRow}),"")`);
  excelRow.getCell(COL.quality).numFmt = "0.0";

  const totalBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "double", color: { argb: COLORS.blue } },
  };
  excelRow.eachCell((cell) => {
    cell.fill = solidFill(COLORS.subtotalBackground);
    cell.border = totalBorder;
  });

  return rowNumber + 1;
}

// ── Bilan & verdict ────────────────────────────────────────────────────

function writeVerdict(
  worksheet: ExcelJS.Worksheet,
  verdictRowNumber: number,
  priceRowNumber: number,
  dict: ExcelStrings,
): void {
  const colReceived = columnLetter(BILAN.received);
  const colDiff = columnLetter(BILAN.difference);
  const colPct = columnLetter(BILAN.percent);

  const verdictRow = worksheet.getRow(verdictRowNumber);
  verdictRow.getCell(BILAN.label).value = dict.verdict.label;
  verdictRow.getCell(BILAN.label).font = boldFont(12);
  verdictRow.getCell(BILAN.received).value = formula(
    `IF(ABS(${colPct}${priceRowNumber})<=10,"${dict.verdict.fair}",IF(ABS(${colPct}${priceRowNumber})<=25,"${dict.verdict.acceptable}","${dict.verdict.unbalanced}"))`
  );
  verdictRow.getCell(BILAN.received).font = boldFont(14);

  worksheet.addConditionalFormatting({
    ref: `${colReceived}${verdictRowNumber}`,
    rules: [
      { type: "containsText", operator: "containsText", text: dict.verdict.fair, style: { font: { color: { argb: COLORS.verdictFair } } }, priority: 1 },
      { type: "containsText", operator: "containsText", text: dict.verdict.acceptable, style: { font: { color: { argb: COLORS.verdictAcceptable } } }, priority: 2 },
      { type: "containsText", operator: "containsText", text: dict.verdict.unbalanced, style: { font: { color: { argb: COLORS.verdictUnbalanced } } }, priority: 3 },
    ],
  });

  for (let diffRow = priceRowNumber; diffRow < priceRowNumber + 4; diffRow++) {
    worksheet.addConditionalFormatting({
      ref: `${colDiff}${diffRow}`,
      rules: [
        { type: "cellIs", operator: "greaterThan", formulae: ["0"], style: { font: { color: { argb: COLORS.verdictFair } } }, priority: 10 },
        { type: "cellIs", operator: "lessThan", formulae: ["0"], style: { font: { color: { argb: COLORS.verdictUnbalanced } } }, priority: 11 },
      ],
    });
    worksheet.addConditionalFormatting({
      ref: `${colPct}${diffRow}`,
      rules: [
        { type: "cellIs", operator: "greaterThan", formulae: ["0"], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.receivedBackground } } }, priority: 12 },
        { type: "cellIs", operator: "lessThan", formulae: ["0"], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COLORS.givenBackground } } }, priority: 13 },
      ],
    });
  }
}

function writeBilan(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  received: SectionLayout,
  given: SectionLayout,
  currency: string,
  dict: ExcelStrings,
): void {
  const bilanFill = solidFill(COLORS.subtotalBackground);
  const bilanBorder: Partial<ExcelJS.Borders> = { bottom: { style: "thin", color: { argb: COLORS.border } } };
  let currentRow = startRow;

  worksheet.getRow(currentRow).getCell(BILAN.label).value = dict.bilan.title;
  worksheet.getRow(currentRow).getCell(BILAN.label).font = boldFont(13);
  currentRow++;

  const bilanHeaderRow = worksheet.getRow(currentRow);
  bilanHeaderRow.getCell(BILAN.label).value = "";
  bilanHeaderRow.getCell(BILAN.received).value = dict.bilan.iReceive;
  bilanHeaderRow.getCell(BILAN.received).font = { bold: true, size: 10, color: { argb: COLORS.verdictFair } };
  bilanHeaderRow.getCell(BILAN.given).value = dict.bilan.iGive;
  bilanHeaderRow.getCell(BILAN.given).font = { bold: true, size: 10, color: { argb: COLORS.verdictUnbalanced } };
  bilanHeaderRow.getCell(BILAN.difference).value = dict.bilan.difference;
  bilanHeaderRow.getCell(BILAN.difference).font = boldFont();
  bilanHeaderRow.getCell(BILAN.percent).value = dict.bilan.gap;
  bilanHeaderRow.getCell(BILAN.percent).font = boldFont();
  bilanHeaderRow.eachCell((cell) => {
    cell.fill = bilanFill;
    cell.border = bilanBorder;
    cell.alignment = { horizontal: "center" };
  });
  currentRow++;

  const colReceived = columnLetter(BILAN.received);
  const colGiven = columnLetter(BILAN.given);

  const writeLine = (
    label: string,
    receivedFormula: string,
    givenFormula: string,
    numFmt: string,
    labelFont?: Partial<ExcelJS.Font>,
  ) => {
    const excelRow = worksheet.getRow(currentRow);
    excelRow.getCell(BILAN.label).value = label;
    excelRow.getCell(BILAN.label).font = labelFont ?? boldFont();
    excelRow.getCell(BILAN.received).value = formula(receivedFormula);
    excelRow.getCell(BILAN.received).numFmt = numFmt;
    excelRow.getCell(BILAN.given).value = formula(givenFormula);
    excelRow.getCell(BILAN.given).numFmt = numFmt;
    excelRow.getCell(BILAN.difference).value = formula(`${colReceived}${currentRow}-${colGiven}${currentRow}`);
    excelRow.getCell(BILAN.difference).numFmt = numFmt.includes("#") ? `+${numFmt}" ${currency}";-${numFmt}" ${currency}"` : "+0.0;-0.0";
    excelRow.getCell(BILAN.percent).value = formula(
      `IFERROR(IF(${colGiven}${currentRow}=0,0,(${colReceived}${currentRow}-${colGiven}${currentRow})/${colGiven}${currentRow}*100),0)`
    );
    excelRow.getCell(BILAN.percent).numFmt = `+0.0"%";-0.0"%"`;
    excelRow.eachCell((cell, colNumber) => {
      if (colNumber !== BILAN.percent) cell.fill = bilanFill;
      cell.border = bilanBorder;
    });
    currentRow++;
  };

  const priceRow = currentRow;
  writeLine(`${dict.bilan.price} (${currency})`, `I${received.totalRow}`, `I${given.totalRow}`, "#,##0.00");
  writeLine(
    `${dict.bilan.nominalConverted} (${currency})`, `H${received.totalRow}`, `H${given.totalRow}`, "#,##0.00",
    { bold: true, size: 10, color: { argb: COLORS.gold } },
  );
  writeLine(`${dict.bilan.avgRarity} (/10)`, `K${received.totalRow}`, `K${given.totalRow}`, "0.0");
  writeLine(
    `${dict.bilan.avgQuality} (/7)`,
    `IFERROR(AVERAGEIF(N${received.dataStartRow}:N${received.dataEndRow},"✓",L${received.dataStartRow}:L${received.dataEndRow}),"—")`,
    `IFERROR(AVERAGEIF(N${given.dataStartRow}:N${given.dataEndRow},"✓",L${given.dataStartRow}:L${given.dataEndRow}),"—")`,
    "0.0",
  );

  currentRow++;
  writeVerdict(worksheet, currentRow, priceRow, dict);
}

// ── Currency rates ─────────────────────────────────────────────────────

async function fetchExchangeRates(targetCurrency: string): Promise<Record<string, number>> {
  try {
    const base = targetCurrency.toLowerCase();
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`);
    if (!res.ok) return {};
    const data = await res.json() as Record<string, any>;
    return data[base] ?? {};
  } catch {
    return {};
  }
}

// ── Title parser ───────────────────────────────────────────────────────

interface ParsedTitle {
  exchangeNumber: string;
  name1: string;
  name2: string;
}

function parseExchangeTitle(rawTitle: string): ParsedTitle | null {
  const match = rawTitle.match(/[ÉEe]change\s+n°?\s*(\d+)\s*:\s*(.+?)\s*-\s*(.+)/i);
  if (!match) return null;
  return { exchangeNumber: match[1], name1: match[2].trim(), name2: match[3].trim() };
}

function buildTitle(parsed: ParsedTitle, dict: ExcelStrings): string {
  return dict.exchangeTitle
    .replace("{n}", parsed.exchangeNumber)
    .replace("{name1}", parsed.name1)
    .replace("{name2}", parsed.name2);
}

function buildFilename(parsed: ParsedTitle | null, datestamp: string): string {
  if (!parsed) return `numista-eval_${datestamp}`;
  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9àâéèêëïîôùûüçñáíóúãõäöüßÀÂÉÈÊËÏÎÔÙÛÜÇÑÁÍÓÚÃÕÄÖÜ-]/g, "").replace(/\s+/g, "-");
  return `${sanitize(parsed.name1)}_${sanitize(parsed.name2)}_${parsed.exchangeNumber}_${datestamp}`;
}

// ── Main export ────────────────────────────────────────────────────────

export async function generateExcelReport(
  report: EvaluationReport,
  outputDir: string,
  lang = "fr",
): Promise<string> {
  const { currency } = report;
  const dict = t(lang);
  const headers = buildHeaders(dict);
  const parsed = parseExchangeTitle(report.title);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "numista-eval";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(dict.sheetName, { views: [{ state: "frozen", ySplit: 4 }] });
  worksheet.columns = COLUMN_WIDTHS.map(width => ({ width }));

  // Title
  worksheet.mergeCells("A1:F1");
  worksheet.getRow(1).getCell(1).value = parsed ? buildTitle(parsed, dict) : report.title;
  worksheet.getRow(1).getCell(1).font = boldFont(14);

  worksheet.mergeCells("A2:F2");
  worksheet.getRow(2).getCell(1).value = `${new Date(report.timestamp).toLocaleString()} — ${currency}`;
  worksheet.getRow(2).getCell(1).font = { size: 9, italic: true, color: { argb: COLORS.subtitle } };

  // Reference tables (right side)
  const allCoins = [...report.demanded.coins, ...report.offered.coins];
  const conversionRange = await writeConversionTable(worksheet, allCoins, currency, dict);
  writeGradeReferenceTable(worksheet, dict);

  // Received section
  writeHeaders(worksheet, 4, headers);
  let currentRow = 5;

  const receivedStartRow = currentRow;
  currentRow = writeCoinRows(worksheet, report.demanded.coins, currentRow, COLORS.receivedBackground, conversionRange.startRow, conversionRange.endRow);
  const receivedEndRow = currentRow - 1;
  const receivedTotalRow = currentRow;
  currentRow = writeSectionTotals(worksheet, currentRow, dict.sections.totalReceived, receivedStartRow, receivedEndRow);
  currentRow++;

  // Given section
  writeHeaders(worksheet, currentRow, headers);
  currentRow++;

  const givenStartRow = currentRow;
  currentRow = writeCoinRows(worksheet, report.offered.coins, currentRow, COLORS.givenBackground, conversionRange.startRow, conversionRange.endRow);
  const givenEndRow = currentRow - 1;
  const givenTotalRow = currentRow;
  currentRow = writeSectionTotals(worksheet, currentRow, dict.sections.totalGiven, givenStartRow, givenEndRow);
  currentRow += 2;

  // Bilan
  writeBilan(
    worksheet,
    currentRow,
    { totalRow: receivedTotalRow, dataStartRow: receivedStartRow, dataEndRow: receivedEndRow },
    { totalRow: givenTotalRow, dataStartRow: givenStartRow, dataEndRow: givenEndRow },
    currency,
    dict,
  );

  // Save
  const datestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const outputPath = path.join(outputDir, `${buildFilename(parsed, datestamp)}.xlsx`);

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
