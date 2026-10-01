# Modèle de données

Chaque entité persistée est décrite par un schéma zod dont le type est dérivé
(ADR 0002 du squelette) : le schéma type le code et valide ce qui remonte du
stockage ou du réseau.

## Devise (catalogue, en lecture seule)

| Champ       | Type                   | Règle                                              |
| ----------- | ---------------------- | -------------------------------------------------- |
| `code`      | chaîne de 3 majuscules | ISO 4217                                           |
| `nomFr`     | chaîne                 | du jeu de données, sinon `Intl.DisplayNames('fr')` |
| `nomEn`     | chaîne                 | du jeu de données, sinon `Intl.DisplayNames('en')` |
| `symbole`   | chaîne                 | facultatif                                         |
| `decimales` | entier ≥ 0             | doit égaler celles d'`Intl` (test)                 |
| `billets`   | liste de `Billet`      | triée par valeur croissante, sans doublon          |
| `pieces`    | liste de `Piece`       | triée par valeur croissante, sans doublon          |
| `sources`   | liste d'URL            | au moins une                                       |

**Billet** : `valeur` (> 0, dans l'unité principale), `couleur` (`#rrggbb`),
`largeurMm` et `hauteurMm` (facultatifs, ensemble), `plusEmis` (booléen,
facultatif).

**Pièce** : `valeur` (> 0), `metal` (`cuivre` · `laiton` · `argent` ·
`bimetal-or-argent` · `bimetal-argent-or` · `autre`), `diametreMm`
(facultatif).

Source : `src/data/coupures.json`, daté (`releveLe`), une entrée par devise
illustrée.

## Taux (instantané d'une source)

| Champ    | Type                  | Règle                                       |
| -------- | --------------------- | ------------------------------------------- |
| `source` | `'bce'` · `'marche'`  |                                             |
| `date`   | `AAAA-MM-JJ`          | date de publication du taux, pas de lecture |
| `taux`   | table `code → nombre` | unités de la devise pour un euro, > 0, fini |
| `luLe`   | horodatage ISO        | quand l'appareil l'a lu                     |

**État dérivé** `fraicheur` : `frais` (≤ 3 jours), `ancien` (> 3 jours),
`absent` (aucun taux connu).

## Série historique

| Champ     | Type                      | Règle                         |
| --------- | ------------------------- | ----------------------------- |
| `code`    | ISO 4217                  |                               |
| `source`  | `'bce'` · `'marche'`      | celle de la devise            |
| `periode` | `'1M'` · `'6M'` · `'1A'`  |                               |
| `points`  | liste de `{ date, taux }` | triée par date, dates uniques |

Gardée en IndexedDB : `serie:bce:<code>:<début>:<fin>` pour la BCE ; pour le
marché, chaque date est un fichier complet (`jour:<date>`), partagé entre
périodes et entre devises.

## Conversion enregistrée (carnet)

| Champ      | Type                       | Règle                                      |
| ---------- | -------------------------- | ------------------------------------------ |
| `id`       | chaîne                     | unique                                     |
| `libelle`  | chaîne, 1 à 120 caractères | par défaut : « 200 EGP → EUR »             |
| `de`       | `{ code, montant }`        | montant > 0                                |
| `vers`     | `{ code, montant }`        | l'une des deux devises est l'euro          |
| `taux`     | nombre > 0                 | unités de la devise étrangère pour un euro |
| `source`   | `'bce'` · `'marche'`       |                                            |
| `dateTaux` | `AAAA-MM-JJ`               |                                            |
| `creeeLe`  | horodatage ISO             |                                            |

Transitions : créée → libellé modifié → supprimée (annulable quelques
secondes, puis définitive). Persistée par `versioned-store` sous la clé
`miss-devises:carnet`, version 1, enveloppe `{ v, data }` ; l'export partage
cette enveloppe.

## Préférences

| Champ       | Type                     | Règle                              |
| ----------- | ------------------------ | ---------------------------------- |
| `devise`    | ISO 4217                 | dernière choisie, EGP par défaut   |
| `recentes`  | liste d'ISO 4217         | 6 au plus, la plus récente en tête |
| `sensVolet` | `'devise'` · `'euro'`    | ce que montre le volet             |
| `periode`   | `'1M'` · `'6M'` · `'1A'` | dernière période d'historique      |

Clé `miss-devises:preferences`, version 1.
