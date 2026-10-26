# Tâches : dire le prix, annoncer le montant, raccourcis et poids

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md).

Chaque tâche de règle commence par son test, vu rouge (constitution,
principe V).

## Phase 1 : spécification

- [x] T001 Spécification, plan et tâches.

## Phase 2 : récit 1, dire le prix (P1)

- [x] T002 Tests puis la rangée « Le montant » : texte dans la langue,
      « Écouter », « Montrer », devise de la langue, entier sans décimales
      (`MotsUtiles.tsx`, `ConvertScreen.tsx`).
- [x] T003 e2e et axe.

## Phase 3 : récit 2, l'annonce (P2)

- [x] T004 Tests puis la région `aria-live` de l'écran Convertir, à la fin
      d'une saisie seulement.

## Phase 4 : récit 3, les raccourcis (P3)

- [x] T005 Le manifeste : trois raccourcis (`vite.config.ts`) ; test sur le
      manifeste construit.
- [x] T006 Tests puis `?mots` : ouvre la feuille une fois, retire le paramètre.

## Phase 5 : récit 4, le poids (P3)

- [x] T007 Routes paresseuses, préchargées au repos, frontière à clé ; refus
      `nav-attente` retiré ; tests de navigation adaptés.
- [x] T008 Mesure avant et après, dans le plan ; budgets.

## Phase 6 : finitions

- [x] T009 Vérification dans le navigateur ; README.
