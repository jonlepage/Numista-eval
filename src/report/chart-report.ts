import XLSXChart from "xlsx-chart";
import path from "path";
import type { EvaluationReport } from "../types/index.js";

export async function generateChartReport(
  report: EvaluationReport,
  outputDir: string,
): Promise<string> {
  const { currency } = report;

  const datestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const safeName = report.title.replace(/[^a-zA-Z0-9àâéèêëïîôùûçÀÂÉÈÊËÏÎÔÙÛÇ\s-]/g, "").trim().replace(/\s+/g, "_");
  const filename = `${safeName}_${datestamp}_graphique.xlsx`;
  const outputPath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    const xlsxChart = new XLSXChart();

    xlsxChart.writeFile(
      {
        file: outputPath,
        chart: "bar",
        titles: ["Je reçois", "Je donne"],
        fields: [`Prix marchand (${currency})`, "Rareté (/10)"],
        data: {
          "Je reçois": {
            [`Prix marchand (${currency})`]: report.demanded.totalPrice,
            "Rareté (/10)": report.demanded.avgRarity ?? 0,
          },
          "Je donne": {
            [`Prix marchand (${currency})`]: report.offered.totalPrice,
            "Rareté (/10)": report.offered.avgRarity ?? 0,
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
