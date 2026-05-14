# numista-eval

Évaluer l'équité d'un échange de pièces sur [Numista](https://www.numista.com).

**🇬🇧 [English version](README.md)**

## Ce que ça fait

Vous exportez un fichier d'échange depuis Numista, vous lancez l'outil, et vous obtenez un **rapport Excel** avec les prix estimés, les scores de rareté et un verdict d'équité. Le rapport est entièrement modifiable — ajustez les grades, excluez des pièces, partagez-le avec votre partenaire d'échange.

## Installation

1. Installer [Node.js](https://nodejs.org) (version 20+)
2. Obtenir une clé API Numista gratuite → [numista.com/api](https://en.numista.com/api/doc/index.php)
   > Mon compte → API → Créer une application → copier la clé

## Comment utiliser

**Étape 1** — Exporter votre échange depuis Numista :
- Ouvrir la page de votre échange (ex : `https://fr.numista.com/echanges/echange.php?id=926052`)
- Cliquer sur **Exporter** → enregistrer le fichier `.xls`

**Étape 2** — Lancer l'évaluation :
```bash
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API CAD --lang fr
```

> Utilisez toujours le **chemin complet** vers le fichier XLS, pas un chemin relatif.

**Étape 3** — Ouvrir le fichier Excel dans le dossier `reports/` créé à côté de votre XLS.

### Exemples

```bash
# Rapport en français, dollars canadiens
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API CAD --lang fr

# Rapport en anglais, dollars US
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API USD --lang en

# Rapport en allemand, euros
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API EUR --lang de

# Rapport en chinois, yuan
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API CNY --lang zh

# Rapport en espagnol, pesos mexicains
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API MXN --lang es
```

**Langues** ([ISO 639-1](https://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-1)) **:** `fr` `en` `de` `es` `pt` `it` `nl` `el` `ru` `zh` `ja`

**Devises :** tout code [ISO 4217](https://fr.wikipedia.org/wiki/ISO_4217) — CAD, EUR, USD, GBP, CNY, JPY…

> **Astuce :** créez un fichier `.env` avec `NUMISTA_API_KEY=VOTRE_CLE_API` pour éviter de taper votre clé à chaque fois. Sous Windows, voir `evaluate.example.bat` pour un modèle prêt à l'emploi.

## Le rapport Excel

- Le **prix** s'ajuste automatiquement quand vous changez le grade **QA** (menu déroulant 1–7)
- La colonne **✔** permet d'inclure (✓) ou exclure (✗) chaque pièce — les totaux se recalculent instantanément
- Les valeurs ✓/✗ par défaut sont lues depuis le fichier d'échange Numista (vos propositions vs. celles de l'autre)
- Les **taux de conversion** sont récupérés en direct avec des liens Google pour vérification
- Le **verdict** en bas : ÉQUITABLE, ACCEPTABLE ou DÉSÉQUILIBRÉ (coloré)

## Conseils

- **Les prix sont des estimations.** Ils reflètent la valeur marchande des revendeurs, pas la valeur sentimentale ou de collectionneur.
- **Les pièces commémoratives** sont généralement plus difficiles à trouver que leur prix ne le suggère — ajustez en conséquence.
- **Vérifiez les taux de conversion** pour les devises inhabituelles grâce aux liens dans le fichier Excel.

## Bonus : évaluation en un clic (Windows)

Fatigué de taper la commande à chaque fois ? Un fichier `.bat` permet de sauvegarder vos paramètres une seule fois et de les réutiliser — il suffit de double-cliquer et coller le chemin du fichier.

1. Copier [`evaluate.example.bat`](evaluate.example.bat) et renommer la copie en `evaluate.bat`
2. Ouvrir `evaluate.bat` dans un éditeur de texte (clic droit → Modifier)
3. Remplacer les trois valeurs par les vôtres : clé API, devise, langue
4. Enregistrer — c'est fait. Désormais, il suffit de double-cliquer sur `evaluate.bat`

```bat
@echo off
set API_KEY=VOTRE_CLE_API_ICI
set CURRENCY=CAD
set LANG=fr

set /p FILE=Path to XLS file:
npx numista-eval "%FILE%" %API_KEY% %CURRENCY% --lang %LANG%
pause
```

> **Pour copier le chemin d'un fichier sous Windows :** maintenir `Shift`, clic droit sur le fichier XLS → **Copier en tant que chemin d'accès**. Puis coller quand demandé.
>
> C'est optionnel — la commande `npx` dans le terminal fonctionne exactement de la même façon.

## Quota API

2 000 requêtes/mois (clé gratuite). Chaque évaluation ≈ 60 requêtes → ~30 évaluations/mois.

## Licence

MIT
