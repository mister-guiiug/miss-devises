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
- [x] T002 Retirer l'exemple des notes, la couche Supabase et l'écran de compte
      (R11) : `src/backend/supabase.ts`, `src/backend/queued-notes.ts`,
      `src/backend/notes-file.ts`, `src/auth/`, `src/features/account/`,
      `src/features/home/`, `supabase/`, `.github/workflows/supabase-*.yml`,
      `@supabase/supabase-js`, les variables Supabase de `.env.example` et de
      `src/app/config/env.ts`, les routes et l'entrée de navigation.
- [x] T003 Retirer ce qui présente encore le squelette : `<title>` et
      `og:title` d'`index.html`, `content/accueil.md`, les guides
      `content/pages/` du squelette.
- [x] T004 Ouvrir `connect-src` aux trois origines de R10.

## Phase 2 : fondations (bloquent tous les récits)

- [x] T005 [P] Tests puis `src/domain/money.ts` : `lireMontant` (R4),
      `decimalesDe` (R3), formats.
- [x] T006 [P] Tests puis `src/domain/convert.ts` : euro ↔ devise, sans
      arrondi interne.
- [ ] T007 [P] `src/data/coupures.json` (41 devises, daté, sourcé) et
      `src/domain/currencies.ts`, avec les tests de forme : valeurs triées et
      uniques, couleurs valides, décimales égales à celles d'`Intl`, au moins
      une source par devise.
- [x] T008 Tests puis `src/rates/sources.ts` : schémas zod du contrat, délai de
      8 s, repli jsDelivr → Cloudflare Pages.
- [x] T009 Tests puis `src/rates/cache.ts` (`idb` du socle) et
      `src/rates/service.ts` : source par devise, dernier taux sans réseau,
      fraîcheur, liste des devises (R9). Fait sans `cache.ts` : le service
      reçoit l'`idb` du socle en paramètre, et les tests un faux en mémoire.
- [x] T010 `src/rates/store.ts` (Zustand) : hydratation depuis le cache au
      démarrage, rafraîchissement au plus horaire et au retour en ligne.
- [x] T011 Tests puis le port `Carnet` : `src/backend/ports.ts`,
      `src/backend/local.ts` (`versioned-store`), export et import.
- [x] T012 [P] Tests puis les préférences (`versioned-store`).

**Point de contrôle** : règles et taux testés ; aucun écran encore.

## Phase 3 : récit 1, convertir dans les deux sens (P1) — MVP

- [x] T013 [R1] e2e `@critical` (réseau simulé par les routes Playwright) :
      200 EGP → 3,40 € ; 20 € → 1 176,60 EGP ; inversion ; source et date
      affichées. Rouge d'abord. Écrit après l'écran : vu rouge en faussant le
      taux simulé (3,33 au lieu de 3,40), puis rétabli. Échap ferme le volet
      des devises et rend le focus, parcours clavier.
- [x] T014 [R1] Tests puis `src/features/convert/ConvertScreen.tsx` : deux
      champs liés, inversion, ligne de taux (source, date, avertissement),
      saisie invalide signalée sans être effacée. L'accueil est
      `src/features/home/HomeScreen.tsx` : l'écran, puis le pied de page de la
      famille, que `pwa-doctor` reconnaît au nom du fichier.
- [x] T015 [P] [R1] Tests puis `src/features/convert/CurrencyPicker.tsx` :
      recherche par code ou nom, sans accents, récentes en tête.
- [x] T016 [R1] Messages fr et en (`src/i18n/messages.ts`).

## Phase 4 : récit 2, voir les billets et les pièces (P1) — MVP

- [x] T017 [P] [R2] Tests puis `src/domain/decompose.ts` (R5). Écrire ces tests
      a révélé que `arrondir` rendait NaN en notation exponentielle (« 0,0000001 »
      affichait un champ vide) : corrigé, avec son test.
- [x] T018 [P] [R2] Tests puis `src/features/money/Banknote.tsx` et
      `Coin.tsx` (R6) : proportions, couleur, texte contrasté, libellé
      accessible. Le contraste WCAG est écrit ici (`src/domain/contraste.ts`) :
      le socle n'en exporte pas. Bimétal : le centre, puis l'anneau.
- [ ] T019 [R2] `src/features/money/MoneySheet.tsx` (feuille du socle) : billets
      et pièces avec contre-valeur, bascule de sens, composition du montant,
      devise sans coupures.
- [ ] T020 [R2] e2e `@critical` du volet.

**Point de contrôle** : le MVP (récits 1 et 2) se livre et se déploie seul.

## Phase 5 : récit 3, comparer avec l'historique (P2)

- [x] T021 [P] [R3] Tests puis `src/domain/history.ts` : statistiques,
      comparaison à une date, grille d'échantillonnage (R2). La série de la BCE
      finit désormais sur le taux du jour : lue avant 16 h, elle s'arrêtait à
      la veille jusqu'au soir.
- [x] T022 [R3] Tests puis `src/features/history/HistoryScreen.tsx` : périodes,
      courbe (géométrie `sparkline` du socle), `Stat`, comparaison, hors ligne.
      Le contrôle axe a trouvé un `<dl>` invalide dans le `Stat` du socle :
      corrigé en amont (dev-pwa-config#415) ; la règle `definition-list` est
      écartée de ce seul contrôle jusqu'à la montée.
- [x] T023 [R3] e2e de l'historique (réseau simulé) : un an de BCE en une
      requête (CR-004), comparaison du montant, changement de période.

## Phase 6 : récit 4, garder une conversion avec un libellé (P2)

- [x] T024 [R4] Tests puis l'enregistrement depuis l'écran de conversion
      (libellé, libellé par défaut) : `SaveForm.tsx`.
- [x] T025 [R4] Tests puis `src/features/carnet/CarnetScreen.tsx` :
      contre-valeur du jour et écart, renommer, supprimer annulable (toast du
      socle), totaux par devise, carnet vide. Les calculs vivent dans
      `src/domain/carnet.ts`.
- [x] T026 [R4] Export et import du carnet dans les réglages (branchés au
      récit 1 ; l'export est éprouvé par l'e2e du carnet).
- [x] T027 [R4] e2e `@critical` : enregistrer, recharger, renommer, supprimer,
      annuler ; plus l'export en fichier et axe sur le carnet vide et plein.

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
