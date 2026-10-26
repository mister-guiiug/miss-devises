# Plan d'implémentation : les mots utiles du pays

**Branche** : `004-mots-utiles` · **Date** : 26/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

Un jeu de seize phrases par langue, dans 27 langues, couvre les 41 devises
illustrées. Il est livré avec l'application et chargé à l'ouverture d'une
feuille « Mots utiles », que l'écran Convertir propose à côté des billets.
Le sens de chaque phrase vient des messages de l'application, en français ou
en anglais.

## Contexte technique

| Point       | Choix                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Langage     | TypeScript ~6.0.3 strict                                                                                                                                                         |
| Dépendances | aucune nouvelle ; noms de langue par `Intl.DisplayNames`                                                                                                                         |
| Données     | `src/data/phrases.json` (schéma Zod, comme `coupures.json`) : catégories et langues ; `src/data/langues.ts` : les langues de chaque devise, lues par l'écran sans charger le jeu |
| Réseau      | aucun (EF-005)                                                                                                                                                                   |
| Tests       | Vitest 5 + jsdom ; Playwright (`@critical`, `@a11y` avec axe) ; `pwa-doctor --strict` au build                                                                                   |
| Performance | le jeu (9,1 kB gzip) est un morceau à part, chargé avec la feuille et préchargé au repos, comme le volet                                                                         |

## Contrôle de la constitution

Contrôlé contre la version 2.0.0.

| Principe                       | Tenu par                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| I. Un montant juste et daté    | sans objet : aucun montant ni taux                                                                           |
| II. L'appareil d'abord         | phrases livrées avec l'application ; aucune requête                                                          |
| III. Visuel, accessible, légal | aucune image ; phrases rédigées ici, relues contre des guides libres (hypothèse de la spécification)         |
| IV. Lisible partout            | `lang` et `dir` sur chaque phrase ; sens en fr et en ; 320 px éprouvé ; axe dans les deux thèmes             |
| V. Les tests d'abord           | intégrité du jeu, choix des langues, feuille : chacun son test, vu rouge ; un e2e et l'audit axe             |
| VI. Le socle avant le code     | `Sheet`, `SegmentedControl`, `Button`, `useIdlePrefetch` du socle ; aucun guide de conversation dans le parc |

**Écarts** : aucun.

## Structure

```text
specs/004-mots-utiles/
├── spec.md
├── plan.md          # ce fichier
├── research.md      # R1 à R4
├── data-model.md
├── phrases.md       # couverture et relecture du jeu
├── quickstart.md
└── tasks.md

src/
├── data/
│   ├── phrases.json         # le jeu (nouveau)
│   ├── phrases.ts           # son schéma (nouveau)
│   └── langues.ts           # les langues de chaque devise (nouveau)
└── features/
    ├── convert/ConvertScreen.tsx   # le bouton « Mots utiles »
    └── phrases/MotsUtiles.tsx      # la feuille (nouveau)
```

Pas de `contracts/` : aucune interface vers l'extérieur.

## Livraison

Une pull request : la spécification, le jeu et sa relecture, la feuille.

## Phases

- **Phase 0, recherche** : [research.md](./research.md).
- **Phase 1, conception** : [data-model.md](./data-model.md),
  [quickstart.md](./quickstart.md).
- **Phase 2, tâches** : [tasks.md](./tasks.md).

## Suivi de la complexité

| Choix                              | Pourquoi                                                                  | Plus simple, écarté parce que                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| un jeu rédigé ici et relu          | seize phrases ciblées (marchander, la monnaie, l'addition), hors ligne    | reprendre les guides de Wikivoyage : des centaines de phrases sans rapport avec l'argent, et la licence CC BY-SA |
| trois variétés d'arabe             | « combien ? » se dit « bikam da? » au Caire, « bshhal hada? » à Marrakech | un seul arabe standard : compris, mais pas ce qu'on entend au marché                                             |
| le sens dans les messages de l'app | il suit la langue de l'application sans dupliquer le jeu                  | un sens par langue dans le jeu : 27 × 16 traductions de plus, à tenir à jour                                     |
