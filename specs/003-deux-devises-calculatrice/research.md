# Recherche : deux devises à la fois, et une mini-calculatrice

Chaque décision : ce qui est retenu, pourquoi, ce qui est écarté. Les
recherches des spécifications 001 et 002 restent valables.

## R1. Trois champs, un pivot : la référence

**Décision** : la seconde devise S forme avec la référence R une paire de plus,
lue exactement comme la paire (R, D) de la 002 (R1) : une source, une date, un
taux croisé sans arrondi. Toute saisie se ramène d'abord à un montant en
référence (sans marge), puis chaque champ calculé s'en déduit au taux de SA
paire, et la marge s'applique une fois, à la fin :

- saisie en R : `r = v` ;
- saisie en D : `r = v / taux(R, D)` ;
- saisie en S : `r = v / taux(R, S)` ;
- puis `D = r × taux(R, D) × (1 − marge)`, `S = r × taux(R, S) × (1 − marge)`,
  `R = r × (1 − marge)` pour les champs qui ne sont pas saisis.

**Pourquoi** : chaque montant affiché se rattache à la référence par un taux
que l'écran montre, avec sa source et sa date (principe I). Les trois champs
restent cohérents entre eux : `D / taux(R, D) = S / taux(R, S) = R`.

**Écarté** :

- un taux direct entre D et S, lu sur un seul relevé : il faudrait l'afficher
  (principe I), et les trois champs se contrediraient dès que les deux paires
  n'ont pas la même source (la BCE pour USD, le marché pour EGP) ;
- plusieurs secondes devises : l'écran ne tiendrait plus sans défilement
  (principe IV), et la demande en nomme deux.

## R2. Lire un calcul sans `eval`

**Décision** : un analyseur de quelques lignes (`src/domain/calcul.ts`) :

1. le texte se coupe aux opérateurs `+ - − × ÷ * /` ;
2. chaque nombre se lit par `lireMontant` (001, R4) : « 1 234,5 », « 1.234 »,
   « 12,5 » et « 12.5 » s'y lisent comme dans un champ simple ;
3. × et ÷ d'abord, puis + et −, de gauche à droite ;
4. un opérateur final est ignoré (frappe en cours) ; un opérateur en tête, deux
   de suite ou un nombre illisible rendent « illisible » ; une division par
   zéro, « division » ; un résultat négatif, « négatif ».

**Pourquoi** : la CSP du parc refuse `unsafe-eval` ; `Function` comme `eval`
exécuteraient du code tapé ; les règles de lecture d'un nombre restent celles
qui sont déjà testées.

**Écarté** : une bibliothèque d'expressions (mathjs, expr-eval) : des dizaines
de kilo-octets pour quatre opérateurs, et sa propre lecture des nombres, qui
ignorerait la virgule française.

## R3. Retenir le clavier du téléphone

**Décision** : calculatrice allumée, les champs passent en
`inputMode="none"` : ils gardent le focus et le curseur, le téléphone n'ouvre
pas son clavier, un clavier physique écrit toujours. Les touches du pavé
empêchent la prise du focus au pointeur (`pointerdown` → `preventDefault`) :
le champ garde le sien, et l'anneau de focus montre où le pavé écrit. Au
clavier, les touches se parcourent à la tabulation comme des boutons.

**Pourquoi** : `readOnly` retirerait le champ de la saisie au clavier physique
et le ferait annoncer « lecture seule » ; `inputMode="none"` est reconnu par
Chrome et Safari depuis 2019.

## R4. Où écrit le pavé

**Décision** : dans le dernier champ qui a reçu le focus, la « cible », par
défaut le champ saisi. Dans une cible qui n'est pas le champ saisi, un chiffre
ou la virgule commencent une saisie neuve ; un opérateur prolonge le montant
affiché (« 3,40 + »). « ⌫ » retire le dernier caractère, et un opérateur avec
ses espaces ; « C » vide le champ ; une seconde virgule dans un même nombre
est ignorée ; un opérateur qui suit un opérateur le remplace.

**Pourquoi** : c'est le geste d'une calculatrice de poche (le premier chiffre
remplace l'affichage, un opérateur le reprend), et la règle tient en une
fonction pure, testée sans écran.

## R5. « = » et l'arrondi

**Décision** : « = » remplace le calcul par son résultat, arrondi aux décimales
de la devise du champ et écrit comme un montant calculé (« 20,00 »). Avant,
le résultat sous le champ s'écrit arrondi à l'affichage seulement, et les
conversions partent du résultat exact.

**Pourquoi** : le principe I arrondit à l'affichage ; « = » est un geste de
l'utilisateur, qui fait du résultat sa saisie.
