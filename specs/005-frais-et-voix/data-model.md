# Modèle de données : les frais d'une conversion, et les phrases parlées

## Préférences (`miss-devises:preferences`, version 2 inchangée)

Deux champs, avec une valeur par défaut, sans migration :

| Champ          | Type                      | Défaut | Règle                               |
| -------------- | ------------------------- | ------ | ----------------------------------- |
| `frais`        | liste de frais, 6 au plus | `[]`   | identifiants uniques                |
| `fraisChoisis` | identifiant ou `null`     | `null` | un identifiant de `frais`, ou aucun |

Un frais :

| Champ         | Type          | Règle                                 |
| ------------- | ------------- | ------------------------------------- |
| `id`          | chaîne        | unique                                |
| `libelle`     | chaîne        | 1 à 40 caractères                     |
| `pourcentage` | nombre        | 0 à 100                               |
| `fixe`        | nombre        | ≥ 0 ; `pourcentage` ou `fixe` non nul |
| `deviseFixe`  | code ISO 4217 | la devise du montant fixe             |

Gestes : `ajouterFrais`, `modifierFrais`, `supprimerFrais` (supprimer les frais
choisis remet `fraisChoisis` à `null`), `choisirFrais`.

## Coût frais compris (`src/domain/frais.ts`)

`coutAvecFrais(montantReference, frais, fixeEnReference)` rend
`{ frais, total }`, sans arrondi ; `fixeEnReference` vaut `null` sans taux pour
la devise du montant fixe, et le coût n'est alors pas calculé.

## Voix

Aucun état persistant : la voix se choisit à chaque lecture parmi celles de
l'appareil.
