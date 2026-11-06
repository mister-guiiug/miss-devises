# Tâches : un copilote de démonstration, AG-UI et CopilotKit

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md).

Chaque tâche de règle commence par son test, vu rouge (constitution,
principe V).

## Phase 1 : spécification

- [x] T001 Spécification, plan et tâches ; révision du 07/11 pour la
      publication et le BYOK ; constitution 3.0.0.

## Phase 2 : l'agent (R2, R4, R6)

- [x] T002 Tests puis la traduction du flux du modèle en événements AG-UI
      (`agent/protocole.ts`).
- [x] T003 Tests puis la conversion des messages AG-UI en messages du modèle
      (`agent/protocole.ts`).
- [x] T004 Tests puis le modèle simulé (`agent/modele-simule.ts`).
- [x] T005 Tests puis la boucle de l'agent : `noter_depense` et son
      `STATE_DELTA`, fin d'exécution sur un outil du navigateur, jetons
      (`agent/agent.ts`).
- [x] T006 Tests puis l'agent dans la page (`agent/agent-navigateur.ts`).

## Phase 3 : le navigateur (R1, R7, R8)

- [x] T007 Tests puis les outils `convertir` et `appliquer_frais`
      (`outils.ts`).
- [x] T008 Tests puis les dépenses converties et leur total (`depenses.ts`).
- [x] T009 Le panneau, la fiche de conversion, la liste des dépenses, le
      contexte.

## Phase 4 : l'inspecteur (R9)

- [x] T010 Tests puis le journal des événements (`journal.ts`).
- [x] T011 L'onglet « Événements » (`Inspecteur.tsx`).

## Phase 5 : la clé du visiteur et la publication (R10, R11, R12)

- [x] T012 Tests puis le réglage et la clé en `sessionStorage` (`reglage.ts`).
- [x] T013 Tests puis Claude depuis le navigateur, sur un faux réseau
      (`agent/modele-claude.ts`).
- [x] T014 L'onglet « Modèle » et son avis ; l'erreur dans la conversation.
- [x] T015 Tests puis l'interrupteur des réglages, éteint par défaut
      (`preferences.ts`, `SettingsScreen.tsx`).
- [x] T016 Morceaux hors précache, nommés sans empreinte ; zod de chaque
      paquet ; CSP vers `api.anthropic.com` (`vite.config.ts`).
- [x] T017 e2e sur le build de production (`e2e/copilote.spec.ts`) et axe sur
      l'onglet « Modèle » (`e2e/a11y.spec.ts`).
- [x] T018 README (Confidentialité), ADR 0014, budget.
