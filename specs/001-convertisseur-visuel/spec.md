# Spécification : convertisseur de devises visuel

**Branche** : `001-convertisseur-visuel`
**Créée le** : 01/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « créer une nouvelle application pour convertir des monnaies
d'euros de manière très visuelle, avec par exemple un volet qui affiche tous les
billets et les pièces, la conversion dans les deux sens, une comparaison avec
l'historique des valeurs, en laissant la possibilité de poser un libellé, par
exemple : visite du musée, 200 EGP vers euro ».

## Scénarios et tests _(obligatoire)_

### Récit 1 : convertir dans les deux sens (priorité P1)

Une voyageuse en Égypte voit un prix de 200 EGP. Elle choisit la livre égyptienne,
tape 200, et lit aussitôt l'équivalent en euros. Au comptoir suivant, elle part
d'un budget de 20 € et lit combien de livres cela représente : le même écran
convertit dans les deux sens, en tapant dans l'un ou l'autre champ.

**Pourquoi cette priorité** : c'est la raison d'être de l'application ; tout le
reste s'appuie sur un taux et une conversion justes.

**Test indépendant** : avec un taux connu, saisir un montant d'un côté et vérifier
le montant de l'autre, arrondi aux décimales de la devise ; puis l'inverse.

**Scénarios d'acceptation** :

1. **Étant donné** la paire EUR / EGP au taux de 58,83, **quand** je saisis 200
   côté EGP, **alors** le champ euro affiche 3,40 €.
2. **Étant donné** la même paire, **quand** je saisis 20 côté euro, **alors** le
   champ EGP affiche 1 176,60 EGP.
3. **Étant donné** une conversion affichée, **quand** j'inverse la paire, **alors**
   les deux devises échangent leur place et les montants restent cohérents.
4. **Étant donné** que je saisis « 12,5 » ou « 12.5 », **alors** les deux formes
   sont lues comme douze et demi.
5. **Étant donné** une devise sans décimales (yen), **alors** son montant
   s'affiche sans décimales.
6. **Étant donné** un taux, **alors** l'écran dit d'où il vient (source) et de
   quel jour il date.

---

### Récit 2 : voir les billets et les pièces (priorité P1)

Avant de partir, il veut savoir à quoi ressemblent les billets et ce qu'ils
valent : un volet montre tous les billets et toutes les pièces de la devise, du
plus petit au plus grand, chacun avec sa valeur en euros. Un bouton bascule le
sens : les billets et pièces en euros, avec leur valeur dans la devise.

**Pourquoi cette priorité** : c'est la partie « très visuelle » demandée, et ce qui
distingue l'application d'un convertisseur ordinaire.

**Test indépendant** : ouvrir le volet pour EGP et vérifier que chaque coupure
connue apparaît, dans l'ordre, avec sa contre-valeur en euros.

**Scénarios d'acceptation** :

1. **Étant donné** la livre égyptienne, **quand** j'ouvre le volet, **alors** je
   vois chaque billet et chaque pièce en circulation, dessinés à leur couleur
   dominante, chacun avec sa valeur en euros.
2. **Étant donné** le volet ouvert, **quand** je bascule le sens, **alors** je vois
   les billets et pièces en euros avec leur valeur en livres.
3. **Étant donné** un montant saisi (200 EGP), **alors** le volet montre aussi sa
   composition en billets et pièces : ici, un billet de 200.
4. **Étant donné** une devise dont les coupures ne sont pas répertoriées, **alors**
   le volet le dit, et la conversion reste disponible.
5. **Étant donné** un lecteur d'écran, **alors** chaque billet est annoncé avec sa
   valeur et sa contre-valeur (« billet de 200 livres égyptiennes, 3,40 € »).

---

### Récit 3 : comparer avec l'historique (priorité P2)

Elle se demande si le moment est bon : une courbe montre l'évolution du taux sur
un mois, six mois ou un an, avec le plus haut, le plus bas et la variation. Pour
le montant saisi, l'écran compare : « 200 EGP valaient 3,56 € il y a un an,
3,40 € aujourd'hui ».

**Pourquoi cette priorité** : demandé explicitement, mais la conversion du jour
sert sans lui.

**Test indépendant** : avec une série connue, vérifier la courbe, le plus haut, le
plus bas, la variation et la comparaison du montant à une date passée.

**Scénarios d'acceptation** :

1. **Étant donné** la paire EUR / EGP, **quand** j'ouvre l'historique, **alors** je
   vois la courbe du taux sur la période choisie, avec ses extrêmes et sa
   variation en pourcentage.
2. **Étant donné** un montant saisi, **alors** je lis sa contre-valeur au début de
   la période et aujourd'hui, et l'écart en euros et en pourcentage.
3. **Étant donné** que je change de période (1 mois, 6 mois, 1 an), **alors** la
   courbe et les chiffres suivent.
4. **Étant donné** une période déjà consultée, **quand** je suis hors ligne,
   **alors** elle s'affiche encore ; sinon l'écran dit qu'elle n'est pas disponible
   hors ligne.

---

### Récit 4 : garder une conversion avec un libellé (priorité P2)

Au musée, elle enregistre « Visite du musée : 200 EGP → 3,40 € ». Le carnet garde
la date, le taux appliqué et sa source ; plus tard, chaque ligne montre aussi ce
que le même montant vaudrait au taux du jour.

**Pourquoi cette priorité** : demandé explicitement ; il donne une mémoire aux
conversions et nourrit la comparaison.

**Test indépendant** : enregistrer une conversion avec libellé, recharger
l'application, la retrouver identique, la modifier, la supprimer.

**Scénarios d'acceptation** :

1. **Étant donné** une conversion affichée, **quand** je saisis un libellé et
   j'enregistre, **alors** elle apparaît dans le carnet avec le libellé, les deux
   montants, le taux, sa source et la date.
2. **Étant donné** une conversion enregistrée, **alors** la ligne montre aussi la
   contre-valeur au taux du jour et l'écart.
3. **Étant donné** le carnet, **quand** je modifie un libellé ou supprime une
   ligne, **alors** le changement persiste après rechargement, et une suppression
   s'annule pendant quelques secondes.
4. **Étant donné** plusieurs lignes dans une même devise, **alors** le carnet
   montre leur total dans cette devise et en euros.
5. **Étant donné** un libellé vide, **alors** la conversion s'enregistre avec un
   libellé par défaut (la paire et le montant).

---

### Récit 5 : composer un montant avec ses billets (priorité P3)

Au moment de payer, il touche les billets qu'il a en main dans le volet (deux
billets de 100, une pièce de 1) : le montant se compose tout seul et se convertit.

**Pourquoi cette priorité** : confort, pas nécessité ; il réutilise le volet du
récit 2.

**Test indépendant** : toucher des coupures et vérifier le total et sa conversion.

**Scénarios d'acceptation** :

1. **Étant donné** le volet ouvert, **quand** je touche un billet, **alors** il
   s'ajoute au montant et un compteur l'indique sur le billet.
2. **Étant donné** des coupures ajoutées, **quand** je les retire ou remets à zéro,
   **alors** le montant suit.

### Cas limites

- **Aucun taux** (première ouverture hors ligne) : l'écran le dit et propose de
  réessayer ; la saisie reste possible mais sans résultat inventé.
- **Taux ancien** (plus de 3 jours) : la date s'affiche en avertissement.
- **Source indisponible** : la source de repli prend le relais quand elle existe,
  sinon le dernier taux connu, avec sa date.
- **Saisie invalide** (lettres, deux séparateurs, nombre négatif) : rien n'est
  converti, le champ le signale sans effacer la saisie.
- **Très grands montants** (VND, IDR) : les séparateurs de milliers restent
  lisibles et rien ne déborde sur 320 px.
- **Devise sans coupures connues** : volet explicite, conversion intacte.
- **Coupure qui n'est plus émise** (billet de 500 €) : affichée comme telle.

## Exigences _(obligatoire)_

### Exigences fonctionnelles

- **EF-001** : l'application DOIT convertir un montant entre l'euro et une devise
  choisie, dans les deux sens, à chaque frappe, sans bouton.
- **EF-002** : l'application DOIT proposer au moins les 41 devises du jeu de
  données des coupures, et toute devise que la source fournit, cherchable par code
  ou par nom (français et anglais).
- **EF-003** : l'application DOIT afficher le taux utilisé, sa source et sa date,
  et signaler un taux de plus de 3 jours.
- **EF-004** : l'application DOIT arrondir chaque montant aux décimales de sa
  devise (ISO 4217) et l'afficher dans le format de la langue choisie.
- **EF-005** : l'application DOIT afficher, pour la devise choisie, tous ses
  billets et pièces en circulation, dessinés de façon stylisée (couleur
  dominante, valeur, proportions quand elles sont connues), avec leur
  contre-valeur en euros, et inversement pour l'euro.
- **EF-006** : l'application NE DOIT PAS reproduire l'image d'un billet ou d'une
  pièce : seulement des formes stylisées.
- **EF-007** : l'application DOIT décomposer le montant saisi en billets et
  pièces de la devise.
- **EF-008** : l'application DOIT afficher l'historique du taux sur 1 mois,
  6 mois et 1 an, avec plus haut, plus bas et variation.
- **EF-009** : l'application DOIT comparer la contre-valeur du montant saisi au
  début de la période et aujourd'hui.
- **EF-010** : l'utilisateur DOIT pouvoir enregistrer une conversion avec un
  libellé libre ; le carnet garde montants, taux, source et date.
- **EF-011** : le carnet DOIT permettre de modifier un libellé et de supprimer
  une ligne, suppression annulable.
- **EF-012** : le carnet DOIT afficher, pour chaque ligne, la contre-valeur au
  taux du jour, et des totaux par devise.
- **EF-013** : l'application DOIT fonctionner hors ligne avec les derniers taux
  connus et l'historique déjà consulté.
- **EF-014** : les données de l'utilisateur (carnet, préférences) DOIVENT rester
  sur l'appareil, sans compte, et s'exporter et s'importer en fichier.
- **EF-015** : l'application DOIT être utilisable au clavier et au lecteur
  d'écran, en français et en anglais.
- **EF-016** : l'application DOIT mémoriser la dernière devise choisie et
  proposer les devises récentes en premier.

### Entités clés

- **Devise** : code ISO, noms français et anglais, symbole, décimales, billets et
  pièces (valeur, couleur ou métal, dimensions éventuelles, encore émise ou non).
- **Taux** : valeur d'un euro dans une devise, à une date, avec sa source.
- **Série historique** : suite de taux datés pour une devise et une période.
- **Conversion enregistrée** : libellé, montant et devise de départ, montant et
  devise d'arrivée, taux, source, date du taux, date d'enregistrement.
- **Préférences** : dernière devise, devises récentes, sens du volet.

## Critères de réussite _(obligatoire)_

### Résultats mesurables

- **CR-001** : la contre-valeur s'affiche en moins de 100 ms après chaque frappe
  (calcul local, sans réseau).
- **CR-002** : hors ligne, après une première ouverture, une conversion reste
  possible avec le dernier taux, dont la date s'affiche.
- **CR-003** : les 41 devises du jeu de données montrent leurs billets et pièces,
  chacun avec une contre-valeur exacte à l'arrondi près.
- **CR-004** : un an d'historique coûte une requête pour une devise couverte par
  la BCE, et au plus 53 pour les autres.
- **CR-005** : rien ne déborde sur un écran de 320 px, et l'écran principal tient
  sans défilement sur un téléphone de 390 × 664 px.
- **CR-006** : contrastes AA dans les deux thèmes, contrôle axe sans violation, et
  `pwa-doctor --strict` à 0 défaut.
- **CR-007** : le poids reste sous le budget du squelette (`totalGzipKb`).

## Clarifications

### Séance du 01/10/2026

- Q : nom de l'application ? → R : `miss-devises`, « Miss Devises » (choix du
  propriétaire).
- Q : paires sans l'euro (dollar vers yen) ? → R : hors périmètre de cette
  version ; l'euro est toujours l'une des deux devises (« monnaies d'euros »).
- Q : quelles devises pour les billets et pièces ? → R : 41 devises de voyage
  depuis la France (liste dans le jeu de données), extensible ; les autres se
  convertissent sans volet.
- Q : où vivent les conversions enregistrées ? → R : sur l'appareil, sans compte,
  avec export et import, comme le reste de la famille.
- Q : images des billets ? → R : formes stylisées uniquement (exigence EF-006) :
  la reproduction des billets est encadrée, voire interdite, selon les banques
  centrales.

## Hypothèses

- Les taux sont indicatifs (taux de référence ou de marché), pas ceux d'un
  bureau de change, frais exclus : l'application le dit.
- Une source gratuite, sans clé, accessible depuis le navigateur, couvre chaque
  devise (vérifié le 01/10/2026 : BCE via Frankfurter, 29 devises ; marché via
  fawazahmed0/currency-api, 340 devises dont EGP).
- Les coupures changent rarement ; le jeu de données est daté et sourcé, et se
  corrige par une simple modification.
