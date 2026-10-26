# Recherche : les mots utiles du pays

## R1. Quelles phrases

**Décision** : seize, en quatre groupes, dans cet ordre : les bases (bonjour,
merci, s'il vous plaît, non merci) ; marchander (combien, trop cher, baisser
le prix, dernier prix, d'accord) ; la monnaie (faire la monnaie d'un billet,
avoir de la petite monnaie, ne pas en avoir) ; l'addition (l'addition, payer
par carte, gardez la monnaie, une erreur).

**Pourquoi** : ce sont les gestes qui entourent une conversion, et ceux de la
demande (« marchander, casser un billet, l'addition ») ; les bases ouvrent et
ferment chaque échange.

**Écarté** : les nombres (le pavé de la spécification 003 et les billets du
volet les montrent mieux qu'une liste) ; les directions et l'hôtel (hors du
sujet de l'application).

## R2. Quelles langues pour une devise

**Décision** : une liste ordonnée par devise, dans `phrases.json`, la langue du
marché d'abord : arabe égyptien pour l'EGP, darija pour le MAD, puis le
français ; allemand, français, italien pour le CHF ; anglais, chinois et
malais pour le SGD. Les langues d'une seconde devise s'ajoutent à la suite,
sans doublon ; la langue de l'application est retirée.

**Pourquoi** : la devise est le seul repère de destination que l'application
connaît ; la demander en plus serait une question de plus pour un même fait.

## R3. Le sens, dans la langue de l'application

**Décision** : le sens de chaque phrase vit dans les messages de l'application
(`phrases.sens.<id>`), en français et en anglais ; le jeu ne contient que les
phrases.

**Pourquoi** : une langue de plus dans l'application se traduit une fois, pas
vingt-sept.

## R4. Montrer, plutôt qu'entendre

**Décision** : une phrase touchée s'affiche en grand dans la feuille, avec sa
transcription et son sens. Pas de synthèse vocale.

**Pourquoi** : montrer marche hors ligne, sur tout appareil, dans le bruit d'un
marché ; une voix de synthèse manque souvent pour l'arabe égyptien, le thaï
ou le tagalog hors ligne, et l'échec se ferait en silence.
