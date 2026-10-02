# Recherche : monnaie de référence, drapeaux, photos et À propos

Chaque décision : ce qui est retenu, pourquoi, ce qui est écarté. La recherche
de la spécification 001 (R1 à R11) reste valable sauf mention contraire.

## R1. Le taux croisé

**Décision** : les deux sources publient tout contre l'euro. Le taux d'une
paire (référence R, devise D), en unités de D pour une unité de R, est
`taux[D] / taux[R]`, lus dans le MÊME instantané, l'euro valant 1. La source
d'une paire est la BCE quand elle publie R et D (l'euro compte comme publié),
le marché sinon ; si le marché ignore l'une des deux, la paire n'a pas de taux.
Aucun arrondi : il se fait à l'affichage (001, R3).

**Pourquoi** : un seul instantané, c'est une seule source et une seule date ;
la ligne de taux peut dire les deux sans mentir (principe I). Aucune requête de
plus pour le taux du jour.

**Écarté** :

- la BCE pour l'une, le marché pour l'autre : deux dates, et un taux qu'aucune
  source n'a publié ;
- `base=R` chez Frankfurter : une requête par changement de référence, pour un
  calcul que Frankfurter fait de la même façon, et rien pour le marché.

## R2. L'historique d'une paire

**Décision** :

- **BCE** : une requête pour l'année, `symbols=R,D` (un seul code si l'une des
  deux est l'euro). Chaque code reste gardé sous sa clé de la 001,
  `serie:bce:<code>:<début>:<fin>` : une série lue pour une paire sert aux
  autres. Le point d'une date est le rapport des deux taux de cette date ; une
  date où l'un manque est sautée.
- **Marché** : la grille de la 001 (R2) ; chaque `jour:<date>` contient toutes
  les devises, le taux croisé s'y calcule sans lecture de plus.

**Pourquoi** : le critère CR-004 de la 001 tient (un an de BCE en une requête),
et le cache garde sa forme : rien à migrer dans IndexedDB.

## R3. Préférences et carnet en version 2

**Décision** :

- **Préférences**, version 2 : `reference` (EUR par défaut) ; `sensVolet` vaut
  `'devise'` ou `'reference'` ; `images` vaut `'dessins'` (défaut) ou
  `'photos'`. La migration 1 → 2 pose `reference: 'EUR'` et renomme
  `sensVolet: 'euro'` en `'reference'`. Un champ ajouté plus tard avec une
  valeur par défaut (comme `images`) ne relève pas la version : le schéma lui
  donne sa valeur, et une version antérieure de l'application l'ignore.
- **Carnet**, version 2 : chaque conversion porte `reference`, l'un de ses deux
  côtés ; `taux` s'entend en unités de l'autre côté pour une unité de la
  référence. La migration 1 → 2 pose `reference: 'EUR'` : en version 1, l'euro
  était toujours l'un des deux côtés, et `taux` y était déjà en unités de la
  devise pour un euro. Un fichier exporté en version 1 s'importe par la même
  migration.

**Pourquoi** : `versioned-store` du socle migre à la lecture comme à l'import,
et garde une copie de côté avant toute migration.

## R4. Les drapeaux

**Décision** : les drapeaux 3 : 2 de `country-flag-icons` (MIT), simplifiés,
lisibles à 24 px. Chaque fichier utilisé est émis par Vite en fichier à part
(`?url&no-inline` : sans cette option, Vite inlinerait ces fichiers de moins de
4 ko en base64 dans le JavaScript), précaché par le service worker, affiché par
un `<img alt="">` : décoratif, puisque le code et le nom de la devise sont
écrits à côté. Un liseré le détache du fond (Japon, Pologne).

La devise donne le pays par ses deux premières lettres (ISO 4217 les prend à
ISO 3166), avec trois règles :

- l'euro montre le drapeau européen ;
- un code en X (XAF, XOF, XPF, XCD, XCG…) n'appartient à aucun pays : signe
  neutre. **Piège mesuré** : la bibliothèque a des drapeaux XA, XO et XC, codes
  « attribués par l'utilisateur » (Abkhazie, Ossétie du Sud, Chypre du Nord) ;
  la règle des deux lettres aurait donné au franc CFA d'Afrique centrale le
  drapeau de l'Abkhazie ;
- le florin antillais (ANG), d'un pays dissous (AN), signe neutre.

170 drapeaux : ceux des devises actuelles, et ceux des anciennes monnaies que
la source de marché cote encore (franc, mark, lire…), que la liste montre
aussi. 100 ko bruts, 27 ko gzip s'ils étaient réunis. Un test vérifie que la
liste les couvre toutes, et ne livre rien de plus.

**Écarté** :

- les emoji de drapeaux : Windows ne les dessine pas (deux lettres à la place,
  mesuré au canevas : aucun pixel coloré) ;
- `flag-icons` (MIT aussi) : armoiries détaillées, 1 Mo brut pour les mêmes
  pays, 352 ko gzip ;
- les drapeaux en chaînes SVG dans le JavaScript : 27 ko gzip, plus que toute
  la marge du budget (23 ko) ;
- un sprite unique : il faudrait renommer les identifiants internes de chaque
  drapeau et une étape de build de plus.

## R5. Les photos

Rédigée avec le relevé : voir la tâche du récit 3 dans [tasks.md](./tasks.md).

## R6. La page À propos

**Décision** : `FamilyAbout` du socle reste le cadre (installation, grille de
la famille, pied de page : les e2e et `pwa-doctor` les attendent). Dans ses
`children`, quatre cartes :

1. l'en-tête : l'icône de l'application, son nom, une phrase, et `AppVersion`
   du socle (sans lien : le parc n'a pas de pages de version) ;
2. ce qu'elle fait : une liste courte, une icône `lucide-react` par fonction ;
3. d'où viennent les taux : chaque source nommée et liée ;
4. confidentialité : ce qui reste sur l'appareil, et chaque tiers nommé ; puis
   les crédits (drapeaux, et photos à partir du récit 3).

**Pourquoi** : la page répétait la même phrase en sous-titre et en corps, son
titre de carte doublait celui de la page, et la confidentialité était un
paragraphe sous « Billets et pièces ».

## R7. Une courbe qui se lit

**Décision** : sous la courbe, un curseur natif (`<input type="range">`) qui
parcourt les points : clavier, doigt et lecteur d'écran sans code de plus. Son
`aria-valuetext` dit la date et le taux du point, et un lecteur d'écran
l'annonce à chaque pas. La même lecture s'écrit au-dessus de la courbe, pour
l'œil, cachée au lecteur d'écran qui l'entend déjà ; la courbe marque le
point. Le pointeur sur la courbe déplace le même curseur. Les axes sont du
texte : plus haut et plus bas sur la courbe, à gauche, première et dernière
date dessous.

**Écarté** : une bibliothèque de graphiques (001, R7) ; un SVG interactif seul,
qu'aucun lecteur d'écran ne parcourt.

## R8. Le ménage du cache

**Décision** : au démarrage, après la lecture des taux gardés, l'application
efface les clés `serie:bce:*` dont la date de fin n'est pas aujourd'hui, et les
`jour:<date>` de plus de 400 jours.

**Pourquoi** : la clé d'une série de la BCE finit à la date du jour (001, R8) ;
chaque jour de consultation en écrivait une nouvelle, jamais relue ensuite,
jusqu'à 7 ko par devise et par période. Les `jour:<date>` de la grille du
marché, eux, restent utiles un an (001, R2) : au-delà, aucune grille ne les
demande.
