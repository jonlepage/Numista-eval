# numista-eval

Évaluer l'équité d'un échange de pièces sur [Numista](https://www.numista.com).

**🇬🇧 [English version](README.md)**

## Ce que ça fait

Vous exportez un fichier d'échange depuis Numista, vous lancez l'outil, et vous obtenez un **rapport Excel** avec les prix estimés, les scores de rareté et un verdict d'équité. Le rapport est entièrement modifiable — ajustez les grades, excluez des pièces, partagez-le avec votre partenaire d'échange.

## Installation

1. Installer [Node.js](https://nodejs.org) (version 20+)
2. Obtenir une clé API Numista gratuite → [numista.com/api](https://fr.numista.com/api/index.php)

## Comment utiliser

**Étape 1** — Exporter votre échange depuis Numista :
- Ouvrir la page de votre échange (ex : `https://fr.numista.com/echanges/echange.php?id=926052`)
- Cliquer sur **Exporter** → enregistrer le fichier `.xls`

**Étape 2** — Ouvrir un terminal et exécuter :
```bash
npx numista-eval "C:\Users\moi\Downloads\fichier_echange.xls" VOTRE_CLE_API CAD --lang fr
```

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

## Comment le verdict est calculé

Le verdict ne repose **pas seulement sur le prix**. Le prix de marché n'est pas toujours disponible sur Numista, et il est parfois exagéré. L'outil combine donc **quatre indices** en un seul **score d'équité pondéré** :

| Indice | Poids par défaut | Sens |
|---|---|---|
| Prix estimé | 3 | plus je reçois de valeur, mieux c'est |
| Valeur nominale (convertie) | 1 | idem |
| Tirage | 3 | **inversé** : moins de tirage = plus rare = en ma faveur |
| Qualité (QA, /7) | 3 | meilleur grade reçu = mieux c'est |

Chaque indice est comparé entre les deux côtés sous forme d'**écart en pourcentage**, puis pondéré. Seuls les indices réellement chiffrés comptent : si la valeur « donné » est vide ou nulle, l'indice est ignoré et le score est **renormalisé** sur ce qui reste.

> Les poids sont **modifiables directement dans l'Excel** (colonne *Poids* du bilan) : le score et le verdict se recalculent en direct.

### La formule (pour les matheux)

Pour chaque indice *i* présent, on calcule l'écart signé en pourcentage entre les deux côtés :

```
gᵢ = (reçu_i − donné_i) / donné_i × 100
```

Le score d'équité **S** est la moyenne pondérée de ces écarts, renormalisée sur les seuls indices présents :

```
        Σ  wᵢ · sᵢ · gᵢ
S  =  ──────────────────
            Σ  wᵢ
```

- `wᵢ` = poids de l'indice (3, 1, 3, 3 par défaut)
- `sᵢ` = signe de l'indice : **+1** pour prix, nominal et qualité ; **−1** pour le tirage (moins de tirage joue en faveur de celui qui reçoit)
- les sommes ne portent que sur les indices dont le côté « donné » est un nombre **strictement positif**

Convention de signe : **S > 0 → l'échange penche en ma faveur** (je reçois plus que je donne) ; **S < 0 → en ma défaveur**.

Le verdict applique ensuite des seuils sur la **valeur absolue** du score :

| Condition | Verdict |
|---|---|
| `abs(S) ≤ 8` | **ÉQUITABLE** |
| `8 < abs(S) ≤ 20` | **ACCEPTABLE** |
| `abs(S) > 20` | **DÉSÉQUILIBRÉ** |
| aucun indice chiffrable | **INDÉTERMINÉ** |

### Exemple chiffré

Supposons un échange où la QA est laissée vide (l'indice qualité est donc exclu, le dénominateur tombe à `3 + 1 + 3 = 7`) :

| Indice | Reçu | Donné | Écart `gᵢ` | Signe `sᵢ` |
|---|---|---|---|---|
| Prix | 0,96 | 0,28 | +248,5 % | +1 |
| Nominal | 0,06 | 0,04 | +45,9 % | +1 |
| Tirage | 2,44 G | 2,48 G | −1,4 % | −1 |

```
      3·(+248,5) + 1·(+45,9) + 3·(−1)·(−1,4)
S  =  ───────────────────────────────────────  =  795,6 / 7  ≈  +113,7
                    3 + 1 + 3
```

`abs(113,7) > 20` → **DÉSÉQUILIBRÉ** : je reçois environ 3,4× plus de valeur que je ne donne (estimé au grade le plus bas). Le terminal et l'Excel partagent **exactement la même formule** ([src/fairness.ts](src/fairness.ts)) — ils affichent donc toujours le même verdict.

> **À propos de la ligne Tirage du bilan :** elle est affichée **du point de vue de la faveur** — recevoir *plus* de tirage (pièces plus communes) est défavorable, donc l'écart s'affiche en négatif/rouge. Ainsi « vert = en ma faveur » reste vrai pour **toutes** les lignes. C'est exactement le signe `−1` du tirage dans la formule ci-dessus : le verdict est identique.

## Limitations

- **Les grades (QA) sont approximatifs.** Numista ne fournit pas l'état de conservation dans les fichiers d'échange, donc la **colonne QA est laissée vide**. Tant qu'elle l'est, le prix estimé retombe sur le **grade le plus bas connu**. Choisissez une QA (1–7) par pièce pour affiner le prix selon son état réel — cela affecte directement le verdict.
- **Toutes les langues ne sont pas prises en charge.** Le rapport Excel est disponible en 11 langues (voir la liste ci-dessus). Si un code de langue non supporté est fourni, le rapport est généré en anglais par défaut.

## Conseils

- **Les prix sont des estimations.** Ils reflètent la valeur marchande des revendeurs, pas la valeur sentimentale ou de collectionneur.
- **Les pièces commémoratives** sont généralement plus difficiles à trouver que leur prix ne le suggère — ajustez en conséquence.
- **Vérifiez les taux de conversion** pour les devises inhabituelles grâce aux liens dans le fichier Excel.

## Évaluation en un clic (Windows)

Pour éviter de répéter la commande complète, créez un fichier batch réutilisable avec vos paramètres.

1. Créer un nouveau fichier texte et le renommer en `evaluate.bat`
2. Copier le contenu de [`evaluate.example.bat`](evaluate.example.bat) dedans
3. Remplacer les trois valeurs par les vôtres : clé API, devise, langue
4. Enregistrer — c'est fait. Désormais, il suffit de double-cliquer sur `evaluate.bat`

```bat
@echo off
set API_KEY=VOTRE_CLE_API_ICI
set CURRENCY=CAD
set LANG=fr

set /p FILE=Path to XLS file:
set FILE=%FILE:"=%
call npx numista-eval@latest "%FILE%" %API_KEY% %CURRENCY% --lang %LANG%
pause
```

> **Pour copier le chemin d'un fichier sous Windows :** maintenir `Shift` et faire un clic droit sur le fichier XLS pour afficher le menu caché, puis sélectionner **Copier en tant que chemin d'accès**.
>
> C'est optionnel — la commande `npx` dans le terminal fonctionne exactement de la même façon.

## Quota API

2 000 requêtes/mois (clé gratuite). Chaque évaluation ≈ 60 requêtes → ~30 évaluations/mois.

## Licence

MIT
