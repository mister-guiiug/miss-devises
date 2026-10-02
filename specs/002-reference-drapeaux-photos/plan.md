# Plan d'implémentation : monnaie de référence, drapeaux, photos et À propos

**Branche** : `002-reference-drapeaux-photos` · **Date** : 02/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

L'euro cesse d'être câblé : une monnaie de référence, l'euro par défaut, se
règle dans les réglages, et chaque taux devient un taux croisé calculé sur
l'instantané d'une seule source. Chaque devise montre son drapeau, livré avec
l'application. Le volet des billets et des pièces peut, à la demande, montrer
des photos libres de Wikimedia Commons à la place des dessins. La page À propos
est recomposée, et l'historique gagne son propre choix de devise et une courbe
qui se lit point par point.

## Contexte technique

| Point       | Choix                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Langage     | TypeScript ~6.0.3 strict                                                                                                                       |
| Dépendances | celles de la 001 ; s'ajoute `country-flag-icons` (MIT), dont seuls les fichiers SVG des drapeaux utilisés sont émis par Vite                   |
| Stockage    | préférences en version 2 et carnet en version 2 (`versioned-store`, migrations de la version 1) ; IndexedDB inchangée, plus un ménage          |
| Réseau      | sources de taux inchangées ; en mode photos seulement, les vignettes de Wikimedia Commons (`img-src`)                                          |
| Tests       | Vitest 5 + jsdom ; Playwright (`@critical`, `@a11y` avec axe) ; `pwa-doctor --strict` au build                                                 |
| Performance | drapeaux et photos hors du JavaScript : ni `totalGzipKb` ni `preloadGzipKb` ne les comptent ; le jeu des photos est un morceau chargé au volet |
| Contraintes | une photo n'est demandée qu'en mode photos ; aucun drapeau n'est lu chez un tiers ; la CSP n'ouvre que l'hôte des vignettes                    |

## Contrôle de la constitution

Contrôlé contre la version 2.0.0, amendée par la même série de pull requests
(principes II et III, contrainte de confidentialité).

| Principe                       | Tenu par                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I. Un montant juste et daté    | un taux croisé se calcule sur UN instantané (une source, une date), sans arrondi ; la ligne de taux dit toujours sa source et sa date                                                |
| II. L'appareil d'abord         | référence et mode d'image dans les préférences locales ; le carnet garde la référence ; drapeaux livrés avec l'app ; les photos sont des données publiques lues à la demande         |
| III. Visuel, accessible, légal | dessins par défaut ; une photo seulement si elle est libre ou permise, recto, réduite, créditée ; drapeaux décoratifs (le code et le nom sont écrits) ; photo nommée comme le dessin |
| IV. Lisible partout            | drapeaux cerclés d'un liseré visible dans les deux thèmes ; 320 px éprouvés pour chaque écran touché ; fr et en                                                                      |
| V. Les tests d'abord           | taux croisé, migrations, correspondance devise → pays, jeu des photos et ménage du cache : chacun son test, vu rouge ; e2e par récit                                                 |
| VI. Le socle avant le code     | `FamilyAbout`, `AppVersion`, `Sheet`, `SegmentedControl`, `idb` et `versioned-store` du socle ; rien n'y est recopié                                                                 |

**Écarts** : aucun avec la version 2.0.0. Avec la version 1.0.0, le récit 3 en
était un (principe III : « aucune reproduction ») ; il est levé par
l'amendement plutôt que contourné (voir « Suivi de la complexité »).

## Structure

```text
specs/002-reference-drapeaux-photos/
├── spec.md
├── plan.md          # ce fichier
├── research.md      # R1 à R8
├── data-model.md    # préférences v2, carnet v2, photo, drapeau
├── contracts/
│   └── photos-commons.md
├── photos.md        # couverture et méthode du relevé des photos
├── quickstart.md
└── tasks.md

src/
├── domain/
│   ├── reference.ts     # taux croisé, source d'une paire (nouveau)
│   ├── drapeaux.ts      # devise → pays, ou signe neutre (nouveau)
│   └── carnet.ts        # devise étrangère et totaux par paire
├── data/
│   ├── photos.json      # les fichiers Commons par coupure (nouveau)
│   └── photos.ts        # son schéma et son chargement (nouveau)
├── rates/               # séries d'une paire, ménage du cache
├── features/
│   ├── convert/         # champs de la référence, drapeau du bouton
│   ├── money/           # rangée « Vraies photos », crédits
│   ├── history/         # choix de devise, axes, curseur
│   ├── carnet/          # référence de chaque ligne
│   ├── settings/        # choix de la référence
│   └── about/           # recomposée
└── ui/
    └── Drapeau.tsx      # le drapeau d'une devise (nouveau)
```

## Livraison

Une pull request par étape, dans cet ordre, chacune verte et déployable seule :

1. la spécification, le plan, les tâches et l'amendement de la constitution ;
2. récit 4, À propos ;
3. récit 2, les drapeaux ;
4. récit 1, la monnaie de référence ;
5. récit 5, l'historique ;
6. récit 3, les photos.

Les drapeaux passent avant la référence : le choix de la référence, dans les
réglages, se fait déjà avec eux. Les photos passent en dernier : leur relevé
sur Commons, devise par devise, est le plus long.

## Phases

- **Phase 0, recherche** : [research.md](./research.md).
- **Phase 1, conception** : [data-model.md](./data-model.md),
  [contracts/](./contracts/), [quickstart.md](./quickstart.md).
- **Phase 2, tâches** : [tasks.md](./tasks.md).

## Suivi de la complexité

| Choix                                   | Pourquoi                                                                                                 | Plus simple, écarté parce que                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amender la constitution                 | le principe III interdisait toute image ; la demande en veut, libres                                     | une exception écrite dans ce plan : un principe qui cède à chaque demande ne protège plus rien, et le suivant lirait encore « aucune reproduction »             |
| des drapeaux en fichiers SVG émis       | 170 drapeaux, 100 ko bruts : en fichiers, ils ne pèsent ni sur le JavaScript ni sur le premier rendu     | les emoji de drapeaux : Windows ne les dessine pas (lettres seules, mesuré) ; les drapeaux en chaînes dans le JS : 27 ko gzip, plus que la marge du budget (23) |
| un jeu de photos relevé et vérifié      | le nom exact du fichier, sa licence et son auteur sont connus avant la pull request et relus             | interroger Commons à l'exécution : un appel d'API de plus par coupure, des résultats qui changent sans relecture, et la devise envoyée à un tiers               |
| migrations des préférences et du carnet | `sensVolet: 'euro'` et un carnet sans référence existent sur les appareils ; les fichiers exportés aussi | des champs facultatifs sans migration : chaque lecture devrait deviner ce qu'une absence veut dire, et l'import d'un ancien fichier resterait flou              |
