# Plan d'implémentation : dire le prix, annoncer le montant, raccourcis et poids

**Branche** : `006-prix-annonce-raccourcis-poids` · **Date** : 26/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

La feuille des mots utiles écrit, dit et montre le montant en cours dans la
langue du vendeur. L'écran Convertir annonce les montants calculés à la fin
d'une saisie. Le manifeste déclare trois raccourcis, dont `?mots`, qui ouvre la
feuille. Les écrans autres que Convertir deviennent des morceaux préchargés au
repos.

## Contexte technique

| Point       | Choix                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| Langage     | TypeScript ~6.0.3 strict                                                                   |
| Dépendances | aucune nouvelle ; `Intl.NumberFormat` (`currencyDisplay: 'name'`), `speechSynthesis`       |
| Manifeste   | `shortcuts` de `pwaBaseOptions` (socle), URL relatives à la base                           |
| Routes      | `lazy()` + `useIdlePrefetch` (socle) + `<Suspense key={pathname}>`                         |
| Tests       | Vitest 5 + jsdom (minuteries simulées pour l'annonce) ; Playwright ; `pwa-doctor --strict` |

## Contrôle de la constitution

| Principe                    | Tenu par                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| I. Un montant juste et daté | le montant dit est celui de l'écran, arrondi à l'affichage aux décimales de la devise (un entier sans décimales) |
| II. L'appareil d'abord      | aucune requête ; les morceaux d'écran sont précachés comme le reste                                              |
| IV. Lisible partout         | annonce `aria-live="polite"` à la fin d'une saisie ; montant porté par `lang` ; axe                              |
| V. Les tests d'abord        | montant dans la langue, annonce, raccourci `?mots`, routes paresseuses : chacun son test, vu rouge               |
| VI. Le socle avant le code  | `pwaBaseOptions({ shortcuts })`, `useIdlePrefetch` du socle                                                      |

**Écarts** : aucun.

## Décisions

- **R1, le montant dans la langue** : `formatCurrency(montant, langue, devise,
{ currencyDisplay: 'name' })` ; aucune décimale pour un entier, celles de
  la devise sinon. La devise est celle dont la langue est relevée
  (`LANGUES_DES_DEVISES`), la devise d'abord, puis la seconde.
- **R2, l'annonce** : une région masquée `aria-live="polite"`, mise à jour
  800 ms après le dernier changement des montants calculés ; les montants sont
  nommés dans la langue de l'application (`nommerMontant`).
- **R3, `?mots`** : lu au montage de l'écran Convertir ; la feuille s'ouvre si
  une langue est proposée, puis le paramètre est retiré par `replace`.
- **R4, le poids** : historique, carnet, réglages et À propos en `lazy()`, avec
  des fonctions de chargement nommées, partagées avec `useIdlePrefetch` ; le
  refus `nav-attente` de `package.json`, devenu faux, est retiré.

## Mesure (R4)

Build local du 26/10/2026, `pwa-bundle-budget` (gzip, sauf mention) :

| Mesure                    | Avant | Quatre morceaux | Un morceau (retenu) |
| ------------------------- | ----- | --------------- | ------------------- |
| Morceau principal         | 189,3 | 124,4           | 124,8               |
| Morceau principal, brut   | 609   | 396             | 398                 |
| Préchargé                 | 199,8 | 190,4           | 189,5               |
| JavaScript brut au départ | 609   | 559             | 569                 |
| Total                     | 273,2 | 280,8           | 277,5               |

Le découpage coûte : chaque morceau se compresse seul et porte son enveloppe,
et le moteur sépare React dans un morceau commun, préchargé lui aussi. Quatre
écrans en quatre morceaux ajoutaient 7,6 kB au total ; regroupés en un seul
(`src/ecrans.ts`), 4,3 kB. Le gain est au démarrage (10,3 kB de moins à
précharger, 40 kB de moins à analyser) ; le total, téléchargé au repos peu
après, augmente. Les budgets se reposent sur la mesure de la CI.

## Livraison

Une pull request, un commit par récit.
