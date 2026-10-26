# Plan d'implémentation : deux devises à la fois, et une mini-calculatrice

**Branche** : `003-deux-devises-calculatrice` · **Date** : 26/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

L'écran Convertir accepte une seconde devise, facultative, sous la paire : un
troisième champ lié, qui passe par la référence comme les deux autres, et sa
ligne de taux. Un champ de montant comprend un calcul simple, et un bouton
« Calculatrice » remplace le clavier du téléphone par un pavé qui écrit dans
le dernier champ touché.

## Contexte technique

| Point       | Choix                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Langage     | TypeScript ~6.0.3 strict                                                                       |
| Dépendances | aucune nouvelle : l'analyseur de calcul tient en quelques lignes (recherche R2)                |
| Stockage    | préférences en version 2, deux champs à valeur par défaut, sans migration (data-model)         |
| Réseau      | aucune requête de plus : la seconde paire se lit dans les relevés déjà chargés                 |
| Tests       | Vitest 5 + jsdom ; Playwright (`@critical`, `@a11y` avec axe) ; `pwa-doctor --strict` au build |
| Performance | quelques kilo-octets dans le morceau de l'écran Convertir, sous le budget de `package.json`    |
| Contraintes | la CSP refuse `unsafe-eval` : aucun `eval` ni `Function` (R2) ; 320 px ; fr et en              |

## Contrôle de la constitution

Contrôlé contre la version 2.0.0.

| Principe                       | Tenu par                                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Un montant juste et daté    | chaque paire a sa ligne, sa source et sa date ; aucun taux entre les deux devises (R1) ; un calcul n'est arrondi qu'à l'affichage, ou par « = » (R5)                                                                  |
| II. L'appareil d'abord         | les deux choix dans les préférences locales ; aucune requête de plus                                                                                                                                                  |
| III. Visuel, accessible, légal | inchangé : le volet et ses images restent ceux de la paire                                                                                                                                                            |
| IV. Lisible partout            | pavé nommé, touches nommées, bouton `aria-pressed` ; 320 px éprouvé ; trois champs sans défilement à 390 × 844 (CR-005) ; fr et en                                                                                    |
| V. Les tests d'abord           | analyseur, gestes du pavé, conversion à trois champs, préférences : chacun son test, vu rouge ; un e2e par récit, axe pavé ouvert                                                                                     |
| VI. Le socle avant le code     | `TextField` (son `hint` porte le résultat), `Button`, `Card`, `versioned-store` du socle ; aucune calculatrice dans le socle ni dans une autre app du parc : celle-ci reste ici tant qu'une seconde n'en a pas besoin |

**Écarts** : aucun.

## Structure

```text
specs/003-deux-devises-calculatrice/
├── spec.md
├── plan.md          # ce fichier
├── research.md      # R1 à R5
├── data-model.md
├── quickstart.md
└── tasks.md

src/
├── domain/
│   └── calcul.ts            # lire un calcul, gestes du pavé (nouveau)
├── app/
│   └── preferences.ts       # seconde devise, calculatrice
└── features/
    ├── convert/
    │   ├── conversion.ts    # trois champs, calcul, erreurs
    │   ├── ConvertScreen.tsx
    │   ├── RateLine.tsx     # variante de la seconde paire
    │   └── Pave.tsx         # le pavé (nouveau)
    └── history/
        └── HistoryScreen.tsx # un montant saisi dans la seconde devise
```

Pas de `contracts/` : la spécification n'ouvre aucune interface vers
l'extérieur.

## Livraison

Une seule pull request, un commit par phase : la spécification, le récit 1,
le récit 2. Les deux récits touchent le même écran et le même état de
conversion ; livrés séparément, le second réécrirait ce que le premier vient
de poser. La demande les veut ensemble.

## Phases

- **Phase 0, recherche** : [research.md](./research.md).
- **Phase 1, conception** : [data-model.md](./data-model.md),
  [quickstart.md](./quickstart.md).
- **Phase 2, tâches** : [tasks.md](./tasks.md).

## Suivi de la complexité

| Choix                                    | Pourquoi                                                         | Plus simple, écarté parce que                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| un analyseur écrit ici                   | quatre opérateurs, la lecture des nombres de la 001, sans `eval` | une bibliothèque : des dizaines de kilo-octets et sa propre lecture des nombres ; `eval` : refusé par la CSP |
| le pivot par la référence                | trois champs cohérents, chacun rattaché à un taux affiché        | un taux direct entre les deux devises : un taux de plus à afficher, et des champs qui se contrediraient (R1) |
| `inputMode="none"` plutôt que `readOnly` | le champ garde le focus, le curseur et le clavier physique       | `readOnly` : annoncé « lecture seule », et plus de saisie au clavier d'un ordinateur                         |
