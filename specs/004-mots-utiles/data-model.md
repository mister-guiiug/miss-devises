# Modèle de données : les mots utiles du pays

## Le jeu (`src/data/phrases.json`)

| Champ        | Type                          | Règle                                               |
| ------------ | ----------------------------- | --------------------------------------------------- |
| `releveLe`   | date `AAAA-MM-JJ`             | jour de la rédaction ou de la dernière relecture    |
| `categories` | groupe → liste d'identifiants | quatre groupes, seize identifiants, chacun une fois |
| `langues`    | code BCP 47 → langue          | 27 langues                                          |

Une langue :

| Champ       | Type                 | Règle                  |
| ----------- | -------------------- | ---------------------- |
| `direction` | `'rtl'`, facultatif  | arabe et hébreu        |
| `phrases`   | identifiant → phrase | les seize identifiants |

Une phrase : `texte` (dans l'écriture de la langue), `latin` (transcription,
obligatoire pour une écriture non latine, absente sinon).

Le schéma est vérifié par Zod dans les tests, comme `coupures.json`.

## Les langues des devises (`src/data/langues.ts`)

Code ISO 4217 → liste ordonnée de codes BCP 47, la langue du marché d'abord,
pour les 41 devises illustrées. À part du jeu : l'écran Convertir la lit pour
décider d'afficher le bouton, sans charger les phrases. Chaque code est une
langue du jeu (vérifié par les tests).

## Les messages de l'application

`phrases.sens.<id>` en français et en anglais ; `phrases.groupes.<groupe>` ;
les libellés de la feuille. Les noms de langue viennent
d'`Intl.DisplayNames`, dans la langue de l'application (« arabe (Égypte) »).

## Aucun état persistant

La langue choisie dans la feuille n'est pas gardée : elle suit la devise, et
la première langue de la devise revient à chaque ouverture.
