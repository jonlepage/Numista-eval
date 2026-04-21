declare module "xlsx-chart" {
  interface ChartOptions {
    chart: "column" | "bar" | "line" | "area" | "radar" | "scatter" | "pie";
    titles: string[];
    fields: string[];
    data: Record<string, Record<string, number>>;
    chartTitle?: string;
  }

  interface GenerateOptions {
    file?: string;
    charts?: ChartOptions[];
    chart?: string;
    titles?: string[];
    fields?: string[];
    data?: Record<string, Record<string, number>>;
    chartTitle?: string;
  }

  class XLSXChart {
    generate(opts: GenerateOptions, cb: (err: Error | null, data: Buffer) => void): void;
    writeFile(opts: GenerateOptions, cb: (err: Error | null) => void): void;
  }

  export = XLSXChart;
}
