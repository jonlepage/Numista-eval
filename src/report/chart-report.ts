import XLSXChart from "xlsx-chart";
import path from "path";
import type { EvaluationReport } from "../types/index.js";
import { t } from "../i18n.js";

export async function generateChartReport(
  report: EvaluationReport,
  outputDir: string,
  lang = "fr",
): Promise<string> {
  const { currency } = report;
  const dict = t(lang);

  const datestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const safeName = report.title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "_");
  const filename = `${safeName}_${datestamp}_chart.xlsx`;
  const outputPath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    const xlsxChart = new XLSXChart();

    xlsxChart.writeFile(
      {
        file: outputPath,
        chart: "bar",
        titles: [dict.bilan.iReceive, dict.bilan.iGive],
        fields: [`${dict.bilan.price} (${currency})`, `${dict.headers.rarity} (/10)`],
        data: {
          [dict.bilan.iReceive]: {
            [`${dict.bilan.price} (${currency})`]: report.demanded.totalPrice,
            [`${dict.headers.rarity} (/10)`]: report.demanded.avgRarity ?? 0,
          },
          [dict.bilan.iGive]: {
            [`${dict.bilan.price} (${currency})`]: report.offered.totalPrice,
            [`${dict.headers.rarity} (/10)`]: report.offered.avgRarity ?? 0,
          },
        },
        chartTitle: report.title,
      },
      (err: Error | null) => {
        if (err) return reject(err);
        resolve(outputPath);
      },
    );
  });
}
