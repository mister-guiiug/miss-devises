# Spécification : deux devises à la fois, et une mini-calculatrice

**Branche** : `003-deux-devises-calculatrice`
**Créée le** : 26/10/2026
**Statut** : validée pour la planification
**Demande d'origine** : « ajouter la possibilité de choisir 2 monnaies en même
temps : par exemple conversion en euros pour le dollar et EGP. Ajouter une
fonctionnalité pour basculer sur une mini calculatrice sur la saisie des
montants. »

## Scénarios et tests _(obligatoire)_

### Récit 1 : convertir vers deux devises à la fois (priorité P1)

En Égypte, il paie en livres et négocie parfois en dollars, mais il compte en
euros. À côté de la devise de l'écran Convertir, il ajoute le dollar : trois champs
liés, euro, livre et dollar. Il tape dans n'importe lequel, les deux autres se
remplissent, et chaque devise a sa ligne de taux, avec sa source et sa date.

**Pourquoi cette priorité** : demandé explicitement. C'est l'usage d'un voyage
où deux devises circulent, et l'écran ne le permettait qu'en changeant de
devise à chaque prix.

**Test indépendant** : avec des taux connus, ajouter USD à la paire EUR-EGP,
saisir dans chacun des trois champs, vérifier les deux autres ; recharger,
retrouver USD ; le retirer, retrouver l'écran d'avant.

**Scénarios d'acceptation** (taux de l'exemple : marché 58,83 EGP pour 1 €,
BCE 1,0812 USD pour 1 €) :

1. **Étant donné** une première ouverture, **alors** l'écran n'a que la paire
   et se comporte comme avant cette spécification ; un bouton « + Devise »,
   nommé « Ajouter une devise », se trouve à côté du choix de la devise.
2. **Étant donné** la référence EUR, la devise EGP et la seconde devise USD,
   **quand** je saisis 20 dans le champ des euros, **alors** le champ des
   livres affiche 1 176,60 et celui des dollars 21,62.
3. **Étant donné** la même paire, **quand** je saisis 200 dans le champ des
   livres, **alors** les euros affichent 3,40 et les dollars 3,68.
4. **Étant donné** la même paire, **quand** je saisis 10 dans le champ des
   dollars, **alors** les euros affichent 9,25 et les livres 544,12.
5. **Étant donné** la seconde devise USD, **alors** deux lignes de taux se
   lisent : « 1 € = 58,83 EGP », taux de marché, et « 1 € = 1,0812 USD », taux
   de référence de la BCE, chacune avec sa date.
6. **Étant donné** le choix de la seconde devise, **alors** il ne propose ni la
   référence ni la devise ; choisir la seconde devise comme devise principale
   les échange ; choisir la seconde devise comme référence fait de l'ancienne
   référence la seconde devise.
7. **Étant donné** la seconde devise, **quand** je la retire, **alors** l'écran
   revient à la paire ; un montant saisi en dollars reste, converti, dans le
   champ des euros.
8. **Étant donné** une marge de bureau, **alors** elle s'applique à chacun des
   deux montants calculés, comme à celui de la paire.
9. **Étant donné** un montant saisi en dollars, **quand** je l'enregistre au
   carnet, **alors** le carnet garde une conversion de 10 dollars vers
   l'euro, au taux de la paire euro-dollar, avec sa source et sa date.

---

### Récit 2 : une mini-calculatrice dans la saisie (priorité P2)

Au marché, elle additionne trois prix avant de les convertir. Un bouton
« Calculatrice » remplace le clavier du téléphone par un pavé : chiffres,
virgule, + − × ÷, effacer, égal. Elle tape « 12,5 + 7,5 » dans le champ des
euros : le résultat, 20,00 €, s'écrit sous le champ, et les livres se
remplissent déjà.

**Pourquoi cette priorité** : demandé explicitement ; il sert surtout au
téléphone, dont le clavier décimal n'a pas d'opérateurs.

**Test indépendant** : activer la calculatrice, taper un calcul au pavé dans un
champ, lire le résultat et les conversions ; « = » écrit le résultat ;
recharger, retrouver la calculatrice active.

**Scénarios d'acceptation** :

1. **Étant donné** une première ouverture, **alors** la calculatrice est
   éteinte : les champs ouvrent le clavier du téléphone, comme avant.
2. **Étant donné** la calculatrice activée, **alors** un pavé s'affiche sous
   les champs, les champs n'ouvrent plus le clavier du téléphone, et le choix
   survit au rechargement.
3. **Étant donné** la paire EUR-EGP, **quand** je tape au pavé
   « 12,5 + 7,5 » dans le champ des euros, **alors** le champ montre le
   calcul, « = 20,00 € » s'écrit sous lui, et les livres affichent 1 176,60.
4. **Étant donné** ce calcul, **quand** j'appuie sur « = », **alors** le
   champ des euros affiche 20,00.
5. **Étant donné** des opérations mêlées, **alors** × et ÷ passent avant + et
   − : « 2 + 3 × 4 » vaut 14.
6. **Étant donné** un calcul qui finit par un opérateur (« 12 + »), **alors**
   les conversions suivent 12, sans message d'erreur : c'est une frappe en
   cours.
7. **Étant donné** « 12 ÷ 0 », **alors** le champ dit « Division par zéro » ;
   « 5 − 8 », **alors** il dit « Le calcul donne un montant négatif » ; les
   autres champs restent vides.
8. **Étant donné** le pavé, **quand** je touche un autre champ, **alors** le
   pavé écrit dans celui-ci : un chiffre remplace le montant calculé, un
   opérateur le prolonge (« 3,40 + »).
9. **Étant donné** la calculatrice éteinte, **quand** je tape « 12+8 » au
   clavier d'un ordinateur, **alors** le calcul est compris de la même façon.
10. **Étant donné** un lecteur d'écran, **alors** le pavé est un groupe nommé
    « Calculatrice », chaque touche dit ce qu'elle fait (« plus », « divisé
    par », « effacer le dernier caractère »…), et le bouton de la calculatrice
    dit s'il est enfoncé.

### Cas limites

- **Seconde devise sans taux** : son champ reste vide et sa ligne le dit ; la
  paire n'en est pas affectée.
- **Seconde devise qui devient la référence ou la devise** (réglages, carnet
  rouvert) : elle s'échange avec celle qu'elle remplace, ou, en rouvrant une
  ligne du carnet, se retire si elle y est déjà.
- **Hors ligne** : les deux lignes de taux disent « derniers taux connus ».
- **Calcul très long** : le champ défile, le résultat sous lui reste entier.
- **Séparateur décimal** : la touche du pavé est la virgule en français, le
  point en anglais ; au clavier, les deux sont compris (001, R4).
- **Très petits écrans** : rien ne déborde sur 320 px, pavé compris.

## Exigences _(obligatoire)_

### Exigences fonctionnelles

- **EF-001** : l'utilisateur DOIT pouvoir ajouter une seconde devise à la
  paire, la changer et la retirer ; aucune par défaut ; le choix gardé.
- **EF-002** : la seconde devise NE DOIT jamais être la référence ni la devise.
- **EF-003** : les trois champs DOIVENT être liés : une saisie dans l'un
  remplit les deux autres, en passant par la référence.
- **EF-004** : chaque devise DOIT avoir sa ligne de taux, avec sa source et sa
  date ; aucun taux entre les deux devises n'est affiché.
- **EF-005** : une conversion saisie dans la seconde devise DOIT s'enregistrer
  au carnet comme une paire seconde devise → référence, à son taux.
- **EF-006** : l'utilisateur DOIT pouvoir activer et éteindre un pavé de
  calculatrice ; éteint par défaut ; le choix gardé.
- **EF-007** : un champ de montant DOIT comprendre un calcul (+, −, ×, ÷, avec
  `*`, `/` et `-` au clavier), avec la priorité usuelle, pavé allumé ou non.
- **EF-008** : un calcul valide DOIT montrer son résultat sous le champ ; « = »
  DOIT le remplacer par ce résultat, aux décimales de la devise du champ.
- **EF-009** : un calcul impossible (division par zéro, résultat négatif,
  saisie illisible) DOIT le dire, sans remplir les autres champs.
- **EF-010** : le pavé DOIT écrire dans le dernier champ touché, être
  utilisable au clavier et au lecteur d'écran, et ne pas ouvrir le clavier du
  téléphone.

### Entités clés

- **Préférences** : s'ajoutent la seconde devise (un code, ou aucune) et l'état
  de la calculatrice ; sans changer de version.
- **Saisie** : le champ saisi peut être celui de la seconde devise ; le texte
  peut être un calcul.

## Critères de réussite _(obligatoire)_

### Résultats mesurables

- **CR-001** : sans seconde devise et calculatrice éteinte, les parcours des
  spécifications 001 et 002 passent à l'identique (e2e).
- **CR-002** : les chiffres des scénarios 2 à 4 du récit 1 et 3 à 7 du récit 2
  sont vérifiés par des tests (Vitest et e2e).
- **CR-003** : les deux choix survivent à un rechargement.
- **CR-004** : sur 320 px, rien ne déborde, pavé et seconde devise compris ;
  axe ne relève aucune violation, pavé ouvert, dans les deux thèmes.
- **CR-005** : avec la seconde devise, les trois champs et les deux lignes de
  taux tiennent sans défilement sur un téléphone de 390 × 844.
- **CR-006** : le poids reste sous le budget de `package.json`.

## Clarifications

### Séance du 26/10/2026

- Q : « conversion en euros pour le dollar et EGP » : l'euro vers deux
  devises, ou deux devises vers l'euro ? → R : les deux. Les trois champs
  sont liés : on saisit en euros pour lire les deux devises, ou dans l'une
  pour lire l'euro et l'autre (choix retenu pour couvrir les deux lectures).
- Q : deux devises, ou plus ? → R : deux, comme demandé : la paire et une
  seconde devise. Au-delà, l'écran ne tiendrait plus sans défilement
  (principe IV).
- Q : où vit la seconde devise ? → R : sur l'écran Convertir, sous la devise ;
  le volet des billets, l'historique et la décomposition restent ceux de la
  paire.
- Q : la calculatrice, un écran à part ? → R : non : un pavé qui remplace le
  clavier du téléphone dans la saisie même, et qu'on allume ou éteint
  (« basculer »).
- Q : « = » arrondit-il ? → R : oui, aux décimales de la devise du champ :
  le résultat devient la saisie, comme si on l'avait tapé. Avant « = », le
  calcul n'est pas arrondi (principe I).

## Hypothèses

- Les sources de taux et le taux d'une paire restent ceux de la
  spécification 002 : la seconde devise forme avec la référence une paire de
  plus, lue de la même façon.
- Un calcul de courses tient en quelques opérations : ni parenthèses, ni
  pourcentage, ni mémoire.
