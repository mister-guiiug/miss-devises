# Spécification : monnaie de référence, drapeaux, photos et À propos

**Branche** : `002-reference-drapeaux-photos`
**Créée le** : 02/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « faire des propositions d'améliorations avec de
nouvelles fonctionnalités, des améliorations UX/UI (logo de drapeau,
possibilité de switcher avec des vrais images de billet ou pièce issues de
wikipedia, pouvoir mettre une monnaie de référence : l'euro, améliorer le
visuel d'à propos) », puis « appliques les propositions d'évolutions ».

## Scénarios et tests _(obligatoire)_

### Récit 1 : choisir sa monnaie de référence (priorité P1)

Une Genevoise pense en francs suisses. Dans les réglages, elle choisit le franc
suisse comme monnaie de référence : l'écran Convertir passe de la livre
égyptienne au franc et retour, le volet montre les billets suisses face aux
égyptiens, l'historique trace un franc en livres, et le carnet garde, pour
chaque conversion, la référence du moment. Qui ne touche à rien garde l'euro.

**Pourquoi cette priorité** : demandé explicitement ; c'est ce qui ouvre
l'application à qui ne compte pas en euros, et tout le reste s'y appuie.

**Test indépendant** : avec des taux connus, régler la référence sur CHF,
convertir dans les deux sens, recharger, retrouver CHF ; puis revenir à l'euro
et retrouver les scénarios de la spécification 001 à l'identique.

**Scénarios d'acceptation** :

1. **Étant donné** une première ouverture, **alors** la référence est l'euro et
   l'application se comporte comme la version 001 (mêmes écrans, mêmes
   chiffres).
2. **Étant donné** la référence CHF, la devise EGP et des taux de marché de
   58,83 EGP et 0,9384 CHF pour un euro, **quand** je saisis 200 côté EGP,
   **alors** le champ franc affiche 3,19 CHF, et la ligne de taux dit
   « 1 CHF = 62,692 EGP », taux de marché, avec sa date.
3. **Étant donné** la référence CHF et la devise USD, deux devises que publie la
   BCE, **alors** la conversion se fait au taux de référence de la BCE ; dès que
   l'une des deux n'y est pas, les deux se lisent au taux de marché, à la même
   date.
4. **Étant donné** la devise affichée EGP, **quand** je choisis EGP comme
   référence, **alors** les deux s'échangent : la devise affichée devient
   l'ancienne référence. La liste des devises ne propose jamais la référence.
5. **Étant donné** des conversions enregistrées en euros, **quand** je change de
   référence, **alors** elles gardent leurs montants, leur taux et leur
   référence ; les totaux se font par paire de devises.
6. **Étant donné** la référence CHF, **quand** j'ouvre le volet et bascule le
   sens, **alors** je vois les billets et pièces en francs suisses, avec leur
   valeur dans la devise.
7. **Étant donné** la référence CHF, **alors** l'historique trace l'évolution
   d'un franc dans la devise, et compare le montant saisi en francs.

---

### Récit 2 : reconnaître chaque devise à son drapeau (priorité P1)

En cherchant la couronne, il hésite entre la danoise, la norvégienne et la
suédoise : chaque devise montre le drapeau du pays qui l'émet, à côté de son
code, dans le bouton de l'écran Convertir, dans la liste, dans les réglages et
dans le volet.

**Pourquoi cette priorité** : demandé explicitement ; c'est le repère le plus
rapide dans une liste de cent soixante devises, et il ne coûte rien au réseau.

**Test indépendant** : ouvrir la liste et vérifier que chaque devise montre son
drapeau, et que les devises de plusieurs pays montrent un signe neutre.

**Scénarios d'acceptation** :

1. **Étant donné** la liste des devises, **alors** chacune montre le drapeau de
   son pays émetteur ; l'euro montre le drapeau européen.
2. **Étant donné** une devise partagée par plusieurs pays (franc CFA d'Afrique
   centrale ou de l'Ouest, franc CFP, dollar des Caraïbes orientales, florin
   antillais ou caribéen), **alors** elle montre un signe neutre, jamais le
   drapeau d'un pays qui n'est pas le sien.
3. **Étant donné** un lecteur d'écran, **alors** le drapeau n'est pas annoncé :
   le code et le nom de la devise, écrits à côté, disent déjà tout.
4. **Étant donné** un appareil hors ligne après une première ouverture,
   **alors** les drapeaux s'affichent : ils sont livrés avec l'application,
   aucun n'est lu chez un tiers.
5. **Étant donné** un drapeau blanc sur fond blanc (Japon, Pologne), **alors**
   son contour reste visible dans les deux thèmes.

---

### Récit 3 : voir les vrais billets et pièces (priorité P2)

Avant de partir au Maroc, elle veut reconnaître les billets qu'on lui rendra :
dans le volet, elle passe des dessins aux photos. Chaque billet, chaque pièce
apparaît alors tel qu'il est, recto, en petit, avec le nom de son auteur et sa
licence. Les coupures sans photo libre gardent leur dessin, et le disent.

**Pourquoi cette priorité** : demandé explicitement, et très visuel ; mais les
dessins servent sans lui, et il fait entrer un tiers de plus.

**Test indépendant** : ouvrir le volet de l'euro, passer en photos, vérifier
qu'une vignette de Wikimedia Commons remplace chaque dessin couvert, avec son
crédit, et qu'aucune requête ne part vers Wikimedia tant que les dessins sont
choisis.

**Scénarios d'acceptation** :

1. **Étant donné** une première ouverture, **alors** le volet montre les
   dessins ; rien n'est demandé à Wikimedia.
2. **Étant donné** le volet ouvert, **quand** je passe en photos, **alors**
   l'application dit d'abord, une fois, que les photos viennent de Wikimedia
   Commons, qui voit l'adresse IP de l'appareil et les images demandées ; puis
   chaque coupure couverte montre sa photo, d'une seule face, réduite.
3. **Étant donné** une photo affichée, **alors** son crédit (auteur, licence,
   lien vers la page du fichier) se lit dans le volet.
4. **Étant donné** une coupure sans photo libre, ou une photo qui ne se charge
   pas, **alors** son dessin reste. Le volet dit d'avance, avant le choix,
   combien de coupures de la devise ont une photo ; en mode photos, chaque
   coupure restée en dessin le dit. Une devise sans aucune photo ne propose
   pas le choix, et dit pourquoi.
5. **Étant donné** le choix des photos, **quand** je rouvre l'application,
   **alors** il est gardé ; un geste suffit pour revenir aux dessins.
6. **Étant donné** des photos déjà vues, **quand** je suis hors ligne, **alors**
   elles s'affichent encore ; les autres coupures montrent leur dessin.
7. **Étant donné** un lecteur d'écran, **alors** une photo s'annonce comme son
   dessin : la coupure et sa contre-valeur, pas le nom du fichier.

---

### Récit 4 : une page À propos qui se lit d'un coup d'œil (priorité P2)

Un visiteur ouvre À propos : en un regard, il voit ce qu'est l'application, ce
qu'elle sait faire, d'où viennent ses chiffres et ce qui quitte l'appareil.

**Pourquoi cette priorité** : demandé explicitement ; la page actuelle répète
deux fois la même phrase et noie la confidentialité dans un paragraphe.

**Test indépendant** : ouvrir À propos sur 320 px et vérifier le nom, la
version, les fonctions, les sources liées, la section confidentialité et les
crédits, sans phrase répétée, sans débordement, sans violation axe.

**Scénarios d'acceptation** :

1. **Étant donné** la page À propos, **alors** elle s'ouvre sur l'icône, le nom,
   une phrase qui dit ce que fait l'application et son numéro de version ;
   aucune phrase n'apparaît deux fois.
2. **Étant donné** la page, **alors** les fonctions principales se lisent en
   une liste courte, chacune avec son icône.
3. **Étant donné** la section des sources, **alors** chaque source de taux est
   nommée et liée.
4. **Étant donné** la page, **alors** ce qui quitte l'appareil a sa propre
   section, titrée, qui nomme chaque tiers.
5. **Étant donné** la page, **alors** les crédits nomment les drapeaux et, s'il
   y a lieu, les photos, avec leur licence.

---

### Récit 5 : explorer l'historique sans repasser par Convertir (priorité P3)

Elle compare le dirham et la livre : depuis l'historique, elle change de devise
sans revenir à Convertir, puis promène le doigt sur la courbe pour lire le taux
d'une date précise.

**Pourquoi cette priorité** : confort ; l'historique sert déjà, mais oblige
aujourd'hui à un aller-retour par Convertir et ne se lit qu'en entier.

**Test indépendant** : changer de devise depuis l'historique, puis déplacer le
curseur au clavier et lire la date et le taux annoncés.

**Scénarios d'acceptation** :

1. **Étant donné** l'historique, **quand** je change de devise depuis l'écran,
   **alors** la courbe suit, et Convertir montre la même devise.
2. **Étant donné** une courbe, **alors** ses axes disent son plus haut, son plus
   bas, sa première et sa dernière date.
3. **Étant donné** une courbe, **quand** je déplace son curseur (doigt, souris
   ou flèches du clavier), **alors** la date et le taux du point se lisent, et
   un lecteur d'écran les annonce.
4. **Étant donné** des historiques consultés des jours durant, **alors**
   l'espace qu'ils occupent sur l'appareil ne grandit pas sans fin : ce qui ne
   sert plus est effacé.

### Cas limites

- **Référence sans taux** (hors ligne à la première ouverture, ou source
  muette pour elle) : l'écran le dit, comme pour une devise sans taux ; rien
  n'est inventé.
- **Référence sans coupures répertoriées** : le volet le dit pour ce côté, la
  conversion reste.
- **Fichier de carnet d'une version antérieure** (sans référence) : il
  s'importe, chaque conversion prend l'euro pour référence.
- **Photo retirée de Commons ou renommée** : le dessin revient, sans erreur
  visible.
- **Devise sans pays** (franc CFA, franc CFP, dollar des Caraïbes orientales) :
  signe neutre.
- **Très petits écrans** : rien ne déborde sur 320 px, drapeaux compris.

## Exigences _(obligatoire)_

### Exigences fonctionnelles

- **EF-001** : l'utilisateur DOIT pouvoir choisir une monnaie de référence parmi
  les devises convertibles ; l'euro par défaut.
- **EF-002** : toute conversion, tout taux, tout historique et tout total DOIT
  s'exprimer entre la référence et la devise choisie, dans les deux sens.
- **EF-003** : une paire DOIT se lire au taux de la BCE quand la BCE publie ses
  deux devises (l'euro compris), sinon au taux de marché, les deux devises à la
  même date ; le taux croisé se calcule sans arrondi.
- **EF-004** : la référence et la devise affichée NE DOIVENT jamais être la même
  devise.
- **EF-005** : une conversion enregistrée DOIT garder sa référence ; les
  conversions et les fichiers de carnet antérieurs DOIVENT se lire avec l'euro
  pour référence.
- **EF-006** : chaque devise DOIT montrer le drapeau de son pays émetteur, ou un
  signe neutre pour une devise de plusieurs pays ; l'euro, le drapeau européen.
- **EF-007** : les drapeaux DOIVENT être livrés avec l'application, disponibles
  hors ligne, décoratifs pour un lecteur d'écran.
- **EF-008** : le volet DOIT proposer de passer des dessins aux photos ; les
  dessins par défaut ; le choix gardé.
- **EF-009** : une photo NE DOIT être montrée que si elle est hébergée sur
  Wikimedia Commons sous licence libre ou avec la permission de son émetteur,
  d'une seule face, réduite, avec son crédit (auteur, licence, lien).
- **EF-010** : aucune requête NE DOIT partir vers Wikimedia tant que
  l'utilisateur n'a pas choisi les photos ; avant la première, l'application
  DOIT dire ce que Wikimedia voit.
- **EF-011** : une coupure sans photo DOIT garder son dessin ; une photo qui
  échoue DOIT laisser place au dessin.
- **EF-012** : la page À propos DOIT montrer le nom, la version, les fonctions,
  les sources liées, une section de confidentialité titrée et les crédits, sans
  phrase répétée.
- **EF-013** : l'historique DOIT permettre de changer de devise sur place, et
  de lire la date et le taux de chaque point, au doigt comme au clavier.
- **EF-014** : les séries gardées qui ne servent plus DOIVENT être effacées de
  l'appareil.

### Entités clés

- **Préférences** : s'ajoutent la monnaie de référence et le mode d'image
  (dessins ou photos) ; le sens du volet dit « devise » ou « référence ».
- **Conversion enregistrée** : s'ajoute sa référence ; le taux s'entend en
  unités de la devise pour une unité de la référence.
- **Photo** : pour une coupure, le fichier Commons, ses dimensions, son auteur
  et sa licence.
- **Drapeau** : pour une devise, le pays émetteur, ou aucun.

## Critères de réussite _(obligatoire)_

### Résultats mesurables

- **CR-001** : avec l'euro pour référence, les parcours de la spécification 001
  passent à l'identique (e2e).
- **CR-002** : un changement de référence se voit sur tous les écrans sans
  rechargement, et survit à un rechargement.
- **CR-003** : chaque devise de la liste a un drapeau ou un signe neutre, et
  aucune n'a le drapeau d'un autre pays (test sur toute la liste).
- **CR-004** : en mode dessins, aucune requête vers Wikimedia (e2e qui compte
  les requêtes) ; en mode photos, chaque photo affichée a son crédit.
- **CR-005** : la couverture des photos (coupures avec photo sur coupures
  répertoriées) est publiée dans la documentation et vérifiée par un test.
- **CR-006** : À propos et l'historique tiennent sur 320 px sans débordement,
  sans violation axe, dans les deux thèmes.
- **CR-007** : le poids reste sous le budget de `package.json` ; un budget
  relevé le dit et dit pourquoi.

## Clarifications

### Séance du 02/10/2026

- Q : quelle référence par défaut ? → R : l'euro (« une monnaie de référence :
  l'euro »).
- Q : où se règle-t-elle ? → R : dans les réglages, et l'écran Convertir la
  montre (choix par défaut retenu pour l'implémentation).
- Q : des paires sans l'euro, que la spécification 001 écartait ? → R : oui :
  c'est ce que veut dire une référence au choix. La clarification
  correspondante de la 001 est levée par celle-ci.
- Q : photos « issues de Wikipédia » : lesquelles ? → R : celles qu'héberge
  Wikimedia Commons, sous licence libre ou avec la permission de l'émetteur.
  Les images non libres qu'un Wikipédia montre au titre de l'usage loyal sont
  exclues : leur usage n'est permis que sur Wikipédia.
- Q : photos par défaut ? → R : non. Dessins par défaut, photos à la demande :
  elles font entrer un tiers, qui voit l'adresse IP de l'appareil.
- Q : la constitution interdit toute reproduction (principe III) et limite le
  réseau aux taux (principe II) ? → R : elle est amendée (version 2.0.0) : une
  photo libre, réduite, d'une seule face et créditée devient permise, à la
  demande de l'utilisateur.

### Séance du 02/10/2026, après la mise en ligne

- Q : la bascule « Dessins · Photos » ressemble à celle du sens, juste au-dessus
  : on les confond, et rien ne dit s'il y a des photos avant d'avoir basculé.
  Quelle forme ? → R : une rangée « Vraies photos » et son interrupteur, qui
  dit d'avance combien de coupures ont une photo ; l'avis s'ouvre dans la
  rangée ; sans photo pour la devise, l'interrupteur est grisé et dit
  pourquoi ; en mode photos, une coupure restée en dessin porte l'étiquette
  « Dessin » (proposition retenue).

### Séance du 03/10/2026

- Q : les billets égyptiens restent dessinés (Code pénal égyptien, art. 204
  bis A) ; peut-on au moins les voir ? → R : les dessins restent, et la rangée
  « Vraies photos » mène à l'article Wikipédia de la devise : un lien ne
  publie aucune image. L'article est en anglais, l'édition qui admet les
  images non libres ; le lien le dit. Il vaut pour toute devise dont des
  coupures restent dessinées.

## Hypothèses

- Les deux sources de taux publient tout contre l'euro : une paire sans l'euro
  se calcule par le taux croisé, sans requête de plus pour le taux du jour.
- Commons n'a pas de photo libre pour toutes les coupures : la couverture
  dépend des émetteurs (certaines banques centrales n'autorisent pas la
  reproduction) et se mesure au relevé.
- Les drapeaux d'une bibliothèque libre (licence MIT) suffisent, simplifiés,
  pour reconnaître un pays à 24 px.
