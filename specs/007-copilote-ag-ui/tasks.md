# Tâches : un copilote de démonstration, AG-UI et CopilotKit

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md).

Chaque tâche de règle commence par son test, vu rouge (constitution,
principe V).

## Phase 1 : spécification

- [x] T001 Spécification, plan et tâches.

## Phase 2 : l'agent (R2, R4, R6)

- [x] T002 Tests puis la traduction du flux du modèle en événements AG-UI :
      texte, appels d'outils, raisonnement, contenu brut du tour
      (`agent/protocole.ts`).
- [x] T003 Tests puis la conversion des messages AG-UI en messages du modèle :
      contenu brut rejoué, résultats d'outils groupés, images
      (`agent/protocole.ts`).
- [x] T004 Tests puis le modèle simulé (`agent/modele-simule.ts`).
- [x] T005 Tests puis la boucle de l'agent : outil serveur `noter_depense` et
      son `STATE_DELTA`, fin d'exécution sur un outil du navigateur, jetons
      (`agent/agent.ts`).
- [x] T006 Claude (`agent/modele-claude.ts`) et le greffon Vite
      (`agent/greffon.ts`, `vite.config.ts`, scripts `dev:copilote`).

## Phase 3 : le navigateur (R1, R7, R8)

- [x] T007 Tests puis les outils `convertir` et `appliquer_frais`
      (`src/copilote/outils.ts`).
- [x] T008 Tests puis les dépenses converties et leur total
      (`src/copilote/depenses.ts`).
- [x] T009 Le panneau, la fiche de conversion, la liste des dépenses, le
      contexte (`src/copilote/`), monté en développement seulement
      (`App.tsx`).

## Phase 4 : l'inspecteur (R9)

- [x] T010 Tests puis le journal des événements (`src/copilote/journal.ts`).
- [x] T011 L'onglet « Événements AG-UI » (`src/copilote/Inspecteur.tsx`).

## Phase 5 : vérification

- [x] T012 Build sans `VITE_COPILOTE` : aucun « copilotkit » dans `dist/`,
      budget inchangé (CR-001).
- [x] T013 Parcours au navigateur en mode simulé (CR-002).
