export interface ExcelStrings {
  sheetName: string;
  exchangeTitle: string;
  headers: {
    name: string;
    country: string;
    year: string;
    mintMark: string;
    faceValue: string;
    currency: string;
    convertedValue: string;
    price: string;
    mintage: string;
    rarity: string;
  };
  referenceTable: {
    currency: string;
    verify: string;
    score: string;
    grade: string;
  };
  sections: {
    totalReceived: string;
    totalGiven: string;
  };
  bilan: {
    title: string;
    iReceive: string;
    iGive: string;
    difference: string;
    gap: string;
    price: string;
    nominalConverted: string;
    avgRarity: string;
    avgQuality: string;
  };
  verdict: {
    label: string;
    fair: string;
    acceptable: string;
    unbalanced: string;
  };
  gradeLabels: string[];
}

export type Locale = "fr" | "en" | "es" | "de" | "pt" | "it" | "nl" | "el" | "ru" | "zh" | "ja";

const DICTIONARIES: Record<Locale, ExcelStrings> = {
  fr: {
    sheetName: "Évaluation",
    exchangeTitle: "Échange n°{n} : {name1} – {name2}",

    headers: {
      name: "Nom",
      country: "Pays",
      year: "Année",
      mintMark: "A.",
      faceValue: "V.Nom.",
      currency: "Dev.",
      convertedValue: "V.Nom (conv)",
      price: "Prix",
      mintage: "Tirage",
      rarity: "Rareté",
    },
    referenceTable: {
      currency: "Devise",
      verify: "Vérifier",
      score: "Score",
      grade: "Grade",
    },
    sections: {
      totalReceived: "TOTAL REÇU",
      totalGiven: "TOTAL DONNÉ",
    },
    bilan: {
      title: "BILAN COMPARATIF",
      iReceive: "Je reçois",
      iGive: "Je donne",
      difference: "Diff.",
      gap: "Écart %",
      price: "Prix",
      nominalConverted: "Nominal conv.",
      avgRarity: "Rareté moy.",
      avgQuality: "QA moy.",
    },
    verdict: {
      label: "VERDICT",
      fair: "ÉQUITABLE",
      acceptable: "ACCEPTABLE",
      unbalanced: "DÉSÉQUILIBRÉ",
    },
    gradeLabels: ["AB", "B", "TB", "TTB", "SUP", "SPL", "FDC"],
  },

  en: {
    sheetName: "Evaluation",
    exchangeTitle: "Exchange #{n}: {name1} – {name2}",

    headers: {
      name: "Name",
      country: "Country",
      year: "Year",
      mintMark: "Mk.",
      faceValue: "Face Val.",
      currency: "Cur.",
      convertedValue: "Face Val. (conv)",
      price: "Price",
      mintage: "Mintage",
      rarity: "Rarity",
    },
    referenceTable: {
      currency: "Currency",
      verify: "Verify",
      score: "Score",
      grade: "Grade",
    },
    sections: {
      totalReceived: "TOTAL RECEIVED",
      totalGiven: "TOTAL GIVEN",
    },
    bilan: {
      title: "COMPARATIVE SUMMARY",
      iReceive: "I receive",
      iGive: "I give",
      difference: "Diff.",
      gap: "Gap %",
      price: "Price",
      nominalConverted: "Nominal conv.",
      avgRarity: "Avg. rarity",
      avgQuality: "Avg. QA",
    },
    verdict: {
      label: "VERDICT",
      fair: "FAIR",
      acceptable: "ACCEPTABLE",
      unbalanced: "UNBALANCED",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },

  de: {
    sheetName: "Bewertung",
    exchangeTitle: "Tausch Nr. {n}: {name1} – {name2}",

    headers: {
      name: "Name",
      country: "Land",
      year: "Jahr",
      mintMark: "Mz.",
      faceValue: "Nennw.",
      currency: "Währ.",
      convertedValue: "Nennw. (umg.)",
      price: "Preis",
      mintage: "Auflage",
      rarity: "Seltenheit",
    },
    referenceTable: {
      currency: "Währung",
      verify: "Prüfen",
      score: "Wert",
      grade: "Grad",
    },
    sections: {
      totalReceived: "GESAMT ERHALTEN",
      totalGiven: "GESAMT GEGEBEN",
    },
    bilan: {
      title: "VERGLEICHSBILANZ",
      iReceive: "Ich erhalte",
      iGive: "Ich gebe",
      difference: "Diff.",
      gap: "Abw. %",
      price: "Preis",
      nominalConverted: "Nennw. umg.",
      avgRarity: "Seltenh. Ø",
      avgQuality: "QA Ø",
    },
    verdict: {
      label: "URTEIL",
      fair: "FAIR",
      acceptable: "AKZEPTABEL",
      unbalanced: "UNAUSGEGLICHEN",
    },
    gradeLabels: ["GE", "SGE", "S", "SS", "VZ", "UNZ", "St"],
  },

  es: {
    sheetName: "Evaluación",
    exchangeTitle: "Intercambio n.º {n}: {name1} – {name2}",

    headers: {
      name: "Nombre",
      country: "País",
      year: "Año",
      mintMark: "Ce.",
      faceValue: "V.Nom.",
      currency: "Mon.",
      convertedValue: "V.Nom. (conv)",
      price: "Precio",
      mintage: "Tirada",
      rarity: "Rareza",
    },
    referenceTable: {
      currency: "Moneda",
      verify: "Verificar",
      score: "Valor",
      grade: "Grado",
    },
    sections: {
      totalReceived: "TOTAL RECIBIDO",
      totalGiven: "TOTAL DADO",
    },
    bilan: {
      title: "BALANCE COMPARATIVO",
      iReceive: "Recibo",
      iGive: "Doy",
      difference: "Dif.",
      gap: "Desv. %",
      price: "Precio",
      nominalConverted: "Nominal conv.",
      avgRarity: "Rareza prom.",
      avgQuality: "QA prom.",
    },
    verdict: {
      label: "VEREDICTO",
      fair: "EQUITATIVO",
      acceptable: "ACEPTABLE",
      unbalanced: "DESEQUILIBRADO",
    },
    gradeLabels: ["RC", "BC", "BC+", "MBC", "EBC", "SC", "FDC"],
  },

  pt: {
    sheetName: "Avaliação",
    exchangeTitle: "Troca n.º {n}: {name1} – {name2}",

    headers: {
      name: "Nome",
      country: "País",
      year: "Ano",
      mintMark: "Of.",
      faceValue: "V.Nom.",
      currency: "Moeda",
      convertedValue: "V.Nom. (conv)",
      price: "Preço",
      mintage: "Tiragem",
      rarity: "Raridade",
    },
    referenceTable: {
      currency: "Moeda",
      verify: "Verificar",
      score: "Valor",
      grade: "Grau",
    },
    sections: {
      totalReceived: "TOTAL RECEBIDO",
      totalGiven: "TOTAL DADO",
    },
    bilan: {
      title: "BALANÇO COMPARATIVO",
      iReceive: "Recebo",
      iGive: "Dou",
      difference: "Dif.",
      gap: "Desv. %",
      price: "Preço",
      nominalConverted: "Nominal conv.",
      avgRarity: "Raridade méd.",
      avgQuality: "QA méd.",
    },
    verdict: {
      label: "VEREDITO",
      fair: "JUSTO",
      acceptable: "ACEITÁVEL",
      unbalanced: "DESEQUILIBRADO",
    },
    gradeLabels: ["REG", "BC", "MBC", "MBC+", "SOB", "BELA", "FDC"],
  },

  it: {
    sheetName: "Valutazione",
    exchangeTitle: "Scambio n. {n}: {name1} – {name2}",

    headers: {
      name: "Nome",
      country: "Paese",
      year: "Anno",
      mintMark: "Zec.",
      faceValue: "V.Nom.",
      currency: "Val.",
      convertedValue: "V.Nom. (conv)",
      price: "Prezzo",
      mintage: "Tiratura",
      rarity: "Rarità",
    },
    referenceTable: {
      currency: "Valuta",
      verify: "Verificare",
      score: "Valore",
      grade: "Grado",
    },
    sections: {
      totalReceived: "TOTALE RICEVUTO",
      totalGiven: "TOTALE DATO",
    },
    bilan: {
      title: "BILANCIO COMPARATIVO",
      iReceive: "Ricevo",
      iGive: "Do",
      difference: "Diff.",
      gap: "Scarto %",
      price: "Prezzo",
      nominalConverted: "Nominale conv.",
      avgRarity: "Rarità med.",
      avgQuality: "QA med.",
    },
    verdict: {
      label: "VERDETTO",
      fair: "EQUO",
      acceptable: "ACCETTABILE",
      unbalanced: "SBILANCIATO",
    },
    gradeLabels: ["M", "B", "MB", "BB", "SPL", "qFDC", "FDC"],
  },

  nl: {
    sheetName: "Evaluatie",
    exchangeTitle: "Ruil nr. {n}: {name1} – {name2}",

    headers: {
      name: "Naam",
      country: "Land",
      year: "Jaar",
      mintMark: "Mmt.",
      faceValue: "Nom.W.",
      currency: "Val.",
      convertedValue: "Nom.W. (conv)",
      price: "Prijs",
      mintage: "Oplage",
      rarity: "Zeldzaamh.",
    },
    referenceTable: {
      currency: "Valuta",
      verify: "Verifiëren",
      score: "Score",
      grade: "Graad",
    },
    sections: {
      totalReceived: "TOTAAL ONTVANGEN",
      totalGiven: "TOTAAL GEGEVEN",
    },
    bilan: {
      title: "VERGELIJKEND OVERZICHT",
      iReceive: "Ik ontvang",
      iGive: "Ik geef",
      difference: "Versch.",
      gap: "Afw. %",
      price: "Prijs",
      nominalConverted: "Nom. conv.",
      avgRarity: "Gem. zeldzaamh.",
      avgQuality: "Gem. QA",
    },
    verdict: {
      label: "OORDEEL",
      fair: "EERLIJK",
      acceptable: "AANVAARDBAAR",
      unbalanced: "ONEVENWICHTIG",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },

  el: {
    sheetName: "Αξιολόγηση",
    exchangeTitle: "Ανταλλαγή #{n}: {name1} – {name2}",

    headers: {
      name: "Όνομα",
      country: "Χώρα",
      year: "Έτος",
      mintMark: "Νομ.",
      faceValue: "Ον.Αξ.",
      currency: "Νόμ.",
      convertedValue: "Ον.Αξ. (μετ.)",
      price: "Τιμή",
      mintage: "Κοπή",
      rarity: "Σπανιότητα",
    },
    referenceTable: {
      currency: "Νόμισμα",
      verify: "Έλεγχος",
      score: "Βαθμός",
      grade: "Κατάσταση",
    },
    sections: {
      totalReceived: "ΣΥΝΟΛΟ ΛΗΨΗΣ",
      totalGiven: "ΣΥΝΟΛΟ ΔΟΣΗΣ",
    },
    bilan: {
      title: "ΣΥΓΚΡΙΤΙΚΟ ΙΣΟΖΥΓΙΟ",
      iReceive: "Λαμβάνω",
      iGive: "Δίνω",
      difference: "Διαφ.",
      gap: "Απόκλ. %",
      price: "Τιμή",
      nominalConverted: "Ον.αξ. μετ.",
      avgRarity: "Μέση σπαν.",
      avgQuality: "Μέσο QA",
    },
    verdict: {
      label: "ΑΠΟΤΕΛΕΣΜΑ",
      fair: "ΔΙΚΑΙΟ",
      acceptable: "ΑΠΟΔΕΚΤΟ",
      unbalanced: "ΑΝΙΣΟΡΡΟΠΟ",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },

  ru: {
    sheetName: "Оценка",
    exchangeTitle: "Обмен №{n}: {name1} – {name2}",

    headers: {
      name: "Название",
      country: "Страна",
      year: "Год",
      mintMark: "Мон.",
      faceValue: "Номин.",
      currency: "Вал.",
      convertedValue: "Номин. (конв)",
      price: "Цена",
      mintage: "Тираж",
      rarity: "Редкость",
    },
    referenceTable: {
      currency: "Валюта",
      verify: "Проверить",
      score: "Балл",
      grade: "Степень",
    },
    sections: {
      totalReceived: "ИТОГО ПОЛУЧЕНО",
      totalGiven: "ИТОГО ОТДАНО",
    },
    bilan: {
      title: "СРАВНИТЕЛЬНЫЙ БАЛАНС",
      iReceive: "Получаю",
      iGive: "Отдаю",
      difference: "Разн.",
      gap: "Откл. %",
      price: "Цена",
      nominalConverted: "Номин. конв.",
      avgRarity: "Ср. редкость",
      avgQuality: "Ср. QA",
    },
    verdict: {
      label: "ВЕРДИКТ",
      fair: "СПРАВЕДЛИВО",
      acceptable: "ПРИЕМЛЕМО",
      unbalanced: "НЕРАВНОЦЕННО",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },

  zh: {
    sheetName: "评估",
    exchangeTitle: "交换 #{n}：{name1} – {name2}",

    headers: {
      name: "名称",
      country: "国家",
      year: "年份",
      mintMark: "厂标",
      faceValue: "面值",
      currency: "币种",
      convertedValue: "面值(换算)",
      price: "价格",
      mintage: "铸量",
      rarity: "稀有度",
    },
    referenceTable: {
      currency: "货币",
      verify: "验证",
      score: "评分",
      grade: "品相",
    },
    sections: {
      totalReceived: "收到合计",
      totalGiven: "付出合计",
    },
    bilan: {
      title: "对比总结",
      iReceive: "我收到",
      iGive: "我付出",
      difference: "差额",
      gap: "偏差 %",
      price: "价格",
      nominalConverted: "面值换算",
      avgRarity: "平均稀有度",
      avgQuality: "平均品相",
    },
    verdict: {
      label: "结论",
      fair: "公平",
      acceptable: "可接受",
      unbalanced: "不平衡",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },

  ja: {
    sheetName: "評価",
    exchangeTitle: "交換 #{n}：{name1} – {name2}",

    headers: {
      name: "名称",
      country: "国",
      year: "年",
      mintMark: "造幣",
      faceValue: "額面",
      currency: "通貨",
      convertedValue: "額面(換算)",
      price: "価格",
      mintage: "発行数",
      rarity: "希少度",
    },
    referenceTable: {
      currency: "通貨",
      verify: "確認",
      score: "評点",
      grade: "状態",
    },
    sections: {
      totalReceived: "受取合計",
      totalGiven: "提供合計",
    },
    bilan: {
      title: "比較概要",
      iReceive: "受取",
      iGive: "提供",
      difference: "差額",
      gap: "偏差 %",
      price: "価格",
      nominalConverted: "額面換算",
      avgRarity: "平均希少度",
      avgQuality: "平均品相",
    },
    verdict: {
      label: "判定",
      fair: "公平",
      acceptable: "許容範囲",
      unbalanced: "不均衡",
    },
    gradeLabels: ["AG", "G", "F", "VF", "XF", "AU", "UNC"],
  },
};

export function t(lang: string): ExcelStrings {
  return DICTIONARIES[lang as Locale] ?? DICTIONARIES.en;
}
