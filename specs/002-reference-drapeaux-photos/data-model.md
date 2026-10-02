# Modèle de données

Ce qui change depuis la [spécification 001](../001-convertisseur-visuel/data-model.md).
Chaque entité reste décrite par un schéma zod dont le type est dérivé.

## Préférences (version 2)

| Champ       | Type                       | Règle                                                   |
| ----------- | -------------------------- | ------------------------------------------------------- |
| `reference` | ISO 4217                   | nouveau ; EUR par défaut ; jamais égale à `devise`      |
| `devise`    | ISO 4217                   | dernière choisie, EGP par défaut                        |
| `recentes`  | liste d'ISO 4217           | 6 au plus, la plus récente en tête                      |
| `sensVolet` | `'devise'` · `'reference'` | `'euro'` de la version 1 devient `'reference'`          |
| `periode`   | `'1M'` · `'6M'` · `'1A'`   | dernière période d'historique                           |
| `images`    | `'dessins'` · `'photos'`   | nouveau, récit 3 ; `'dessins'` par défaut, sans version |

Clé `miss-devises:preferences`, version 2. Migration 1 → 2 : `reference` vaut
`'EUR'`, `sensVolet: 'euro'` devient `'reference'`.

**Changer de référence** : si la nouvelle référence est la devise affichée, la
devise devient l'ancienne référence.

## Conversion enregistrée (version 2)

| Champ       | Type                 | Règle                                                  |
| ----------- | -------------------- | ------------------------------------------------------ |
| `reference` | ISO 4217             | nouveau ; égale au code de `de` ou de `vers`           |
| `de`        | `{ code, montant }`  | montant > 0                                            |
| `vers`      | `{ code, montant }`  | code différent de celui de `de`                        |
| `taux`      | nombre > 0           | unités de l'autre devise pour une unité de `reference` |
| `source`    | `'bce'` · `'marche'` | celle de la paire (recherche R1)                       |
| `dateTaux`  | `AAAA-MM-JJ`         |                                                        |
| `creeeLe`   | horodatage ISO       |                                                        |
| `libelle`   | 1 à 120 caractères   | par défaut : « 200,00 EGP → CHF »                      |

Clé `miss-devises:carnet`, version 2. Migration 1 → 2 : `reference` vaut
`'EUR'` (en version 1, l'euro était toujours l'un des deux côtés, et `taux`
était déjà en unités de la devise pour un euro). L'import d'un fichier de
version 1 passe par la même migration.

**Totaux** : par paire (devise étrangère, référence), dans l'ordre de première
apparition ; chaque ligne apporte ses deux montants tels qu'enregistrés.

## Drapeau

Calculé, jamais stocké : `paysDe(code)` rend le code ISO 3166 du pays dont le
drapeau représente la devise, ou rien.

| Devise                   | Pays             |
| ------------------------ | ---------------- |
| EUR                      | EU               |
| commençant par X, et ANG | aucun (neutre)   |
| toute autre              | ses deux lettres |

Les fichiers des drapeaux viennent de `country-flag-icons/3x2/<PAYS>.svg`.

## Photo d'une coupure (récit 3)

| Champ      | Type            | Règle                                                          |
| ---------- | --------------- | -------------------------------------------------------------- |
| `valeur`   | nombre > 0      | une coupure de `coupures.json`, une photo au plus              |
| `fichier`  | chaîne          | nom du fichier sur Commons, sans « File: »                     |
| `vignette` | URL             | telle que l'API la rend, sur `thumb` ou `upload.wikimedia.org` |
| `largeur`  | entier > 0      | de l'original : son sens et ses proportions                    |
| `hauteur`  | entier > 0      | de l'original                                                  |
| `auteur`   | chaîne non vide | le champ « Artist » de Commons, en texte                       |
| `licence`  | chaîne non vide | le nom court de la licence ou de la permission                 |

Source : `src/data/photos.json`, daté (`releveLe`), une entrée par devise
photographiée, billets et pièces triés par valeur. Chargé au premier passage en
mode photos, en morceau à part. Voir [photos.md](./photos.md) et
[contracts/photos-commons.md](./contracts/photos-commons.md).

## Clés IndexedDB

Inchangées (001, R8). S'ajoute le ménage du démarrage (recherche R8) : les
`serie:bce:*` dont la fin n'est pas aujourd'hui, et les `jour:<date>` de plus
de 400 jours, sont effacées.
