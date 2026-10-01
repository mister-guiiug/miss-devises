# Plan d'implémentation : convertisseur de devises visuel

**Branche** : `001-convertisseur-visuel` · **Date** : 01/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

Une PWA hors ligne qui convertit entre l'euro et une devise, dans les deux
sens, à chaque frappe. Les taux viennent de deux sources gratuites et sans
clé : la BCE (via Frankfurter) pour les 29 devises qu'elle publie, un agrégat
de marché (fawazahmed0/currency-api) pour les autres, EGP compris. Un volet
dessine les billets et les pièces de 41 devises de voyage, en formes
stylisées, avec leur contre-valeur ; un écran d'historique compare le montant
d'aujourd'hui à celui du début de la période ; un carnet garde les
conversions annotées, sur l'appareil.

## Contexte technique

| Point       | Choix                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Langage     | TypeScript ~6.0.3 strict, cible ES2025                                                                                                                                                                  |
| Dépendances | React 19, react-router-dom 7, Zustand, Zod 4, lucide-react, `@mister-guiiug/dev-pwa-config` 6.21 (AppShell, Sheet, Stat, Sparkline et géométrie `sparkline`, toast, `format`, `idb`, `versioned-store`) |
| Stockage    | carnet et préférences : `versioned-store` (localStorage), derrière un port ; taux et historiques : `idb` du socle (IndexedDB)                                                                           |
| Tests       | Vitest 5 + jsdom (règles, magasins, composants) ; Playwright (parcours `@critical`, `@a11y` avec axe) ; `pwa-doctor --strict` au build                                                                  |
| Plate-forme | PWA sur GitHub Pages, installable, hors ligne                                                                                                                                                           |
| Type        | application web unique                                                                                                                                                                                  |
| Performance | contre-valeur en moins de 100 ms ; poids sous `totalGzipKb` 288, `preloadGzipKb` 175                                                                                                                    |
| Contraintes | sources sans clé et ouvertes en CORS ; `connect-src` de la CSP limité à ces origines ; aucun secret                                                                                                     |
| Échelle     | 41 devises illustrées ; toutes les devises ISO 4217 que fournit la source de marché sont convertibles                                                                                                   |

## Contrôle de la constitution

| Principe                       | Tenu par                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| I. Un montant juste et daté    | la source et la date accompagnent chaque taux ; arrondi à l'affichage seulement, aux décimales que donne `Intl` ; pas de taux inventé |
| II. L'appareil d'abord         | carnet et préférences en local, export et import ; taux et séries gardés en IndexedDB                                                 |
| III. Visuel, accessible, légal | billets et pièces en SVG stylisés, chacun avec son libellé accessible ; aucune image de billet                                        |
| IV. Lisible partout            | couleur du texte d'un billet choisie par contraste ; mise en page éprouvée en 320 et 390 × 664 ; fr et en                             |
| V. Les tests d'abord           | chaque tâche de règle commence par son test ; parcours e2e par récit                                                                  |
| VI. Le socle avant le code     | formats, graphique, feuille, toast, stockage et coquille viennent du socle ; rien n'y est recopié                                     |

**Écarts** : aucun. Deux choix demandent pourtant d'être dits (voir « Suivi de
la complexité »).

## Structure

```text
specs/001-convertisseur-visuel/
├── spec.md          # quoi et pourquoi
├── plan.md          # ce fichier
├── research.md      # décisions techniques et alternatives écartées
├── data-model.md    # entités, validations, clés de stockage
├── contracts/       # sources de taux et ports
├── quickstart.md    # lancer et valider les scénarios
└── tasks.md         # tâches ordonnées

src/
├── domain/          # règles pures, sans React ni réseau
│   ├── money.ts         # lecture d'une saisie, décimales, arrondi
│   ├── convert.ts       # euro ↔ devise
│   ├── decompose.ts     # montant → billets et pièces
│   ├── history.ts       # extrêmes, variation, comparaison à une date
│   └── currencies.ts    # catalogue : jeu de coupures + noms Intl
├── data/
│   └── coupures.json    # 41 devises, daté et sourcé
├── rates/           # accès aux taux
│   ├── sources.ts       # Frankfurter et fawazahmed0, schémas zod
│   ├── service.ts       # choix de la source, dernier taux, séries
│   ├── cache.ts         # IndexedDB (idb du socle)
│   └── store.ts         # état vivant (Zustand)
├── backend/         # port `conversions` et son adaptateur local
├── features/
│   ├── convert/         # écran principal : deux champs, échange, libellé
│   ├── money/           # volet billets et pièces, dessins SVG
│   ├── history/         # courbe, extrêmes, comparaison
│   ├── carnet/          # conversions enregistrées, totaux
│   ├── settings/        # du squelette : thème, langue, export, import
│   └── about/           # du squelette : sources, mentions, famille
└── i18n/            # messages fr et en
```

**Retiré du squelette** : l'exemple des notes, la couche Supabase (adaptateur,
file hors ligne, migrations, tests pgTAP, trois workflows) et l'écran de compte.
L'application ne connaît pas de compte (EF-014) ; garder ces couches
reviendrait à livrer, construire et tester du code que rien n'appelle.

## Phases

- **Phase 0, recherche** : [research.md](./research.md).
- **Phase 1, conception** : [data-model.md](./data-model.md),
  [contracts/](./contracts/), [quickstart.md](./quickstart.md).
- **Phase 2, tâches** : [tasks.md](./tasks.md).

## Suivi de la complexité

| Choix                | Pourquoi                                                                                                     | Plus simple, écarté parce que                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| deux sources de taux | la BCE ne publie pas l'EGP, exemple même de la demande ; la source de marché n'a pas de série en une requête | une source unique : la BCE seule perd EGP et une centaine d'autres ; le marché seul coûte jusqu'à 27 requêtes par année d'historique |
| un cache IndexedDB   | les séries pèsent trop pour `localStorage` et doivent survivre hors ligne                                    | le seul cache du service worker : il ne sait pas dire « taux du 30/09 » ni servir une série partielle                                |
