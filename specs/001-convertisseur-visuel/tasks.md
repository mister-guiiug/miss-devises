# Tâches : convertisseur de devises visuel

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/](./contracts/).

Format : `- [ ] T000 [P] [Rn] description (fichiers)`. `[P]` : peut se faire en
parallèle (fichiers distincts, sans dépendance). `[Rn]` : récit de la
spécification. Chaque tâche de règle commence par son test, vu rouge
(constitution, principe V).

## Phase 1 : mise en place

- [x] T001 Reformater `.claude/launch.json` : le générateur l'écrit hors du
      format de Prettier, et la première CI de `main` est rouge pour cela seul.
- [ ] T002 Retirer l'exemple des notes, la couche Supabase et l'écran de compte
      (R11) : `src/backend/supabase.ts`, `src/backend/queued-notes.ts`,
      `src/backend/notes-file.ts`, `src/auth/`, `src/features/account/`,
      `src/features/home/`, `supabase/`, `.github/workflows/supabase-*.yml`,
      `@supabase/supabase-js`, les variables Supabase de `.env.example` et de
      `src/app/config/env.ts`, les routes et l'entrée de navigation.
- [ ] T003 Retirer ce qui présente encore le squelette : `<title>` et
      `og:title` d'`index.html`, `content/accueil.md`, les guides
      `content/pages/` du squelette.
- [ ] T004 Ouvrir `connect-src` aux trois origines de R10.

## Phase 2 : fondations (bloquent tous les récits)

- [ ] T005 [P] Tests puis `src/domain/money.ts` : `lireMontant` (R4),
      `decimalesDe` (R3), formats.
- [ ] T006 [P] Tests puis `src/domain/convert.ts` : euro ↔ devise, sans
      arrondi interne.
- [ ] T007 [P] `src/data/coupures.json` (41 devises, daté, sourcé) et
      `src/domain/currencies.ts`, avec les tests de forme : valeurs triées et
      uniques, couleurs valides, décimales égales à celles d'`Intl`, au moins
      une source par devise.
- [ ] T008 Tests puis `src/rates/sources.ts` : schémas zod du contrat, délai de
      8 s, repli jsDelivr → Cloudflare Pages.
- [ ] T009 Tests puis `src/rates/cache.ts` (`idb` du socle) et
      `src/rates/service.ts` : source par devise, dernier taux sans réseau,
      fraîcheur, liste des devises (R9).
- [ ] T010 `src/rates/store.ts` (Zustand) : hydratation depuis le cache au
      démarrage, rafraîchissement au plus horaire et au retour en ligne.
- [ ] T011 Tests puis le port `Carnet` : `src/backend/ports.ts`,
      `src/backend/local.ts` (`versioned-store`), export et import.
- [ ] T012 [P] Tests puis les préférences (`versioned-store`).

**Point de contrôle** : règles et taux testés ; aucun écran encore.

## Phase 3 : récit 1, convertir dans les deux sens (P1) — MVP

- [ ] T013 [R1] e2e `@critical` (réseau simulé par les routes Playwright) :
      200 EGP → 3,40 € ; 20 € → 1 176,60 EGP ; inversion ; source et date
      affichées. Rouge d'abord.
- [ ] T014 [R1] Tests puis `src/features/convert/ConvertScreen.tsx` : deux
      champs liés, inversion, ligne de taux (source, date, avertissement),
      saisie invalide signalée sans être effacée.
- [ ] T015 [P] [R1] Tests puis `src/features/convert/CurrencyPicker.tsx` :
      recherche par code ou nom, sans accents, récentes en tête.
- [ ] T016 [R1] Messages fr et en (`src/i18n/messages.ts`).

## Phase 4 : récit 2, voir les billets et les pièces (P1) — MVP

- [ ] T017 [P] [R2] Tests puis `src/domain/decompose.ts` (R5).
- [ ] T018 [P] [R2] Tests puis `src/features/money/Banknote.tsx` et
      `Coin.tsx` (R6) : proportions, couleur, texte contrasté, libellé
      accessible.
- [ ] T019 [R2] `src/features/money/MoneySheet.tsx` (feuille du socle) : billets
      et pièces avec contre-valeur, bascule de sens, composition du montant,
      devise sans coupures.
- [ ] T020 [R2] e2e `@critical` du volet.

**Point de contrôle** : le MVP (récits 1 et 2) se livre et se déploie seul.

## Phase 5 : récit 3, comparer avec l'historique (P2)

- [ ] T021 [P] [R3] Tests puis `src/domain/history.ts` : statistiques,
      comparaison à une date, grille d'échantillonnage (R2).
- [ ] T022 [R3] Tests puis `src/features/history/HistoryScreen.tsx` : périodes,
      courbe (géométrie `sparkline` du socle), `Stat`, comparaison, hors ligne.
- [ ] T023 [R3] e2e de l'historique (réseau simulé).

## Phase 6 : récit 4, garder une conversion avec un libellé (P2)

- [ ] T024 [R4] Tests puis l'enregistrement depuis l'écran de conversion
      (libellé, libellé par défaut).
- [ ] T025 [R4] Tests puis `src/features/carnet/CarnetScreen.tsx` :
      contre-valeur du jour et écart, renommer, supprimer annulable (toast du
      socle), totaux par devise, carnet vide.
- [ ] T026 [R4] Export et import du carnet dans les réglages.
- [ ] T027 [R4] e2e `@critical` : enregistrer, recharger, renommer, supprimer,
      annuler.

## Phase 7 : récit 5, composer avec ses billets (P3)

- [ ] T028 [R5] Tests puis la composition au toucher dans le volet (compteur
      par coupure, retrait, remise à zéro).

## Phase 8 : finitions

- [ ] T029 [P] Icône (`public/favicon.svg`), icônes PWA (`npm run icons`),
      couleurs de marque (`src/index.css`).
- [ ] T030 [P] Image de partage et captures (`npm run screenshots`).
- [ ] T031 [P] README : fonctionnalités, sources des taux et des coupures,
      section « Confidentialité » (R10).
- [ ] T032 e2e `@a11y` (axe) sur chaque écran, thèmes clair et sombre ;
      vérification à 320 px et 390 × 664.
- [ ] T033 Poids relevé en CI ; budget reposé à +10 % si la mesure le demande.
- [ ] T034 Protection de `main` : `node scripts/apply-rulesets.mjs miss-devises`
      depuis le socle, une fois les contextes de CI observés.
- [ ] T035 Inscription au catalogue du socle : `apps-catalog.js` et palette
      dans `themes.js` (pull request sur dev-pwa-config).

## Dépendances et ordre

- Phase 1 → Phase 2 → récit 1 → récits 2, 3 et 4 (indépendants entre eux) →
  récit 5 (s'appuie sur le volet) → finitions.
- Dans un récit : tests, puis règles, puis écran, puis e2e.

## Stratégie

MVP d'abord : phases 1 à 4 (récits 1 et 2, tous deux P1), vérifiées dans le
navigateur et en CI, avant l'historique et le carnet.
