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

config({ path: path.resolve(process.cwd(), ".env") });

function resolveArgs(args: string[]): { filePath: string; apiKey: string; currency: string } {
  const [first, second, third] = args;

  if (!first) {
    console.error("Usage: numista-eval <fichier.xls> <apiKey> [devise]");
    process.exit(1);
  }

  // Déterminer quel arg est la clé API (alphanum 30+ chars)
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
    console.error("Erreur : clé API manquante.");
    console.error("  numista-eval <fichier.xls> <apiKey> [devise]");
    process.exit(1);
  }

  return { filePath: first, apiKey, currency };
}

program
  .name("numista-eval")
  .description("Évaluateur d'échanges Numista")
  .version("0.1.0")
  .argument("<file>", "Fichier XLS exporté depuis Numista")
  .argument("[apiKey]", "Clé API Numista (ou via NUMISTA_API_KEY dans .env)")
  .argument("[currency]", "Code devise ISO 4217 (défaut: CAD)")
  .option("-l, --lang <code>", "Langue du rapport Excel: fr,en,de,es,pt,it,nl,el,ru,zh,ja (défaut: fr)", "fr")
  .action(async (file: string, apiKey?: string, currency?: string, options?: { lang: string }) => {
    const resolved = resolveArgs([file, apiKey ?? "", currency ?? ""].filter(Boolean));
    const lang = options?.lang ?? "fr";
    const filePath = path.resolve(resolved.filePath);

    console.log("");
    console.log("Lecture du fichier XLS...");
    const exchange = parseNumistaXls(filePath);
    console.log(`  ✓ ${exchange.title}`);
    console.log(`  ✓ ${exchange.demanded.length} pièces demandées, ${exchange.offered.length} offertes`);

    const client = new NumistaClient(resolved.apiKey);

    console.log("");
    console.log("Interrogation de l'API Numista...");
    const report = await evaluate(
      exchange.title,
      exchange.demanded,
      exchange.offered,
      client,
      resolved.currency,
      (msg) => console.log(msg),
    );

    printReport(report);

    const reportsDir = path.join(path.dirname(filePath), "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const excelPath = await generateExcelReport(report, reportsDir, lang);
    const chartPath = await generateChartReport(report, reportsDir);
    console.log(`  Rapport Excel : ${excelPath}`);
    console.log(`  Graphique     : ${chartPath}`);
    console.log("");
  });

program.parse();
