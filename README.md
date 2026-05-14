# numista-eval

Evaluate the fairness of a coin swap on [Numista](https://www.numista.com).

**🇫🇷 [Version française](README.fr.md)**

## What it does

You export a swap file from Numista, run the tool, and get an **Excel report** with estimated prices, rarity scores and a fairness verdict. The report is fully editable — adjust grades, exclude coins, share it with your swap partner.

## Setup

1. Install [Node.js](https://nodejs.org) (version 20+)
2. Get a free Numista API key → [numista.com/api](https://en.numista.com/api/doc/index.php)
   > My account → API → Create an application → copy the key

## How to use

**Step 1** — Export your swap from Numista:

- Open your swap page (e.g. `https://en.numista.com/echanges/echange.php?id=926052`)
- Click **Export** → save the `.xls` file

**Step 2** — Run the evaluation:

```bash
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY CAD --lang fr
```

> Always use the **full path** to the XLS file, not a relative path.

**Step 3** — Open the Excel file from the `reports/` folder created next to your XLS.

### Examples

```bash
# French report in Canadian dollars
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY CAD --lang fr

# English report in US dollars
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY USD --lang en

# German report in euros
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY EUR --lang de

# Chinese report in yuan
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY CNY --lang zh

# Spanish report in Mexican pesos
npx numista-eval "C:\Users\me\Downloads\swap_file.xls" YOUR_API_KEY MXN --lang es
```

**Languages** ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes))**:** `fr` `en` `de` `es` `pt` `it` `nl` `el` `ru` `zh` `ja`

**Currencies:** any [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) code — CAD, EUR, USD, GBP, CNY, JPY…

> **Tip:** create a `.env` file with `NUMISTA_API_KEY=YOUR_API_KEY` to avoid typing your key each time. On Windows, see `evaluate.example.bat` for a ready-to-use template.

## The Excel report

- **Price** adjusts automatically when you change the **QA** grade (1–7 dropdown)
- **✔ column** lets you include (✓) or exclude (✗) each coin — totals recalculate instantly
- Default ✓/✗ values are read from the Numista exchange file (your proposals vs. theirs)
- **Conversion rates** are fetched live and shown with Google verification links
- **Verdict** at the bottom: FAIR, ACCEPTABLE or UNBALANCED (colored)

## Tips

- **Prices are estimates.** They reflect dealer market value, not collector or sentimental value.
- **Commemorative coins** are usually harder to find than their price suggests — adjust accordingly.
- **Check conversion rates** for unusual currencies using the links in the Excel file.

## Bonus: one-click evaluation (Windows)

Tired of typing the command every time? A `.bat` file lets you save your settings once and reuse them — just double-click and paste the file path.

1. Copy [`evaluate.example.bat`](evaluate.example.bat) and rename the copy to `evaluate.bat`
2. Open `evaluate.bat` in a text editor (right-click → Edit)
3. Replace the three values with your own: API key, currency, language
4. Save — you're done. From now on, just double-click `evaluate.bat`

```bat
@echo off
set API_KEY=YOUR_API_KEY_HERE
set CURRENCY=CAD
set LANG=fr

set /p FILE=Path to XLS file:
npx numista-eval "%FILE%" %API_KEY% %CURRENCY% --lang %LANG%
pause
```

> **How to copy a file path on Windows:** its secret menu, hold `Shift`, right-click the XLS file → **Copy as path**. Then paste it when prompted.
>
> This is optional — the `npx` command in the terminal works exactly the same way.

## Limitations

- **Grades (QA) are approximate.** Numista does not provide coin condition information in swap files. The tool defaults to the lowest known grade for each coin. You should manually verify and adjust the QA column based on the actual condition of each coin — this directly affects the estimated price.

## API quota

2,000 requests/month (free key). Each evaluation ≈ 60 requests → ~30 evaluations/month.

## License

MIT
