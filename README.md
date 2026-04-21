# numista-eval

Telemetry and statistics tool to evaluate the fairness of a coin swap on [Numista](https://www.numista.com).

**🇫🇷 [Version française](README.fr.md)**

<a href="pre1.jpg"><img src="pre1.jpg" width="150" /></a> <a href="prev2.jpg"><img src="prev2.jpg" width="150" /></a>

## Why this tool

When swapping coins with another collector, it is often hard to tell whether the deal is truly balanced. `numista-eval` provides **objective, data-driven insight** by cross-referencing market prices, face values, rarity and condition for every coin in the trade.

Results should not be taken at face value — Numista does not always have complete metadata, which may alter some estimates. This is why the generated Excel file is **fully editable**: prices, grades and conversion rates can be adjusted based on your own judgment whenever data is missing or seems inaccurate. The file can also be shared with your swap partner so both parties can discuss, iterate and reach a deal supported by numbers that satisfy everyone.

## What it produces

- The **estimated market price** of each coin (in CAD, EUR or any currency)
- A **rarity score** based on mintage
- A **comparative summary** with verdict: FAIR, ACCEPTABLE or UNBALANCED
- An **Excel file** with live formulas, editable to fine-tune your assessment
- A **chart** for visual comparison

## Prerequisites

- [Node.js](https://nodejs.org) version 20 or later
- A **Numista API key** (free) → [Get your key](https://en.numista.com/api/doc.php)

> **How to get the key:** log in to Numista → My account → API → Create an application. You will receive a key (a long alphanumeric string).

## Usage

### The command

```bash
npx numista-eval "path/to/file.xls" YOUR_API_KEY
```

The report is printed in the terminal and an Excel file is generated in a `reports/` folder next to the source file.

### How to get the swap file

1. Go to the swap page on Numista (e.g. `https://en.numista.com/echanges/echange.php?id=926052`)
2. Click **Export** (button at the top of the swap page)
3. Save the `.xls` file to your computer

### Examples

```bash
# Evaluation in Canadian dollars (default)
npx numista-eval "swap_bob_alice.xls" abc123def456...

# Evaluation in euros
npx numista-eval "swap_bob_alice.xls" abc123def456... EUR

# If your key is defined in a .env file
npx numista-eval "swap_bob_alice.xls"
```

### Supported currencies

CAD (default), EUR, USD, GBP, and any [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency. Prices are computed by Numista in the chosen currency.

## The Excel file

The Excel report contains:

**"Évaluation" tab** — The main data table:

| Column       | Content                                              |
| ------------ | ---------------------------------------------------- |
| #            | Numista number (clickable link to the coin page)     |
| Nom          | Coin name                                            |
| Pays         | Issuing country                                      |
| Année        | Year of minting                                      |
| A.           | Mint mark                                            |
| V.Nom.       | Face value (nominal)                                 |
| Dev.         | Currency code of the coin                            |
| V.Nom (conv) | Face value converted to your currency                |
| Prix         | Estimated price by Numista (VF grade)                |
| Tirage       | Mintage (number of coins produced)                   |
| Rareté       | Rarity score (1 = very common, 9 = rare)             |
| QA           | Quality — to be filled in by you (1 to 7)            |

**On the right** — A currency conversion table with clickable Google links to verify rates, and a grade reference table.

**At the bottom** — The comparative summary: price, face value, rarity and average quality with percentage differences.

### Quality (QA)

The QA column offers a dropdown from 1 to 7. It is up to each user to assess the condition of their coins:

| Score | FR  | EN  | Description                           |
| ----- | --- | --- | ------------------------------------- |
| 1     | AB  | AG  | Heavily worn, barely identifiable     |
| 2     | B   | G   | Worn but identifiable                 |
| 3     | TB  | F   | Visible wear, clear details           |
| 4     | TTB | VF  | Light wear, nice appearance           |
| 5     | SUP | XF  | Minimal wear                          |
| 6     | SPL | AU  | Almost mint                           |
| 7     | FDC | UNC | Perfect, never circulated             |

> The displayed price is based on the VF grade (TTB = score 4). If coins are in better or worse condition, the actual price may differ.

**"Graphique" tab** — A chart visually comparing both sides of the swap.

## Tips

- **Do not rely solely on price.** Numista estimates are based on member evaluations, many of whom are dealers. These prices reflect a market value that is often inflated and does not account for sentimental value or personal interest. For some, numismatics is a business; for others, it is a hobby — both perspectives are valid, but they do not weigh price the same way.

- **Commemorative coins deserve special attention.** Even if their estimated price is similar to a regular coin, they are usually much harder to find — typically 0 to 5 per roll of 50 coins. This practical rarity is not always reflected in the price. It is recommended to manually adjust the QA column or the price for such coins.

- **Verify conversion rates.** Some currencies returned by the API may seem unusual (historical currencies, local denominations). The conversion table in the Excel file provides a clickable link for each currency, allowing you to check the current rate on Google and confirm market conditions.

## API quota

Numista grants **2,000 requests per month** with a free key. Each evaluation uses approximately **60 requests** (3 per coin), which allows for about 30 evaluations per month.

## License

MIT
