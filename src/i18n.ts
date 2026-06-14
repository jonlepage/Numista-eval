export interface I18nStrings {
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
  terminal: {
    iReceive: string;
    iGive: string;
    bilanTitle: string;
    merchantPrice: string;
    received: string;
    given: string;
    balance: string;
    avgRarity: string;
    noPrice: string;
    apiCalls: string;
    currency: string;
  };
  cli: {
    readingFile: string;
    queryingApi: string;
    coinsFound: string;
    reportExcel: string;
    reportChart: string;
    errorNoKey: string;
  };
}

export type Locale = "fr" | "en" | "es" | "de" | "pt" | "it" | "nl" | "el" | "ru" | "zh" | "ja";

const LOCALE_TO_BCP47: Record<Locale, string> = {
  fr: "fr-CA", en: "en-US", de: "de-DE", es: "es-ES",
  pt: "pt-BR", it: "it-IT", nl: "nl-NL", el: "el-GR",
  ru: "ru-RU", zh: "zh-CN", ja: "ja-JP",
};

export function bcp47(lang: string): string {
  return LOCALE_TO_BCP47[lang as Locale] ?? "en-US";
}

const DICTIONARIES: Record<Locale, I18nStrings> = {
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
    terminal: {
      iReceive: "JE REÇOIS",
      iGive: "JE DONNE",
      bilanTitle: "BILAN",
      merchantPrice: "Prix marchand :",
      received: "Reçu  :",
      given: "Donné :",
      balance: "Balance",
      avgRarity: "Rareté moyenne :",
      noPrice: "{n} pièce(s) sans prix — marquées \"—\"",
      apiCalls: "API : {n} / 2000 appels",
      currency: "Devise",
    },
    cli: {
      readingFile: "Lecture du fichier XLS...",
      queryingApi: "Interrogation de l'API Numista...",
      coinsFound: "{demanded} pièces demandées, {offered} offertes",
      reportExcel: "Rapport Excel",
      reportChart: "Graphique",
      errorNoKey: "Erreur : clé API manquante.",
    },
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
    terminal: {
      iReceive: "I RECEIVE",
      iGive: "I GIVE",
      bilanTitle: "SUMMARY",
      merchantPrice: "Market price:",
      received: "Received:",
      given: "Given:",
      balance: "Balance",
      avgRarity: "Avg. rarity:",
      noPrice: "{n} coin(s) without price — marked \"—\"",
      apiCalls: "API: {n} / 2000 calls",
      currency: "Currency",
    },
    cli: {
      readingFile: "Reading XLS file...",
      queryingApi: "Querying Numista API...",
      coinsFound: "{demanded} coins requested, {offered} offered",
      reportExcel: "Excel report",
      reportChart: "Chart",
      errorNoKey: "Error: API key missing.",
    },
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
    terminal: {
      iReceive: "ICH ERHALTE",
      iGive: "ICH GEBE",
      bilanTitle: "BILANZ",
      merchantPrice: "Marktpreis:",
      received: "Erhalten:",
      given: "Gegeben:",
      balance: "Saldo",
      avgRarity: "Ø Seltenheit:",
      noPrice: "{n} Münze(n) ohne Preis — mit \"—\" markiert",
      apiCalls: "API: {n} / 2000 Aufrufe",
      currency: "Währung",
    },
    cli: {
      readingFile: "XLS-Datei wird gelesen...",
      queryingApi: "Numista-API wird abgefragt...",
      coinsFound: "{demanded} angeforderte Münzen, {offered} angebotene",
      reportExcel: "Excel-Bericht",
      reportChart: "Diagramm",
      errorNoKey: "Fehler: API-Schlüssel fehlt.",
    },
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
    terminal: {
      iReceive: "RECIBO",
      iGive: "DOY",
      bilanTitle: "BALANCE",
      merchantPrice: "Precio de mercado:",
      received: "Recibido:",
      given: "Dado:",
      balance: "Balance",
      avgRarity: "Rareza prom.:",
      noPrice: "{n} moneda(s) sin precio — marcadas \"—\"",
      apiCalls: "API: {n} / 2000 llamadas",
      currency: "Moneda",
    },
    cli: {
      readingFile: "Leyendo archivo XLS...",
      queryingApi: "Consultando API Numista...",
      coinsFound: "{demanded} monedas solicitadas, {offered} ofrecidas",
      reportExcel: "Informe Excel",
      reportChart: "Gráfico",
      errorNoKey: "Error: falta la clave API.",
    },
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
    terminal: {
      iReceive: "RECEBO",
      iGive: "DOU",
      bilanTitle: "BALANÇO",
      merchantPrice: "Preço de mercado:",
      received: "Recebido:",
      given: "Dado:",
      balance: "Saldo",
      avgRarity: "Raridade méd.:",
      noPrice: "{n} moeda(s) sem preço — marcadas \"—\"",
      apiCalls: "API: {n} / 2000 chamadas",
      currency: "Moeda",
    },
    cli: {
      readingFile: "Lendo arquivo XLS...",
      queryingApi: "Consultando API Numista...",
      coinsFound: "{demanded} moedas solicitadas, {offered} oferecidas",
      reportExcel: "Relatório Excel",
      reportChart: "Gráfico",
      errorNoKey: "Erro: chave API ausente.",
    },
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
    terminal: {
      iReceive: "RICEVO",
      iGive: "DO",
      bilanTitle: "BILANCIO",
      merchantPrice: "Prezzo di mercato:",
      received: "Ricevuto:",
      given: "Dato:",
      balance: "Saldo",
      avgRarity: "Rarità med.:",
      noPrice: "{n} moneta/e senza prezzo — contrassegnate \"—\"",
      apiCalls: "API: {n} / 2000 chiamate",
      currency: "Valuta",
    },
    cli: {
      readingFile: "Lettura file XLS...",
      queryingApi: "Interrogazione API Numista...",
      coinsFound: "{demanded} monete richieste, {offered} offerte",
      reportExcel: "Rapporto Excel",
      reportChart: "Grafico",
      errorNoKey: "Errore: chiave API mancante.",
    },
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
    terminal: {
      iReceive: "IK ONTVANG",
      iGive: "IK GEEF",
      bilanTitle: "OVERZICHT",
      merchantPrice: "Marktprijs:",
      received: "Ontvangen:",
      given: "Gegeven:",
      balance: "Saldo",
      avgRarity: "Gem. zeldzaamh.:",
      noPrice: "{n} munt(en) zonder prijs — gemarkeerd \"—\"",
      apiCalls: "API: {n} / 2000 oproepen",
      currency: "Valuta",
    },
    cli: {
      readingFile: "XLS-bestand wordt gelezen...",
      queryingApi: "Numista-API wordt bevraagd...",
      coinsFound: "{demanded} gevraagde munten, {offered} aangeboden",
      reportExcel: "Excel-rapport",
      reportChart: "Grafiek",
      errorNoKey: "Fout: API-sleutel ontbreekt.",
    },
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
    terminal: {
      iReceive: "ΛΑΜΒΑΝΩ",
      iGive: "ΔΙΝΩ",
      bilanTitle: "ΙΣΟΖΥΓΙΟ",
      merchantPrice: "Τιμή αγοράς:",
      received: "Λήψη:",
      given: "Δόση:",
      balance: "Υπόλοιπο",
      avgRarity: "Μέση σπανιότ.:",
      noPrice: "{n} νόμισμα(τα) χωρίς τιμή — σημειωμένα \"—\"",
      apiCalls: "API: {n} / 2000 κλήσεις",
      currency: "Νόμισμα",
    },
    cli: {
      readingFile: "Ανάγνωση αρχείου XLS...",
      queryingApi: "Ερώτηση API Numista...",
      coinsFound: "{demanded} ζητούμενα νομίσματα, {offered} προσφερόμενα",
      reportExcel: "Αναφορά Excel",
      reportChart: "Γράφημα",
      errorNoKey: "Σφάλμα: λείπει το κλειδί API.",
    },
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
    terminal: {
      iReceive: "ПОЛУЧАЮ",
      iGive: "ОТДАЮ",
      bilanTitle: "БАЛАНС",
      merchantPrice: "Рыночная цена:",
      received: "Получено:",
      given: "Отдано:",
      balance: "Баланс",
      avgRarity: "Ср. редкость:",
      noPrice: "{n} монет(а) без цены — отмечены \"—\"",
      apiCalls: "API: {n} / 2000 вызовов",
      currency: "Валюта",
    },
    cli: {
      readingFile: "Чтение файла XLS...",
      queryingApi: "Запрос к API Numista...",
      coinsFound: "{demanded} запрошенных монет, {offered} предложенных",
      reportExcel: "Отчёт Excel",
      reportChart: "График",
      errorNoKey: "Ошибка: отсутствует ключ API.",
    },
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
    terminal: {
      iReceive: "收到",
      iGive: "付出",
      bilanTitle: "总结",
      merchantPrice: "市场价格：",
      received: "收到：",
      given: "付出：",
      balance: "余额",
      avgRarity: "平均稀有度：",
      noPrice: "{n} 枚硬币无价格——标记为\"—\"",
      apiCalls: "API：{n} / 2000 次调用",
      currency: "货币",
    },
    cli: {
      readingFile: "正在读取XLS文件...",
      queryingApi: "正在查询Numista API...",
      coinsFound: "{demanded} 枚请求硬币，{offered} 枚提供",
      reportExcel: "Excel报告",
      reportChart: "图表",
      errorNoKey: "错误：缺少API密钥。",
    },
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
    terminal: {
      iReceive: "受取",
      iGive: "提供",
      bilanTitle: "概要",
      merchantPrice: "市場価格：",
      received: "受取：",
      given: "提供：",
      balance: "残高",
      avgRarity: "平均希少度：",
      noPrice: "{n} 枚の硬貨に価格なし——\"—\"と表示",
      apiCalls: "API：{n} / 2000 呼び出し",
      currency: "通貨",
    },
    cli: {
      readingFile: "XLSファイルを読み込み中...",
      queryingApi: "Numista APIに問い合わせ中...",
      coinsFound: "リクエスト {demanded} 枚、提供 {offered} 枚",
      reportExcel: "Excelレポート",
      reportChart: "チャート",
      errorNoKey: "エラー：APIキーがありません。",
    },
  },
};

export function t(lang: string): I18nStrings {
  return DICTIONARIES[lang as Locale] ?? DICTIONARIES.en;
}
