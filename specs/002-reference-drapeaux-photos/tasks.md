# Tâches : monnaie de référence, drapeaux, photos et À propos

**Entrées** : [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md).

Format : `- [ ] T000 [P] [Rn] description (fichiers)`. `[P]` : peut se faire en
parallèle (fichiers distincts, sans dépendance). `[Rn]` : récit de la
spécification. Chaque tâche de règle commence par son test, vu rouge
(constitution, principe V). Les phases suivent l'ordre de livraison du plan :
une pull request par phase.

## Phase 1 : spécification et constitution

- [x] T001 Amender la constitution (2.0.0) : principe II (le réseau lit aussi,
      à la demande, des photos publiques), principe III (une photo libre,
      réduite, d'une seule face et créditée), contrainte de confidentialité
      (les photos sont un tiers à nommer).
- [x] T002 Spécification, plan, recherche, modèle de données et tâches.

## Phase 2 : récit 4, À propos (P2)

- [x] T003 [R4] e2e de la page : nom, version, fonctions, sources liées,
      section de confidentialité titrée, crédits, aucune phrase répétée ; axe
      dans les deux thèmes. Rouge d'abord.
- [x] T004 [R4] `src/features/about/AboutScreen.tsx` recomposée (recherche
      R6), messages fr et en.
- [x] T005 [R4] Vérification dans le navigateur : 320 px, 390 × 664, thèmes
      clair et sombre.

## Phase 3 : récit 2, les drapeaux (P1)

- [x] T006 [P] [R2] Tests puis `src/domain/drapeaux.ts` (recherche R4) :
      l'euro, les codes en X, ANG, et toute devise de la liste servie par un
      drapeau ou un signe neutre (CR-003).
- [x] T007 [R2] Tests puis `src/ui/Drapeau.tsx` : image décorative, liseré,
      signe neutre ; fichiers émis par Vite hors du JavaScript, précachés.
- [x] T008 [R2] Les drapeaux dans le bouton et la liste des devises, la bascule
      du volet et les lignes du carnet ; e2e et axe.

## Phase 4 : récit 1, la monnaie de référence (P1)

- [x] T009 [P] [R1] Tests puis `src/domain/reference.ts` : source d'une paire,
      taux croisé (recherche R1).
- [x] T010 [R1] Tests puis `src/rates/` : taux du jour et série d'une paire
      (recherche R2), une requête pour un an de BCE.
- [x] T011 [P] [R1] Tests puis les préférences en version 2 (migration,
      échange quand la référence devient la devise affichée).
- [x] T012 [P] [R1] Tests puis le carnet en version 2 : schéma, migration,
      import d'un fichier de version 1, totaux par paire.
- [x] T013 [R1] Les écrans : Convertir, ligne de taux, enregistrement, volet,
      historique, carnet ; la référence dans les réglages.
- [x] T014 [R1] e2e `@critical` : référence CHF, conversion dans les deux
      sens, rechargement ; les parcours de la 001 à l'identique avec l'euro
      (CR-001).
- [x] T015 [R1] Messages fr et en ; README (fonctionnalités).

## Phase 5 : récit 3, les photos (P2)

- [x] T016 [R3] Relevé des photos sur Wikimedia Commons, vérifié par l'API
      (licence, auteur, dimensions) : `src/data/photos.json`, `photos.md`,
      recherche R5, contrat `photos-commons.md`.
- [x] T017 [P] [R3] Tests puis `src/data/photos.ts` : schéma, adresse d'une
      vignette, couverture (CR-005).
- [x] T018 [R3] CSP (`img-src`) et cache des vignettes par le service worker.
- [x] T019 [R3] Le volet : bascule dessins / photos, avis avant la première
      photo, repli sur le dessin, crédits ; préférence `images`.
- [x] T020 [R3] e2e : aucune requête vers Wikimedia en mode dessins (CR-004) ;
      en mode photos, vignettes et crédits ; axe.
- [x] T021 [R3] README (« Confidentialité ») et crédits de la page À propos.

## Phase 6 : récit 5, l'historique (P3)

- [x] T022 [R5] Le choix de la devise sur l'écran d'historique.
- [x] T023 [R5] Tests puis la courbe : axes, curseur et sa lecture
      (recherche R7).
- [x] T024 [P] [R5] Tests puis le ménage du cache au démarrage (recherche R8).
- [x] T025 [R5] e2e : changer de devise sur place, lire un point au clavier ;
      axe. L'exception `definition-list` du contrôle axe de l'historique est
      retirée : le socle 6.22.0 rend un `<dl>` valide.

## Phase 7 : finitions

- [x] T026 Poids relevé en CI à chaque phase ; budget reposé si la mesure le
      demande, avec sa raison dans `package.json`. Mesuré en CI après la
      fusion (run 37056163050) : 239,4 kB gzip sous 246, préchargé et morceau
      principal sous leurs bornes ; le budget ne bouge pas.
- [x] T027 Captures et image de partage (`npm run screenshots`) si l'écran
      principal a changé.

## Dépendances et ordre

- Phase 1 → À propos → drapeaux → référence → historique → photos. Les
  photos, prévues avant l'historique, passent après lui : leur relevé sur
  Commons est le plus long.
- Les drapeaux avant la référence : le choix de la référence s'en sert.
- Les photos après la référence : le volet bascule déjà entre la devise et la
  référence.
- Dans une phase : tests, puis règles, puis écrans, puis e2e.
