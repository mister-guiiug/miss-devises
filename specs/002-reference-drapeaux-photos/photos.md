# Les photos des billets et des pièces

Le jeu `src/data/photos.json`, relevé le 02/10/2026 : pour chaque coupure du jeu
des coupures (`coupures.json`), au plus une photo hébergée sur Wikimedia
Commons. Ce document dit comment il a été fait, ce qu'il couvre, ce qu'il
écarte et pourquoi.

**Couverture** : 110 coupures sur 465 (63 billets sur 237, 47 pièces sur 228),
dans 14 devises sur 41. Un test compare ce chiffre au jeu.

**Revue juridique du 02/10/2026**, après la mise en ligne : la roupie
indonésienne, les billets égyptiens, les pièces brésiliennes et le quarter
américain repassent en dessins, et les crédits gagnent le titre du fichier et
le lien vers le texte de la licence (voir « Les crédits » et « Les doutes »).

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
| USD    | oui     | oui    | une face, bien moins de 75 % de la taille réelle ; pièces de 1, 10 et 50 c        |
| CHF    | oui     | oui    | billets de la BNS marqués SPECIMEN ; exclus du droit d'auteur en Suisse           |
| JPY    | oui     | non    | billets marqués 見本 ; Commons ne traite pas les pièces                           |
| CZK    | non     | oui    | billets : le SPECIMEN qu'exige la CNB manque aux fichiers                         |
| HUF    | oui     | non    | billets marqués MINTA ; pièces : statut au cas par cas sur Commons                |
| RON    | oui     | oui    | la loi roumaine exclut les moyens de paiement du droit d'auteur                   |
| TRY    | oui     | non    | billets marqués SPECIMEN ; pièces : 72 dpi impossibles à 120 px                   |
| ILS    | oui     | oui    | « droits réservés à la Banque d'Israël » au crédit ; 70 % de la taille au plus    |
| EGP    | non     | oui    | billets : licence du ministre de l'Intérieur exigée (Code pénal, art. 204 bis A)  |
| JOD    | oui     | non    | permission de la Banque centrale ; pièces : seulement des montages                |
| KRW    | oui     | oui    | billets de la Banque de Corée marqués 보기 (spécimen)                             |
| INR    | oui     | oui    | GODL-India : le crédit nomme l'auteur, la licence et la source                    |
| PHP    | non     | oui    | billets : autorisation de la BSP ; pièces : seule la copie en métal est interdite |

**Écartées** :

- **refusées par Commons** : GBP, CAD, AUD, NZD, SEK, NOK, DKK, PLN, AED, ZAR,
  CNY, HKD, MYR, SGD, THB, VND, MXN, ARS. Des fichiers de certaines existent
  sur Commons, sous la licence de leur photographe, mais le dessin reste
  protégé ; un test garde ces devises hors du jeu ;
- **incertaines sur Commons** : ISK, MAD, TND, MUR, XOF, XPF ;
- **écartées par prudence** :
  - IDR : la loi indonésienne 7/2011 (art. 24) ne permet une imitation de la
    rupiah, image comprise, qu'avec la mention « spesimen », que les pièces
    n'ont pas, et la fiche du groupe des banques centrales contre la
    contrefaçon (CBCDG) exige pour les billets une permission préalable de
    Bank Indonesia ;
  - BRL : la loi 4.511/1964 (art. 13) et la politique de la Banque centrale
    du Brésil soumettent toute diffusion d'images de billets ou de pièces au
    Departamento do Meio Circulante, au préalable ; les billets n'avaient
    déjà pas leur « SEM VALOR » ;
  - billets EGP : le Code pénal égyptien (art. 204 bis A) soumet toute image
    d'un billet circulant en Égypte à une licence du ministre de
    l'Intérieur. Rien de tel pour les pièces, qui restent ;
- **sans fichier** : XAF (aucune image de la série en circulation) ;
- **montages recto-verso**, quand aucune face seule n'existe : 10 c et 50 c
  suisses, 2 et 10 shekels, 10 piastres et ½ dinar jordaniens ;
- **anciens dessins** : 5 cents et 1 dollar américains (les avers courants ne
  sont pas libres) ;
- **droits incertains** : 25 cents américains. Commons tient l'avers de 2022
  pour « présumé » libre, et certains dessins de pièces sont sous des droits
  cédés à la Monnaie des États-Unis, dont la liste n'a pas pu être lue ;
- **provenance douteuse** : 2 centimes d'euro (rendu officiel présenté comme
  travail personnel), 1 euro (image Pixabay invérifiable).

**La face montrée** : le recto d'un billet ; pour une pièce, la face que
l'émetteur appelle avers, sauf la couronne tchèque, dont l'avers (le lion) est
le même sur toutes les pièces : c'est la face de la valeur qui est montrée.

**La taille** : une vignette de 330 px pour un billet couché (moins de 72 dpi à
la taille réelle pour tout billet de plus de 116 mm, ce que la BCE, la CNB et
la TCMB exigent d'une image en ligne), 120 px pour un billet debout (9e série
suisse) et pour une pièce. Un original plus étroit (1 centime d'euro, 50 et
100 wons) est servi tel quel. Jamais de variante 2x : à 500 px, un billet
dépasserait 72 dpi. À l'écran, chaque coupure fait au plus 70 % de sa taille
réelle au pixel de référence, ce que la Banque d'Israël exige ; un test le
vérifie pour chaque photo.

**L'image telle quelle** : ni filtre, ni recadrage, rien posé dessus ; le lien
« Crédit » se tient à côté. Un billet debout tourne d'un quart pour prendre la
place d'un billet couché.

## Les crédits

Pour chaque photo, un lien « Crédit » vers sa page Commons, et une ligne dans
la liste « Crédits des photos » du volet : la coupure, le **titre du fichier**
(que les licences CC 2.0 à 3.0 exigent), son auteur, sa **licence liée à son
texte** quand elle en a un (les CC veulent le lien, pas seulement le nom), et
la page Commons. S'y ajoutent « droits réservés à la Banque d'Israël »
(exigé), « © BCE » et « face commune © Union européenne » (par courtoisie).

## Les doutes

- **EGP, pièces** : Commons admet les dessins en les tenant pour des
  « documents officiels » exclus du droit d'auteur, lecture que la loi
  égyptienne ne dit pas en propres termes ; le Code pénal ne vise que les
  billets. Gardées, à confirmer.
- **JOD** : la seule règle trouvée est celle que rapporte Commons (au plus les
  2/3 de la taille, une face) ; la Banque centrale de Jordanie n'en publie
  aucune.
- **INR** : Commons range les images de la RBI sous GODL-India, licence qui
  exclut pourtant les symboles officiels (l'emblème figure sur les billets et
  les pièces).
- **EUR, billets** : le « specimen » des images de la BCE est en lettres
  détourées, quand la décision demande un mot opaque ; ce sont les images de
  la BCE elle-même.
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
