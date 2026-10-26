# Spécification : dire le prix, annoncer le montant, raccourcis et poids

**Branche** : `006-prix-annonce-raccourcis-poids`
**Créée le** : 26/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « faire 2, 6, 7, 8 » parmi les propositions du
26/10/2026 : dire un montant au vendeur ; annoncer le montant calculé au
lecteur d'écran ; des raccourcis depuis l'icône ; alléger le chargement.

## Scénarios et tests _(obligatoire)_

### Récit 1 : dire le prix au vendeur (priorité P1)

Il propose 150 livres pour un foulard. Dans « Mots utiles », sous la langue,
le montant tapé s'écrit dans la langue du vendeur, « ١٥٠ جنيه مصري », avec
« Écouter » et « Montrer » : l'appareil le dit, ou l'affiche en grand.

**Pourquoi cette priorité** : c'est le geste qui manque entre « combien ? » et
« trop cher » ; il réutilise la voix et la vue en grand de la feuille.

**Test indépendant** : saisir 150 EGP, ouvrir « Mots utiles » : le montant en
arabe, « Écouter » le dit en arabe, « Montrer » l'affiche en grand.

**Scénarios d'acceptation** :

1. **Étant donné** un montant saisi ou calculé dans la devise, **quand**
   j'ouvre « Mots utiles », **alors** une rangée « Le montant » l'écrit dans la
   langue choisie, avec le nom de la devise dans cette langue
   (`Intl.NumberFormat`, `currencyDisplay: 'name'`), et « 150 EGP » en clair.
2. **Quand** je touche « Écouter », **alors** le montant est dit dans la langue
   choisie (spécification 005, récit 2) ; sans voix, seul « Montrer » reste.
3. **Quand** je touche « Montrer », **alors** le montant s'affiche en grand,
   comme une phrase.
4. **Étant donné** une langue de la seconde devise (anglais pour l'USD),
   **alors** c'est le montant de la seconde devise qui s'écrit.
5. **Étant donné** aucun montant, **alors** la rangée n'apparaît pas.
6. Un entier s'écrit sans décimales (« 150 », pas « 150,00 ») : un vendeur ne
   dit pas les centimes d'un prix rond.

### Récit 2 : entendre le montant calculé (priorité P2)

Avec un lecteur d'écran, elle tape 200 dans les livres : une demi-seconde
après la dernière touche, elle entend « Soit 3,40 euros ». Le champ calculé
changeait jusqu'ici sans rien dire.

**Scénarios d'acceptation** :

1. **Étant donné** un montant valide, **quand** la saisie s'arrête 800 ms,
   **alors** une région `aria-live="polite"` dit les montants calculés, nommés
   dans la langue de l'application (« Soit 3,40 euros et 3,68 dollars des
   États-Unis. »).
2. **Étant donné** une saisie en cours, **alors** rien n'est annoncé à chaque
   touche.
3. **Étant donné** une saisie vide ou illisible, **alors** rien n'est annoncé
   (le message d'erreur du champ l'est déjà).

### Récit 3 : des raccourcis depuis l'icône (priorité P3)

Un appui long sur l'icône de l'application installée propose « Convertir »,
« Carnet » et « Mots utiles ».

**Scénarios d'acceptation** :

1. **Étant donné** le manifeste, **alors** il déclare trois raccourcis : la
   racine, `carnet`, et `?mots`.
2. **Étant donné** l'adresse `?mots`, **alors** l'écran Convertir ouvre « Mots
   utiles » dès qu'une langue est à proposer, puis retire le paramètre : un
   rechargement ne la rouvre pas.
3. **Étant donné** `?mots` sans langue à proposer, **alors** rien ne s'ouvre.

### Récit 4 : charger moins au démarrage (priorité P3)

**Scénarios d'acceptation** :

1. **Étant donné** le premier chargement, **alors** l'historique, le carnet,
   les réglages et À propos ne sont plus dans le morceau principal : chacun
   est un morceau, préchargé au repos.
2. **Étant donné** un clic vers un écran pas encore chargé, **alors** un repli
   paraît (frontière remontée à chaque route, `key={pathname}`).
3. **Étant donné** le build, **alors** le poids préchargé baisse, mesuré, et
   `pwa-doctor --strict` reste à zéro, sans refus devenu faux.

## Exigences _(obligatoire)_

- **EF-001** : la feuille des mots utiles DOIT écrire le montant de la devise
  de la langue choisie dans cette langue, et proposer de le dire et de le
  montrer.
- **EF-002** : l'écran Convertir DOIT annoncer les montants calculés à la fin
  d'une saisie, sans annoncer chaque touche.
- **EF-003** : le manifeste DOIT déclarer trois raccourcis ; `?mots` DOIT
  ouvrir la feuille une fois.
- **EF-004** : les écrans autres que Convertir DOIVENT être chargés à la
  demande, préchargés au repos, avec un repli visible au clic.

## Critères de réussite _(obligatoire)_

- **CR-001** : les parcours des spécifications 001 à 005 passent à
  l'identique (e2e).
- **CR-002** : le préchargé baisse ; la mesure est publiée dans le plan.
- **CR-003** : axe ne relève aucune violation, rangée du montant comprise.

## Clarifications

### Séance du 26/10/2026

- Q : dire le montant dans quelle écriture ? → R : celle de la langue
  (chiffres arabes orientaux en arabe, si `Intl` les choisit) ; « 150 EGP » en
  clair à côté pour qui lit.
- Q : annoncer aussi le champ saisi ? → R : non : le lecteur d'écran l'a dit en
  le tapant ; seuls les montants calculés.

## Hypothèses

- Une voix lit les chiffres et le nom de la devise écrits dans sa langue.
