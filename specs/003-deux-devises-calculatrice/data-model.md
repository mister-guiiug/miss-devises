# Modèle de données : deux devises à la fois, et une mini-calculatrice

## Préférences (`miss-devises:preferences`, version 2 inchangée)

Deux champs s'ajoutent, chacun avec une valeur par défaut : une préférence
écrite avant eux se lit sans seconde devise et calculatrice éteinte, sans
migration (comme `epinglees`, `marge` et `decimales`).

| Champ          | Type               | Défaut  | Règle                                                  |
| -------------- | ------------------ | ------- | ------------------------------------------------------ |
| `seconde`      | code ISO ou `null` | `null`  | jamais `reference` ni `devise` (EF-002)                |
| `calculatrice` | booléen            | `false` | le pavé est affiché et retient le clavier du téléphone |

Gestes :

- `choisirSeconde(code)` : pose la seconde devise et l'ajoute aux récentes ;
  refusé si c'est la référence ou la devise.
- `retirerSeconde()` : `seconde = null`.
- `choisirDevise(code)` : si `code` est la seconde devise, la devise d'avant
  devient la seconde (échange).
- `choisirReference(code)` : si `code` est la seconde devise, la référence
  d'avant devient la seconde (échange) ; l'échange avec la devise (002, EF-004)
  reste.
- `poserPaire(reference, devise)` (une ligne du carnet rouverte) : si la seconde
  devise est l'une des deux, elle se retire.
- `basculerCalculatrice()`.

## Saisie (état vivant, non persisté)

| Champ   | Type                                   | Changement                           |
| ------- | -------------------------------------- | ------------------------------------ |
| `champ` | `'devise' \| 'reference' \| 'seconde'` | `'seconde'` s'ajoute                 |
| `texte` | chaîne                                 | peut être un calcul (« 12,5 + 7,5 ») |

`haut` (le champ du haut, que l'inversion échange) reste `'devise'` ou
`'reference'` : la seconde devise a sa place, sous la paire.

## Conversion dérivée (`deriver`)

S'ajoutent `montantSeconde` et `texteSeconde` (vides sans seconde devise ou
sans son taux), `calcul` (le texte saisi est un calcul) et `erreur`
(`'illisible' | 'division' | 'negatif'`, ou rien). `invalide` reste, vrai dès
qu'il y a une erreur.

## Carnet (inchangé)

Une saisie dans la seconde devise s'enregistre comme une paire (seconde devise,
référence) : `de` = la seconde devise et son montant, `vers` = la référence,
`taux`, `source` et `dateTaux` de cette paire. Rouverte, la ligne pose cette
paire comme paire principale (`poserPaire`).
