# Tâches : deux devises à la fois, et une mini-calculatrice

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md).

Format : `- [ ] T000 [P] [Rn] description (fichiers)`. `[P]` : peut se faire en
parallèle (fichiers distincts, sans dépendance). `[Rn]` : récit de la
spécification. Chaque tâche de règle commence par son test, vu rouge
(constitution, principe V). Une seule pull request, un commit par phase (plan,
« Livraison »).

## Phase 1 : spécification

- [x] T001 Spécification, plan, recherche, modèle de données, démarrage rapide
      et tâches.

## Phase 2 : récit 1, deux devises à la fois (P1)

- [ ] T002 [P] [R1] Tests puis les préférences : `seconde` et ses gestes,
      échanges avec la devise et la référence, retrait en rouvrant une ligne
      du carnet, lecture d'une préférence d'avant (`src/app/preferences.ts`).
- [ ] T003 [P] [R1] Tests puis `deriver` à trois champs, par la référence,
      marge comprise (recherche R1 ; `src/features/convert/conversion.ts`).
- [ ] T004 [R1] L'écran : « Ajouter une devise », son choix et son retrait, le
      troisième champ, la seconde ligne de taux, l'enregistrement de la paire
      saisie (`ConvertScreen.tsx`, `RateLine.tsx`) ; tests d'écran.
- [ ] T005 [R1] L'historique compare un montant saisi dans la seconde devise
      par son équivalent en référence (`HistoryScreen.tsx`).
- [ ] T006 [R1] e2e `@critical` : scénarios 2 à 7 et 9, rechargement ; les
      parcours de la 001 et de la 002 inchangés (CR-001).
- [ ] T007 [R1] Messages fr et en.

## Phase 3 : récit 2, la mini-calculatrice (P2)

- [ ] T008 [P] [R2] Tests puis `src/domain/calcul.ts` : lecture d'un calcul,
      priorités, opérateur final, erreurs, gestes du pavé (recherche R2, R4).
- [ ] T009 [R2] Tests puis `deriver` comprend un calcul, rend `calcul` et
      `erreur` (`conversion.ts`).
- [ ] T010 [P] [R2] Tests puis la préférence `calculatrice`
      (`preferences.ts`).
- [ ] T011 [R2] Le pavé (`Pave.tsx`), le bouton « Calculatrice », la cible,
      `inputMode="none"`, le résultat sous le champ, « = » (`ConvertScreen.tsx`) ;
      tests d'écran.
- [ ] T012 [R2] e2e `@critical` : scénarios 2 à 4, 8 et 9, rechargement ; axe
      pavé ouvert dans les deux thèmes (CR-004).
- [ ] T013 [R2] Messages fr et en.

## Phase 4 : finitions

- [ ] T014 Vérification dans le navigateur : 320 px, 390 × 844 avec la seconde
      devise (CR-005), pavé ouvert, thèmes clair et sombre.
- [ ] T015 README (fonctionnalités) ; budget de poids et `pwa-doctor --strict`
      au build.

## Dépendances et ordre

- T002 et T003 avant T004 ; T004 avant T005 et T006.
- T008 avant T009 ; T009 et T010 avant T011 ; T011 avant T012.
- La phase 3 suit la phase 2 : le pavé écrit aussi dans le champ de la seconde
  devise.
