# Tâches : les frais d'une conversion, et les phrases parlées

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md).

Format : `- [ ] T000 [P] [Rn] description (fichiers)`. Chaque tâche de règle
commence par son test, vu rouge (constitution, principe V).

## Phase 1 : spécification

- [x] T001 Spécification, plan, recherche, modèle de données, démarrage rapide
      et tâches.

## Phase 2 : récit 1, les frais (P1)

- [x] T002 [P] [R1] Tests puis `src/domain/frais.ts` : coût et frais, montant
      fixe converti, sans taux (R1).
- [x] T003 [P] [R1] Tests puis les préférences : `frais`, `fraisChoisis`, leurs
      gestes, lecture d'une préférence d'avant.
- [x] T004 [R1] Tests puis les réglages : liste, ajout, modification,
      suppression, validation (`ReglageFrais.tsx`).
- [x] T005 [R1] Tests puis l'écran : choix des frais, coût et détail, sans
      taux ; le carnet le dit (`LigneFrais.tsx`, `ConvertScreen.tsx`).
- [x] T006 [R1] e2e `@critical` : scénarios 2, 4, 5 ; axe, frais choisis.
- [x] T007 [R1] Messages fr et en.

## Phase 3 : récit 2, la voix (P2)

- [x] T008 [P] [R2] Tests puis `src/features/phrases/voix.ts` : choix d'une
      voix (R3), lecture et arrêt, énoncé gardé (R4).
- [x] T009 [R2] Tests puis « Écouter » dans la liste et en grand, « Arrêter »
      pendant la lecture, sans voix : la phrase le dit (`MotsUtiles.tsx`).
- [x] T010 [R2] e2e `@critical` avec une synthèse simulée ; axe.
- [x] T011 [R2] Messages fr et en.

## Phase 4 : finitions

- [x] T012 Vérification dans le navigateur : 320 et 390 px, deux thèmes.
- [x] T013 README ; budget de poids et `pwa-doctor --strict`.
