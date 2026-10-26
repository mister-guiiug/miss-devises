# Tâches : les mots utiles du pays

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md).

Format : `- [ ] T000 [P] description (fichiers)`. Chaque tâche de règle
commence par son test, vu rouge (constitution, principe V). Une pull request.

## Phase 1 : spécification

- [x] T001 Spécification, plan, recherche, modèle de données, démarrage rapide
      et tâches.

## Phase 2 : le jeu

- [x] T002 Rédiger `src/data/phrases.json` : 27 langues, 41 devises (R1, R2).
- [x] T003 Relire chaque langue contre son guide de Wikivoyage ; corrections
      et sources dans `phrases.md` (CR-002).
- [x] T004 Tests puis `src/data/phrases.ts` : schéma, seize phrases par
      langue, transcription des écritures non latines, toute devise
      illustrée couverte, codes BCP 47 valides (CR-001) ; langues proposées
      pour une devise et une seconde devise, sans la langue de l'application
      (R2).

## Phase 3 : la feuille

- [x] T005 Messages fr et en : sens des seize phrases, groupes, libellés (R3).
- [x] T006 Tests puis `src/features/phrases/MotsUtiles.tsx` : groupes, texte,
      transcription, sens, `lang` et `dir`, choix de la langue, phrase en
      grand (R4).
- [x] T007 Le bouton « Mots utiles » à côté de « Billets et pièces », absent
      sans langue à proposer ; la feuille et le jeu en morceau à part,
      préchargés au repos (`ConvertScreen.tsx`).
- [x] T008 e2e `@critical` (scénarios 1, 2, 3, 5, 6) et axe, feuille ouverte,
      dans les deux thèmes (CR-003).

## Phase 4 : finitions

- [x] T009 Vérification dans le navigateur : 320 px et 390 px, thèmes, arabe
      et thaï.
- [x] T010 README ; budget de poids et `pwa-doctor --strict` (CR-004).
