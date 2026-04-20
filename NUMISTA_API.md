# Numista API v3 — Documentation de référence

> **Base URL :** `https://api.numista.com/v3`
> **Version :** 3.31.1
> **Langues supportées :** `en`, `es`, `fr`

---

## 1. Authentification

### 1.1 Clé API (obligatoire pour tout appel)

Toutes les requêtes doivent inclure la clé API dans le header HTTP :

```
Numista-API-Key: VOTRE_CLE_API
```

### 1.2 OAuth 2.0 (pour accéder aux données personnelles)

Nécessaire pour : consultation de collection, modification de collection.

**Scopes disponibles :**
| Scope | Description |
|---|---|
| `view_collection` | Consulter la collection d'un utilisateur |
| `edit_collection` | Modifier la collection d'un utilisateur |

**Deux flux possibles :**

#### Authorization Code (pour authentifier un autre utilisateur)
1. Rediriger vers : `https://{lang}.numista.com/api/oauth_authorize.php?response_type=code&client_id={id}&redirect_uri={uri}&scope={scope}&state={state}`
2. Récupérer le `code` retourné
3. Échanger le code via `GET /oauth_token` avec `grant_type=authorization_code`

#### Client Credentials (pour son propre compte)
- Appeler `GET /oauth_token` avec `grant_type=client_credentials&scope=view_collection`
- Pas besoin de redirection

**Réponse :**
```json
{
  "access_token": "b85cb9515e...",
  "token_type": "bearer",
  "expires_in": 7776000,
  "user_id": 2104
}
```

Utiliser ensuite : `Authorization: Bearer {access_token}`

---

## 2. Endpoints du catalogue

### 2.1 `GET /types` — Rechercher dans le catalogue

Recherche de pièces, billets et exonumia.

| Paramètre | Type | Description |
|---|---|---|
| `q` | string | Texte de recherche |
| `issuer` | string | Code de l'émetteur (ex : `canada`, `france`) |
| `object_type` | int | ID du type d'objet |
| `catalogue` | int | ID d'un catalogue de référence |
| `number` | string | Numéro dans le catalogue (avec `catalogue`) |
| `ruler` | int | ID d'un souverain |
| `material` | int | ID d'un matériau |
| `year` | string | Année inscrite (ex : `"1302"`, `"1800-1850"`) |
| `date` | string | Année grégorienne d'émission |
| `size` | string | Diamètre en mm |
| `weight` | string | Poids en grammes |
| `page` | int | Page (défaut : 1) |
| `count` | int | Résultats par page (max : 50) |

**Réponse clé :** `count` (total), `types[]` avec `id`, `title`, `issuer`, `min_year`, `max_year`, `obverse_thumbnail`, `reverse_thumbnail`

### 2.2 `GET /types/{type_id}` — Détails d'un type

Retourne toutes les informations détaillées d'un type :

```json
{
  "id": 420,
  "url": "https://en.numista.com/420",
  "title": "5 Cents - Victoria",
  "issuer": { "code": "canada", "name": "Canada" },
  "min_year": 1858,
  "max_year": 1901,
  "ruler": [{ "id": 1774, "name": "Victoria" }],
  "value": {
    "text": "5 Cents",
    "numeric_value": 0.05,
    "currency": { "id": 44, "name": "Canadian dollar" }
  },
  "demonetization": { "is_demonetized": false },
  "shape": "Round",
  "composition": { "text": "Silver (.925)" },
  "technique": { "text": "Milled" },
  "weight": 1.167,
  "size": 15.494,
  "thickness": 0.7,
  "orientation": "coin",
  "obverse": { "engravers": [...], "description": "...", "lettering": "...", "picture": "..." },
  "reverse": { ... },
  "edge": { "description": "Reeded" },
  "mints": [{ "id": "17", "name": "Royal Mint (Tower Hill)" }],
  "tags": ["Crown", "Wreath"],
  "references": [{ "catalogue": { "id": 3, "code": "KM" }, "number": "2" }]
}
```

### 2.3 `GET /types/{type_id}/issues` — Émissions d'un type

Liste les différentes émissions (années, ateliers, variétés) :

```json
[
  {
    "id": 51757,
    "is_dated": true,
    "year": 1823,
    "gregorian_year": 1823,
    "mint_letter": "R",
    "mintage": 1700000,
    "references": [{ "catalogue": { "id": 3, "code": "KM" }, "number": "360.1" }],
    "comment": "Rio de Janeiro"
  }
]
```

### 2.4 `GET /types/{type_id}/issues/{issue_id}/prices` — Prix estimés

Estimation du prix par grade. **C'est l'endpoint le plus important pour évaluer un échange.**

| Paramètre | Type | Description |
|---|---|---|
| `currency` | string | Code ISO 4217 (défaut : `EUR`) |

**Grades disponibles :** `g` (Good), `vg` (Very Good), `f` (Fine), `vf` (Very Fine), `xf` (Extremely Fine), `au` (About Uncirculated), `unc` (Uncirculated)

```json
{
  "currency": "EUR",
  "prices": [
    { "grade": "f", "price": 180 },
    { "grade": "vf", "price": 220 },
    { "grade": "xf", "price": 380 }
  ]
}
```

### 2.5 `GET /issuers` — Liste des émetteurs

Retourne les ~4239 pays/territoires émetteurs avec codes, drapeaux et identifiants Wikidata.

### 2.6 `GET /mints` — Liste des ateliers de frappe

~4035 ateliers monétaires avec lieu, pays, années d'activité.

### 2.7 `GET /catalogues` — Catalogues de référence

~1268 catalogues (KM, Schön, etc.) avec auteur, éditeur, ISBN.

### 2.8 `POST /search_by_image` — Identification par image

Envoyer 1-2 images (base64, JPEG/PNG, max 1024×1024) pour identifier une pièce.

> **Fonctionnalité payante.** Feature expérimentale pour déterminer l'année et le grade automatiquement.

Retourne les types correspondants avec un `similarity_distance` (0-1, plus bas = plus similaire).

---

## 3. Endpoints utilisateur / collection

### 3.1 `GET /users/{user_id}` — Profil utilisateur

Retourne `username` et `avatar`.

### 3.2 `GET /users/{user_id}/collections` — Liste des collections

*Requiert OAuth scope `view_collection`*

Un utilisateur peut organiser ses items en plusieurs collections nommées.

### 3.3 `GET /users/{user_id}/collected_items` — Items possédés

*Requiert OAuth scope `view_collection`*

| Paramètre | Type | Description |
|---|---|---|
| `category` | string | `coin`, `banknote`, `exonumia` |
| `type` | int | ID du type |
| `collection` | int | ID d'une collection |

**Réponse :**
```json
{
  "item_count": 150,
  "item_for_swap_count": 23,
  "item_type_count": 120,
  "item_type_for_swap_count": 18,
  "items": [...]
}
```

Chaque item contient : type, issue, quantité, grade, for_swap, commentaires, prix d'achat, lieu de stockage, date d'acquisition, numéro de série, poids, taille, détails de gradation (NGC, PCGS, etc.).

### 3.4 `POST /users/{user_id}/collected_items` — Ajouter un item

*Requiert OAuth scope `edit_collection`*

### 3.5 `PATCH /users/{user_id}/collected_items/{item_id}` — Modifier un item

*Requiert OAuth scope `edit_collection`*

### 3.6 `DELETE /users/{user_id}/collected_items/{item_id}` — Supprimer un item

*Requiert OAuth scope `edit_collection`*

---

## 4. Littérature numismatique

### 4.1 `GET /publications/{id}` — Détails d'une publication

ID au format `L` + 6 chiffres (ex : `L106610`). Retourne livres, articles avec contributeurs, éditeurs, ISBN, liens de téléchargement.

---

## 5. Échelle de grades

| Code | Nom complet | Description |
|---|---|---|
| `g` | Good | Très usée, détails principaux visibles |
| `vg` | Very Good | Usée, détails secondaires visibles |
| `f` | Fine | Usure modérée, détails clairs |
| `vf` | Very Fine | Légère usure sur les points hauts |
| `xf` | Extremely Fine | Traces d'usure minimales |
| `au` | About Uncirculated | Quasi neuve, légère trace de manipulation |
| `unc` | Uncirculated | Aucune trace de circulation |

---

## 6. Limites et erreurs

| Code HTTP | Signification |
|---|---|
| 400 | Paramètre invalide ou manquant |
| 401 | Clé API invalide ou manquante |
| 403 | Endpoint non activé pour votre clé |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes simultanées ou quota mensuel atteint |

---

## 7. Projet : Évaluateur d'échanges Numista

### 7.1 Objectif

Créer un outil qui, à partir d'un échange Numista (ex : échange #926052 entre deux membres), calcule la **valeur totale de chaque côté** et fournit des **statistiques** pour déterminer si l'échange est équitable.

### 7.2 Données disponibles via l'API pour évaluer un échange

Pour chaque pièce dans un échange, on peut récupérer via l'API :

| Donnée | Endpoint | Utilité |
|---|---|---|
| Titre, émetteur, années | `GET /types/{id}` | Identification |
| Valeur faciale | `GET /types/{id}` → `value.numeric_value` | Contexte |
| Matériau, poids, taille | `GET /types/{id}` → `composition`, `weight`, `size` | Valeur intrinsèque (métaux précieux) |
| Tirage (mintage) | `GET /types/{id}/issues` | Rareté |
| **Prix estimé par grade** | `GET /types/{id}/issues/{issue_id}/prices` | **Valeur marchande** |
| Références catalogue (KM, etc.) | `GET /types/{id}` → `references` | Cross-référence |
| Démonétisation | `GET /types/{id}` → `demonetization` | Statut légal |
| Tags | `GET /types/{id}` → `tags` | Catégorisation |

### 7.3 Statistiques envisageables

- **Valeur totale par côté** : Somme des prix estimés (selon le grade de chaque pièce)
- **Différence de valeur** : Écart absolu et en pourcentage entre les deux côtés
- **Score d'équité** : Ratio valeur reçue / valeur donnée
- **Rareté moyenne** : Basée sur les tirages (mintage)
- **Diversité** : Nombre de pays/émetteurs différents par côté
- **Valeur intrinsèque** : Pour les pièces en métaux précieux (argent, or), calcul basé sur poids × pureté × cours du métal
- **Tendance des prix** : Si l'API fournit un historique (actuellement non disponible directement)

### 7.4 Limitation importante : pas d'endpoint « échange »

L'API Numista **ne fournit pas d'endpoint pour lire les détails d'un échange** (les pièces proposées de chaque côté). Il faudra donc :

1. **Option A** — Saisie manuelle : l'utilisateur entre les type_id + issue_id + grade de chaque pièce
2. **Option B** — Scraping de la page d'échange : parser le HTML de `https://fr.numista.com/echanges/echange.php?id=XXXXX`
3. **Option C** — Export XLS : Numista permet d'exporter la liste d'un échange en XLS, qu'on pourrait parser
4. **Option D** — Copier-coller : l'utilisateur colle la liste des pièces depuis la page web

### 7.5 Workflow proposé

```
1. Récupérer la liste des pièces de l'échange (saisie / scraping / XLS)
2. Pour chaque pièce :
   a. GET /types/{type_id} → infos de base
   b. GET /types/{type_id}/issues → trouver l'issue_id correspondant
   c. GET /types/{type_id}/issues/{issue_id}/prices?currency=CAD → prix par grade
3. Appliquer le grade estimé de chaque pièce
4. Calculer les totaux et statistiques
5. Afficher le rapport comparatif
```

### 7.6 Exemple concret

Pour l'échange #926052 entre **etangua** et **jonlepage** :

| Côté | Pièces | Valeur estimée |
|---|---|---|
| etangua envoie → | [liste des pièces] | à calculer |
| jonlepage envoie → | [liste des pièces] | à calculer |
| **Différence** | | X € / X CAD |

---

## 8. Fichier Swagger complet

Le fichier Swagger OpenAPI 3.0 complet est disponible localement :
`D:\Users\jonle\Downloads\swagger (1).yaml`

Il peut être importé dans Postman, Swagger UI, ou utilisé pour générer un client API automatiquement.
