import chalk from "chalk";
import Table from "cli-table3";
import type { EvaluationReport, CoinWithPrices } from "../types/index.js";

function coinRow(c: CoinWithPrices, currency: string): string[] {
  const typeId = c.raw.typeId ? `N# ${c.raw.typeId}` : "?";
  const price = c.priceVF != null ? `${c.priceVF.toFixed(2)} ${currency}` : chalk.yellow("—");
  const mintage = c.mintage != null ? c.mintage.toLocaleString("fr-CA") : "";
  const rarity = c.rarityScore != null ? `${c.rarityScore}/10` : "";

  return [typeId, c.raw.title.substring(0, 38), c.raw.issuer.substring(0, 14), String(c.raw.year || ""), price, mintage, rarity];
}

function makeTable(coins: CoinWithPrices[], currency: string): string {
  const table = new Table({
    head: ["N#", "Nom", "Pays", "An.", `Prix (${currency})`, "Tirage", "Rareté"],
    colWidths: [10, 40, 16, 6, 14, 14, 8],
    style: { head: ["cyan"] },
  });

  for (const c of coins) {
    table.push(coinRow(c, currency));
  }

  return table.toString();
}

export function printReport(report: EvaluationReport): void {
  const { demanded, offered, balance, balancePercent, verdict, currency } = report;
  const date = new Date(report.timestamp).toLocaleString("fr-CA");

  console.log("");
  console.log(chalk.bold.white("═════════════════════════════════════════════════════════════════════════"));
  console.log(chalk.bold.cyan(`  ${report.title}`));
  console.log(chalk.gray(`  ${date} — Devise : ${currency}`));
  console.log(chalk.bold.white("═════════════════════════════════════════════════════════════════════════"));

  console.log("");
  console.log(chalk.bold.green(`  ▼ JE REÇOIS (${demanded.coins.length} pièces)`));
  console.log(makeTable(demanded.coins, currency));

  for (const c of demanded.coins) {
    if (c.numistaUrl) console.log(chalk.gray(`    ${c.raw.typeId} → `) + chalk.blue.underline(c.numistaUrl));
  }

  console.log("");
  console.log(chalk.bold.red(`  ▲ JE DONNE (${offered.coins.length} pièces)`));
  console.log(makeTable(offered.coins, currency));

  for (const c of offered.coins) {
    if (c.numistaUrl) console.log(chalk.gray(`    ${c.raw.typeId} → `) + chalk.blue.underline(c.numistaUrl));
  }

  // Bilans
  console.log("");
  console.log(chalk.bold.white("─── BILAN ─────────────────────────────────────────────────────────────"));
  console.log("");

  console.log(`  ${chalk.bold("Prix marchand :")}`);
  console.log(`    ${chalk.green("Reçu  :")} ${chalk.bold(demanded.totalPrice.toFixed(2))} ${currency}`);
  console.log(`    ${chalk.red("Donné :")} ${chalk.bold(offered.totalPrice.toFixed(2))} ${currency}`);

  const balanceStr = balance >= 0
    ? chalk.green.bold(`+${balance.toFixed(2)} ${currency} (+${balancePercent.toFixed(1)}%)`)
    : chalk.red.bold(`${balance.toFixed(2)} ${currency} (${balancePercent.toFixed(1)}%)`);
  console.log(`    Balance : ${balanceStr}`);

  if (demanded.avgRarity != null && offered.avgRarity != null) {
    console.log("");
    console.log(`  ${chalk.bold("Rareté moyenne :")}`);
    console.log(`    ${chalk.green("Reçu  :")} ${demanded.avgRarity.toFixed(1)}/10`);
    console.log(`    ${chalk.red("Donné :")} ${offered.avgRarity.toFixed(1)}/10`);
  }

  // Verdict
  console.log("");
  const verdictColors = {
    equitable: chalk.bgGreen.black.bold(" ÉQUITABLE "),
    acceptable: chalk.bgYellow.black.bold(" ACCEPTABLE "),
    desequilibre: chalk.bgRed.white.bold(" DÉSÉQUILIBRÉ "),
  };

  console.log(`  ${verdictColors[verdict]}`);
  console.log("");

  const totalNP = demanded.noPriceCount + offered.noPriceCount;
  if (totalNP > 0) {
    console.log(chalk.yellow(`  ${totalNP} pièce(s) sans prix — marquées "—"`));
  }
  console.log(chalk.gray(`  API : ${report.apiCallsUsed} / 2000 appels`));
  console.log("");
}
