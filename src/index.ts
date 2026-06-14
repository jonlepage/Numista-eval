import { program } from "commander";
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { parseNumistaXls } from "./parser/xls-parser.js";
import { NumistaClient } from "./api/numista-client.js";
import { evaluate } from "./evaluator/evaluator.js";
import { printReport } from "./report/terminal-report.js";
import { generateExcelReport } from "./report/excel-report.js";
import { generateChartReport } from "./report/chart-report.js";
import { t } from "./i18n.js";

config({ path: path.resolve(process.cwd(), ".env") });

function resolveArgs(args: string[], lang: string): { filePath: string; apiKey: string; currency: string } {
  const [first, second, third] = args;
  const dict = t(lang);

  if (!first) {
    console.error("Usage: numista-eval <file.xls> <apiKey> [currency]");
    process.exit(1);
  }

  const isKey = (s: string) => /^[a-zA-Z0-9]{30,}$/.test(s);

  let apiKey = process.env.NUMISTA_API_KEY ?? "";
  let currency = "CAD";

  if (second && isKey(second)) {
    apiKey = second;
    if (third && /^[A-Z]{3}$/.test(third)) currency = third;
  } else if (second && /^[A-Z]{3}$/.test(second)) {
    currency = second;
  }

  if (!apiKey) {
    console.error(dict.cli.errorNoKey);
    console.error("  numista-eval <file.xls> <apiKey> [currency]");
    process.exit(1);
  }

  return { filePath: first, apiKey, currency };
}

program
  .name("numista-eval")
  .description("Numista exchange evaluator")
  .version("0.4.0")
  .argument("<file>", "XLS file exported from Numista")
  .argument("[apiKey]", "Numista API key (or via NUMISTA_API_KEY in .env)")
  .argument("[currency]", "ISO 4217 currency code (default: CAD)")
  .option("-l, --lang <code>", "Report language: fr,en,de,es,pt,it,nl,el,ru,zh,ja (default: fr)", "fr")
  .action(async (file: string, apiKey?: string, currency?: string, options?: { lang: string }) => {
    const lang = options?.lang ?? "fr";
    const dict = t(lang);
    const resolved = resolveArgs([file, apiKey ?? "", currency ?? ""].filter(Boolean), lang);
    const filePath = path.resolve(resolved.filePath);

    console.log("");
    console.log(dict.cli.readingFile);
    const exchange = parseNumistaXls(filePath);
    console.log(`  ✓ ${exchange.title}`);
    console.log(`  ✓ ${dict.cli.coinsFound.replace("{demanded}", String(exchange.demanded.length)).replace("{offered}", String(exchange.offered.length))}`);

    const client = new NumistaClient(resolved.apiKey);

    console.log("");
    console.log(dict.cli.queryingApi);
    const report = await evaluate(
      exchange.title,
      exchange.demanded,
      exchange.offered,
      client,
      resolved.currency,
      (msg) => console.log(msg),
    );

    printReport(report, lang);

    const reportsDir = path.join(path.dirname(filePath), "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const excelPath = await generateExcelReport(report, reportsDir, lang);
    const chartPath = await generateChartReport(report, reportsDir, lang);
    console.log(`  ${dict.cli.reportExcel} : ${excelPath}`);
    console.log(`  ${dict.cli.reportChart}     : ${chartPath}`);
    console.log("");
  });

program.parse();
