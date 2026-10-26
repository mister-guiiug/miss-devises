# Recherche : les frais d'une conversion, et les phrases parlées

## R1. Le calcul des frais

**Décision** : sur le montant indicatif en référence `r` (sans la marge du
bureau), frais `f = r × p / 100 + F`, où `F` est le montant fixe converti en
référence ; coût `r + f`. Le montant fixe dans une devise `D` se convertit par
`F = fixe / taux(R, D)`, le taux de la paire tel que l'écran le lit
(spécification 002, R1) ; si `D` est la référence, `F = fixe`. Aucun arrondi
avant l'affichage.

**Pourquoi** : une carte paie au taux du réseau, proche du taux indicatif ; les
frais de la banque s'y ajoutent. Cumuler marge et frais compterait deux fois
l'écart du change.

## R2. Où montrer le coût

**Décision** : une ligne sous les montants, avant la ligne de taux : le choix
des frais (une liste déroulante native, « Aucun » d'abord) et, avec un
montant, le coût et le détail. Absente tant qu'aucun frais n'existe.

**Pourquoi** : la liste native est la plus compacte et la plus accessible au
doigt comme au lecteur d'écran ; la ligne n'ajoute rien à qui n'a pas de frais
(CR-001).

## R3. Choisir une voix

**Décision** : parmi `speechSynthesis.getVoices()`, dans l'ordre :

1. la langue exacte (`ar-EG`), une voix locale (`localService`) d'abord ;
2. une correspondance connue : `zh-Hans` → `zh-CN`, `fil` → `tl` ;
3. la langue de base (`ar`), voix locale d'abord.

Les codes se comparent sans casse, `_` lu comme `-` (Android écrit `th_TH`).
La liste arrive parfois en différé : l'écran l'écoute (`voiceschanged`).

**Pourquoi** : une voix locale marche hors ligne ; une voix de la langue de
base lit correctement la variante écrite (l'arabe égyptien s'écrit en
alphabet arabe).

## R4. Dire une phrase

**Décision** : `SpeechSynthesisUtterance` avec la langue et la voix, vitesse
0,85 ; toute lecture en cours s'arrête d'abord (`cancel`). L'énoncé est gardé
dans une variable du module jusqu'à `end` ou `error` : sinon le ramasse-miettes
de certains navigateurs le libère en cours de route, et la fin de la phrase
saute (relevé dans le parc, note « Utterance ramassé par le GC »).
