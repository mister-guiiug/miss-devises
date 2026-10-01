# Recherche : décisions techniques

Chaque décision dit ce qui a été retenu, pourquoi, et ce qui a été écarté.
Les mesures datent du 01/10/2026.

## R1. Les sources de taux

**Décision** : une source par devise, la même pour le taux du jour et pour son
historique.

- Les 29 devises que publie la BCE passent par **Frankfurter**
  (`https://api.frankfurter.dev/v1/`) : taux de référence officiels, publiés
  les jours ouvrés vers 16 h, et une série d'un an en **une** requête (255
  points mesurés).
- Toutes les autres, dont l'EGP, passent par **fawazahmed0/currency-api**
  (`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<date|latest>/v1/currencies/eur.json`,
  repli `https://<date|latest>.currency-api.pages.dev/v1/currencies/eur.json`) :
  340 codes, une mise à jour quotidienne, un fichier par jour.

**Pourquoi** : la BCE ne publie pas l'EGP, exemple même de la demande. Une seule
source par devise garantit que la courbe et le taux affiché ne se contredisent
pas.

**Vérifié** : les deux répondent sans clé et en CORS (`Access-Control-Allow-Origin: *`,
Frankfurter seulement en présence d'un `Origin`, ce que fait tout navigateur) ;
un fichier daté de fawazahmed0 reste servi (2025-10-01 : 200).

**Écarté** : exchangerate.host et open.er-api.com (clé, ou pas d'historique) ;
la BCE seule (pas d'EGP) ; le marché seul (pas de série en une requête).

## R2. L'historique de la source de marché

**Décision** : des dates échantillonnées sur une grille fixe, chacune lue une
fois puis gardée : tous les deux jours sur un mois (16 points), chaque lundi sur
6 mois (27) et sur un an (53). Six requêtes en parallèle au plus.

**Pourquoi** : un fichier daté ne change plus ; une grille fixe fait que 6 mois
et 1 an partagent leurs lundis, et qu'une seconde consultation ne coûte rien. Un
an coûte 53 requêtes d'environ 5 ko compressés la première fois, puis zéro.

**Écarté** : un point par jour (365 requêtes par an).

## R3. Arrondir et afficher

**Décision** : le calcul garde toute la précision ; l'arrondi n'a lieu qu'à
l'affichage, aux décimales de la devise que rend `Intl.NumberFormat`
(`resolvedOptions().maximumFractionDigits`), par `formatCurrency` du socle.

**Pourquoi** : arrondir en route accumule les erreurs dans les deux sens ;
`Intl` connaît les décimales de toutes les devises ISO, pas seulement des 41
illustrées.

## R4. Lire une saisie

**Décision** :

1. retirer les espaces (y compris insécables et fines) ;
2. si `,` et `.` sont présents, le plus à droite est le séparateur décimal ;
3. sinon, un séparateur répété sépare des milliers ;
4. sinon, un séparateur unique est décimal s'il est celui de la langue, ou s'il
   n'est pas suivi d'exactement trois chiffres ; il sépare des milliers sinon.

Ainsi « 12,5 » et « 12.5 » valent douze et demi dans les deux langues, et
« 1.234 » vaut mille deux cent trente-quatre en français. Un nombre négatif ou
deux séparateurs décimaux rendent la saisie invalide, sans l'effacer.

## R5. Décomposer un montant

**Décision** : l'algorithme glouton, en unités mineures entières, sur les
billets et pièces encore émis, du plus grand au plus petit ; ce qui reste sous la
plus petite pièce est dit comme tel.

**Pourquoi** : le glouton donne toujours une composition juste, et le nombre
minimal de coupures dans un système canonique (1-2-5, ou 25-50). Les entiers
évitent les erreurs de virgule flottante (0,1 + 0,2).

**Vérifié sur le relevé du 01/10/2026**, contre une programmation dynamique :
40 systèmes sur 41 sont canoniques. La roupie mauricienne ne l'est pas : un
billet de 25 et une pièce de 20 coexistent, et 40 roupies donnent 25 + 10 + 5
au lieu de 20 + 20. La composition reste juste, avec une coupure de plus ; un
test du jeu de données fige cette exception, et en signalerait une nouvelle.

## R6. Dessiner billets et pièces

**Décision** : du SVG. Un billet est un rectangle arrondi à ses proportions
réelles quand le jeu de données les donne (sinon 2 : 1), à sa couleur
dominante, avec la valeur et le code. Une pièce est un disque à son diamètre
relatif, d'une teinte par métal ; le bimétal porte un anneau. Le texte est noir
ou blanc selon le contraste le plus fort (calcul WCAG). Chaque dessin porte un
libellé accessible.

**Pourquoi** : la reproduction des billets est encadrée par la BCE et interdite
par plusieurs banques centrales ; une forme stylisée reste reconnaissable et ne
pèse rien.

**Écarté** : des photos ou des scans (droit, poids, contraste non maîtrisé).

## R7. La courbe d'historique

**Décision** : la géométrie `sparkline` du socle (`project`, `toPolyline`,
`extent`) dans un SVG de l'écran, le plus haut et le plus bas en `Stat` du
socle, et `describeSeries` pour la description lue au lecteur d'écran.

**Écarté** : une bibliothèque de graphiques (plusieurs dizaines de ko pour une
courbe).

## R8. Fraîcheur et hors ligne

**Décision** : au démarrage, le dernier taux gardé s'affiche aussitôt, puis
l'application le rafraîchit en arrière-plan, au plus une fois par heure et au
retour en ligne. Un taux de plus de 3 jours s'affiche en avertissement : la BCE
ne publie ni le week-end ni les jours fériés, et le taux du vendredi lu un lundi
ne doit pas alarmer.

Clés IndexedDB (base `miss-devises`) : `taux:bce`, `taux:marche` (dernier
instantané de chaque source), `serie:bce:<code>:<début>:<fin>`, `jour:<date>`
(fichier du marché d'une date, toutes devises).

## R9. La liste des devises

**Décision** : les codes ISO 4217 que la source de marché fournit et que
`Intl.DisplayNames` sait nommer, sans les métaux, les fonds et les codes de
test (XAU, XAG, XPD, XPT, XDR, XSU, XUA, XTS, XXX, XBA à XBD), ni les codes
non ISO de la source (cryptomonnaies). Recherche par code ou par nom, sans
accents ni casse. Les devises récentes passent en tête.

## R10. Confidentialité et CSP

**Décision** : `connect-src` limité à `https://api.frankfurter.dev`,
`https://cdn.jsdelivr.net` et `https://*.currency-api.pages.dev`, en plus de ce
que le squelette autorise. Ces trois tiers sont nommés dans la section
« Confidentialité » du README : ils voient l'adresse IP de qui consulte un taux,
rien d'autre ; aucun cookie.

## R11. Ce qui part du squelette

**Décision** : l'exemple des notes, la couche Supabase (adaptateur, file hors
ligne, migrations, tests pgTAP, trois workflows) et l'écran de compte.

**Pourquoi** : l'application ne connaît pas de compte (EF-014). Ces couches
restent disponibles dans le squelette le jour où un besoin de synchronisation
apparaîtrait ; ici, elles ne feraient que se construire et se tester sans
servir.
