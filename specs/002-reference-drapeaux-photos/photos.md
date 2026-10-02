# Les photos des billets et des pièces

Le jeu `src/data/photos.json`, relevé le 02/10/2026 : pour chaque coupure du jeu
des coupures (`coupures.json`), au plus une photo hébergée sur Wikimedia
Commons. Ce document dit comment il a été fait, ce qu'il couvre, ce qu'il
écarte et pourquoi.

**Couverture** : 136 coupures sur 465 (79 billets sur 237, 57 pièces sur 228),
dans 16 devises sur 41. Un test compare ce chiffre au jeu.

## La méthode

1. **Le relevé** : pour chaque devise, les fichiers que montrent les tableaux de
   coupures des articles Wikipédia (anglais, puis la langue du pays), vérifiés
   sur l'API de Commons. Un fichier local à un Wikipédia (non libre, au titre
   de l'usage loyal) est écarté : son usage n'est permis que sur Wikipédia.
   Chaque fichier retenu a été regardé : une seule face, la bonne coupure, la
   série en circulation.
2. **Le droit** : le statut de chaque émetteur sur Commons (page
   [Commons:Currency](https://commons.wikimedia.org/wiki/Commons:Currency) et
   ses sections par pays), puis les règles de reproduction de chaque émetteur,
   puis le Code pénal français (articles 442-1 et 442-6). Trois couches
   indépendantes : il faut franchir les trois.
3. **La construction** : un script relit chaque fichier retenu sur l'API de
   Commons (présence, dimensions, licence, auteur, catégories de suppression)
   et demande sa vignette au palier choisi. L'adresse est gardée telle que
   l'API la rend.

## La politique

**Admises**, quand Commons admet les dessins et que l'émetteur le permet :

| Devise | Billets | Pièces | Condition tenue                                                                   |
| ------ | ------- | ------ | --------------------------------------------------------------------------------- |
| EUR    | oui     | oui    | billets marqués SPECIMEN (images de la BCE) ; pièces : la face commune            |
| USD    | oui     | oui    | une face, bien moins de 75 % de la taille réelle                                  |
| CHF    | oui     | oui    | billets de la BNS marqués SPECIMEN ; exclus du droit d'auteur en Suisse           |
| JPY    | oui     | non    | billets marqués 見本 ; Commons ne traite pas les pièces                           |
| CZK    | non     | oui    | billets : le SPECIMEN qu'exige la CNB manque aux fichiers                         |
| HUF    | oui     | non    | billets marqués MINTA ; pièces : statut au cas par cas sur Commons                |
| RON    | oui     | oui    | la loi roumaine exclut les moyens de paiement du droit d'auteur                   |
| TRY    | oui     | non    | billets marqués SPECIMEN ; pièces : 72 dpi impossibles à 120 px                   |
| ILS    | oui     | oui    | crédit à la Banque d'Israël, ajouté à chaque photo                                |
| EGP    | oui     | oui    | aucune restriction relevée                                                        |
| JOD    | oui     | non    | permission de la Banque centrale ; pièces : seulement des montages                |
| KRW    | oui     | oui    | billets de la Banque de Corée marqués 보기 (spécimen)                             |
| INR    | oui     | oui    | GODL-India : le crédit nomme l'auteur, la licence et la source                    |
| IDR    | oui     | oui    | billets de Bank Indonesia marqués SPESIMEN                                        |
| BRL    | non     | oui    | billets : le « SEM VALOR » qu'exige la Banque centrale manque                     |
| PHP    | non     | oui    | billets : autorisation de la BSP ; pièces : seule la copie en métal est interdite |

**Écartées** :

- **refusées par Commons** : GBP, CAD, AUD, NZD, SEK, NOK, DKK, PLN, AED, ZAR,
  CNY, HKD, MYR, SGD, THB, VND, MXN, ARS. Des fichiers de certaines existent
  sur Commons, sous la licence de leur photographe, mais le dessin reste
  protégé ; un test garde ces devises hors du jeu ;
- **incertaines sur Commons** : ISK, MAD, TND, MUR, XOF, XPF ;
- **sans fichier** : XAF (aucune image de la série en circulation) ;
- **montages recto-verso**, quand aucune face seule n'existe : 10 c et 50 c
  suisses, 2 et 10 shekels, 10 piastres et ½ dinar jordaniens ;
- **anciens dessins** : 5 cents et 1 dollar américains (les avers courants ne
  sont pas libres) ;
- **provenance douteuse** : 2 centimes d'euro (rendu officiel présenté comme
  travail personnel), 1 euro (image Pixabay invérifiable).

**La face montrée** : le recto d'un billet ; pour une pièce, la face que
l'émetteur appelle avers, sauf la couronne tchèque, dont l'avers (le lion) est
le même sur toutes les pièces : c'est la face de la valeur qui est montrée.

**La taille** : une vignette de 330 px pour un billet couché (moins de 72 dpi à
la taille réelle pour tout billet de plus de 116 mm, ce que la BCE, la CNB et
la TCMB exigent d'une image en ligne), 120 px pour un billet debout (9e série
suisse) et pour une pièce. Un original plus étroit (1 centime d'euro, 50 et
100 wons) est servi tel quel.

## Les doutes

- **USD 25 c** : avers de 2022, « présumé » dans le domaine public par Commons.
- **EUR 1 c** : l'image officielle de la BCE ne fait que 105 px ; sa base
  légale est la permission de la Commission (`{{Euro coin common face}}`),
  l'API ne rend aucune licence.
- **KRW 50 et 100** : les seules images d'une face seule font 71 et 87 px.
- **RON 50 à 500** : les fichiers portent les armoiries de 1992 ; les billets
  imprimés depuis 2018 portent celles de 2016, le dessin est le même.
- **CHF 5 c** : Commons ne nomme pas l'auteur de la photo ; le crédit le dit.

## Revérifier

Commons peut renommer, remplacer ou supprimer un fichier. L'application ne s'en
plaint pas (la photo manquante rend son dessin), mais le jeu vieillit.
`npm run photos:verifier` relit chaque fichier sur l'API de Commons (présence,
suppression proposée, dimensions, licence) et dit chaque écart ; il interroge
le réseau, il ne tourne donc pas en CI. Après un écart : relever à nouveau,
regarder les vignettes, mettre à jour ce document et sa couverture.
