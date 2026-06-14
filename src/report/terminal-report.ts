import chalk from "chalk";
import Table from "cli-table3";
import type { EvaluationReport, CoinWithPrices, Verdict } from "../types/index.js";
import { t } from "../i18n.js";
import { VERDICT_THRESHOLDS } from "../fairness.js";

function coinRow(c: CoinWithPrices, currency: string): string[] {
  const typeId = c.raw.typeId ? `N# ${c.raw.typeId}` : "?";
  let price: string;
  if (c.price != null) {
    const gradeTag = c.priceGrade ? ` (${c.priceGrade.toUpperCase()})` : "";
    const doubtful = c.confidence === "low" || c.confidence === "none" || c.ambiguous || c.qualityGuess === "proof";
    const warn = doubtful ? chalk.yellow(" ⚠") : "";
    price = `${c.price.toFixed(2)} ${currency}${gradeTag}${warn}`;
  } else {
    price = chalk.yellow("—");
  }
  const mintage = c.mintage != null ? c.mintage.toLocaleString() : "";
  const rarity = c.rarityScore != null ? `${c.rarityScore}/9` : "";

  return [typeId, c.raw.title.substring(0, 38), c.raw.issuer.substring(0, 14), String(c.raw.year || ""), price, mintage, rarity];
}

function makeTable(coins: CoinWithPrices[], currency: string, lang: string): string {
  const dict = t(lang);
  const table = new Table({
    head: ["N#", dict.headers.name, dict.headers.country, dict.headers.year, `${dict.headers.price} (${currency})`, dict.headers.mintage, dict.headers.rarity],
    colWidths: [10, 40, 16, 6, 14, 14, 8],
    style: { head: ["cyan"] },
  });

  for (const c of coins) {
    table.push(coinRow(c, currency));
  }

  return table.toString();
}

export function printReport(report: EvaluationReport, lang = "fr"): void {
  const { demanded, offered, balance, balancePercent, verdict, currency } = report;
  const dict = t(lang);
  const date = new Date(report.timestamp).toLocaleString();

  console.log("");
  console.log(chalk.bold.white("═════════════════════════════════════════════════════════════════════════"));
  console.log(chalk.bold.cyan(`  ${report.title}`));
  console.log(chalk.gray(`  ${date} — ${dict.terminal.currency} : ${currency}`));
  console.log(chalk.bold.white("═════════════════════════════════════════════════════════════════════════"));

  console.log("");
  console.log(chalk.bold.green(`  ▼ ${dict.terminal.iReceive} (${demanded.coins.length})`));
  console.log(makeTable(demanded.coins, currency, lang));

  for (const c of demanded.coins) {
    if (c.numistaUrl) console.log(chalk.gray(`    ${c.raw.typeId} → `) + chalk.blue.underline(c.numistaUrl));
  }

  console.log("");
  console.log(chalk.bold.red(`  ▲ ${dict.terminal.iGive} (${offered.coins.length})`));
  console.log(makeTable(offered.coins, currency, lang));

  for (const c of offered.coins) {
    if (c.numistaUrl) console.log(chalk.gray(`    ${c.raw.typeId} → `) + chalk.blue.underline(c.numistaUrl));
  }

  console.log("");
  console.log(chalk.bold.white(`─── ${dict.terminal.bilanTitle} ${"─".repeat(Math.max(0, 67 - dict.terminal.bilanTitle.length))}──`));
  console.log("");

  console.log(`  ${chalk.bold(dict.terminal.merchantPrice)}`);
  console.log(`    ${chalk.green(dict.terminal.received)} ${chalk.bold(demanded.totalPrice.toFixed(2))} ${currency}`);
  console.log(`    ${chalk.red(dict.terminal.given)} ${chalk.bold(offered.totalPrice.toFixed(2))} ${currency}`);

  const balanceStr = balance >= 0
    ? chalk.green.bold(`+${balance.toFixed(2)} ${currency} (+${balancePercent.toFixed(1)}%)`)
    : chalk.red.bold(`${balance.toFixed(2)} ${currency} (${balancePercent.toFixed(1)}%)`);
  console.log(`    ${dict.terminal.balance} : ${balanceStr}`);

  const gapLine = (received: number, given: number, label: string, fmt: (v: number) => string, invert = false) => {
    // invert (tirage) : on affiche l'écart du point de vue de la faveur — recevoir plus
    // de tirage (pièces plus communes) est défavorable, donc négatif/rouge.
    const raw = given > 0 ? ((received - given) / given) * 100 : 0;
    const pct = invert ? -raw : raw;
    const pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    console.log("");
    console.log(`  ${chalk.bold(label)} (${dict.bilan.gap})`);
    console.log(`    ${chalk.green(dict.terminal.received)} ${fmt(received)}`);
    console.log(`    ${chalk.red(dict.terminal.given)} ${fmt(given)}`);
    console.log(`    ${dict.bilan.gap} : ${pct >= 0 ? chalk.green(pctStr) : chalk.red(pctStr)}`);
  };

  if (demanded.totalConvertedNominal > 0 || offered.totalConvertedNominal > 0) {
    gapLine(demanded.totalConvertedNominal, offered.totalConvertedNominal,
      dict.bilan.nominalConverted, (v) => `${v.toFixed(2)} ${currency}`);
  }
  if (demanded.totalMintage > 0 || offered.totalMintage > 0) {
    gapLine(demanded.totalMintage, offered.totalMintage,
      dict.headers.mintage, (v) => v.toLocaleString(), true);
  }

  console.log("");
  if (report.fairnessScore != null) {
    const s = report.fairnessScore;
    const sStr = `${s >= 0 ? "+" : ""}${s.toFixed(1)}%`;
    const colored = Math.abs(s) <= VERDICT_THRESHOLDS.fair ? chalk.green(sStr)
      : Math.abs(s) <= VERDICT_THRESHOLDS.acceptable ? chalk.yellow(sStr)
      : chalk.red(sStr);
    console.log(`  ${chalk.bold(dict.flags.weightedScore)} : ${colored}`);
  }
  const verdictColors: Record<Verdict, string> = {
    equitable: chalk.bgGreen.black.bold(` ${dict.verdict.fair} `),
    acceptable: chalk.bgYellow.black.bold(` ${dict.verdict.acceptable} `),
    desequilibre: chalk.bgRed.white.bold(` ${dict.verdict.unbalanced} `),
    indetermine: chalk.bgGray.white.bold(` ${dict.verdict.indeterminate} `),
  };

  console.log(`  ${verdictColors[verdict]}`);
  console.log("");

  if (report.incomplete) {
    console.log(chalk.yellow(`  ⚠ ${dict.flags.incomplete}`));
  }
  const totalNP = demanded.noPriceCount + offered.noPriceCount;
  if (totalNP > 0) {
    console.log(chalk.yellow(`  ${dict.terminal.noPrice.replace("{n}", String(totalNP))}`));
  }
  console.log(chalk.gray(`  ${dict.terminal.apiCalls.replace("{n}", String(report.apiCallsUsed))}`));
  console.log("");
}
