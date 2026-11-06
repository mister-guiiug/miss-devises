# Spécification : un copilote de démonstration, AG-UI et CopilotKit

**Branche** : `demo/copilote-ag-ui`
**Créée le** : 06/11/2026
**Statut** : démonstration, en développement seulement
**Demande d'origine** : « mettre en place une démo pour essayer AG-UI et
CopilotKit », puis « fais la 1 avec l'inspecteur » : un copilote qui règle le
convertisseur à partir d'une phrase ou d'une photo, et un inspecteur qui montre
les événements du protocole.

## Ce que la démonstration doit prouver

AG-UI est le protocole qui relie un agent à une interface : une suite
d'événements (texte en flux, appels d'outils, état partagé, raisonnement,
fin d'exécution et jetons consommés). CopilotKit en est le client React. La
démonstration les essaie sur une application réelle plutôt que sur un
exemple de documentation, et rend le protocole VISIBLE : chaque événement que
le navigateur reçoit s'affiche dans un inspecteur.

Elle ne sert qu'en développement. Le site publié n'en contient rien
(EF-001) : la constitution réserve le réseau à la lecture de données
publiques (principe II), et un copilote envoie ce qu'on lui écrit à un
fournisseur de modèle.

## Scénarios et tests _(obligatoire)_

### Récit 1 : demander une conversion en une phrase (priorité P1)

En voyage, il écrit « un ramen à 1 200 yens ». L'écran Convertir passe au yen
et affiche 1 200 dans son champ, comme s'il l'avait tapé ; dans la
conversation, une fiche montre le résultat que l'application a calculé, avec
le taux, sa source et sa date ; l'agent répond avec ce chiffre-là.

**Pourquoi cette priorité** : c'est le geste que le copilote ajoute à
l'application, et il exerce les trois briques principales du protocole : le
texte en flux, un outil exécuté dans le navigateur, une interface rendue dans
la conversation.

**Test indépendant** : en mode simulé, écrire « 1200 JPY » : la devise de
l'écran devient JPY, son champ vaut 1 200, la fiche de la conversation porte
le même montant que l'écran.

**Scénarios d'acceptation** :

1. **Étant donné** une phrase avec un montant et une devise, **quand** l'agent
   appelle l'outil `convertir`, **alors** l'écran Convertir change de devise et
   de saisie par les mêmes magasins que les gestes de l'utilisateur, et
   l'outil rend le résultat calculé par l'application.
2. **Étant donné** une devise sans taux connu, **alors** l'outil le dit, et
   aucun montant n'est rendu : l'agent n'invente jamais un taux (principe I).
3. **Étant donné** un code inconnu (« XYZ »), **alors** l'outil le refuse sans
   rien changer à l'écran.
4. La fiche de la conversation affiche le drapeau, les deux montants, le
   taux, la source et la date, et suit l'état de l'appel (en cours, fait).

### Récit 2 : voir le protocole (priorité P1)

Pendant que l'agent répond, l'onglet « Événements AG-UI » se remplit : début
d'exécution, morceaux de texte, appel d'outil et ses arguments en flux,
résultat, état, fin d'exécution avec les jetons consommés. Chaque ligne se
déplie sur son corps JSON.

**Pourquoi cette priorité** : c'est la raison d'être de la démonstration —
comprendre AG-UI en le regardant passer.

**Test indépendant** : envoyer un message en mode simulé : l'inspecteur
liste `RUN_STARTED` en premier et `RUN_FINISHED` en dernier, et chaque
exécution montre ce que le client a envoyé (messages, outils, contexte,
état).

**Scénarios d'acceptation** :

1. Chaque événement reçu par le client s'affiche dans l'ordre, avec son type,
   son instant relatif au début de l'exécution, un résumé d'une ligne et son
   corps complet à déplier.
2. Les événements sont regroupés par exécution ; l'en-tête d'une exécution
   montre l'entrée envoyée par le client et, à la fin, le modèle et les jetons
   consommés (`RUN_FINISHED.usage`).
3. Un compteur par type, un filtre par type, et un bouton pour effacer.
4. Un échec (`RUN_ERROR`, réseau coupé) s'affiche comme un événement, avec son
   message.

### Récit 3 : les frais de carte (priorité P2)

Elle ajoute « avec 2 % de frais de carte ». La ligne des frais apparaît sous
la conversion (spécification 005), et l'agent donne le coût frais compris
que l'application affiche.

**Test indépendant** : demander des frais de 2 % : les frais « Carte » à 2 %
existent dans les réglages et sont appliqués ; une seconde demande identique
ne les duplique pas.

**Scénarios d'acceptation** :

1. **Quand** l'agent appelle `appliquer_frais`, **alors** des frais identiques
   déjà enregistrés sont repris, sinon ils sont créés par la même règle que
   l'écran des réglages (bornes, six au plus), puis appliqués.
2. Des frais invalides (négatifs, au-delà de 100 %) sont refusés et l'outil
   le dit.

### Récit 4 : noter ses dépenses, l'état partagé (priorité P2)

Il écrit « note un taxi à 3 000 yens ». Une liste « Dépenses notées » apparaît
dans le copilote : la course, convertie par l'application, et le total dans
la monnaie de référence. Il retire une ligne d'un geste ; à la question
« combien ai-je dépensé ? », l'agent répond avec le total que l'application a
calculé, sans la ligne retirée.

**Pourquoi** : c'est l'état partagé d'AG-UI, dans les deux sens. L'agent écrit
la liste par un correctif JSON (`STATE_DELTA`) ; l'interface la modifie, et
l'agent reçoit l'état à jour à l'exécution suivante.

**Scénarios d'acceptation** :

1. **Quand** l'agent appelle l'outil serveur `noter_depense`, **alors** il
   émet un `STATE_DELTA` qui ajoute la dépense, et la liste s'affiche.
2. Chaque dépense est convertie par l'application, au taux du jour de sa
   paire ; sans taux, la ligne le dit et le total ne la compte pas.
3. **Quand** je retire une ligne, **alors** l'état de l'agent change, et le
   contexte de l'exécution suivante porte le nouveau total.

### Récit 5 : la photo d'une étiquette (priorité P3)

Elle photographie l'étiquette d'un marché et l'envoie. L'agent lit le prix et
la devise sur la photo, puis convertit comme au récit 1.

**Scénarios d'acceptation** :

1. Une image jointe part dans le message de l'utilisateur, en partie `image`
   du protocole (multimodal, AG-UI 1.0).
2. En mode simulé, l'agent répond qu'il ne lit pas les images ; avec Claude,
   il lit le prix.

## Exigences

- **EF-001** Le copilote n'existe qu'en développement, quand `VITE_COPILOTE`
  est posée. Le build de production n'en contient rien : aucun morceau, aucune
  dépendance, un poids inchangé.
- **EF-002** L'agent est servi par le serveur de développement, à `/agent`, à
  la même origine que l'application : la CSP n'est pas élargie.
- **EF-003** La clé du fournisseur de modèle reste côté serveur (environnement
  ou `.env.local`, jamais commité) ; le navigateur ne la voit jamais.
- **EF-004** Sans clé, un mode simulé produit les mêmes événements, par un
  modèle écrit à la main : la démonstration et ses tests tournent sans compte.
- **EF-005** Tout montant que l'agent donne vient du résultat d'un outil
  exécuté par l'application (principe I).
- **EF-006** L'agent est sans état : le client lui renvoie la conversation à
  chaque exécution, et le contenu brut de chaque tour de Claude, raisonnement
  signé compris, voyage par `REASONING_ENCRYPTED_VALUE`.
- **EF-007** Le copilote parle français et anglais, selon la langue de
  l'application ; son panneau s'utilise au clavier.

## Critères de réussite

- **CR-001** `npm run build` sans `VITE_COPILOTE` : aucun fichier de `dist/`
  ne contient « copilotkit », et le budget de poids est celui de `main`.
- **CR-002** En mode simulé, les récits 1 à 4 se jouent au navigateur, sans
  erreur en console ni refus de la CSP.
- **CR-003** Les traductions d'événements (flux du modèle vers AG-UI), la
  conversion des messages (AG-UI vers le modèle), les outils et le journal de
  l'inspecteur sont couverts par des tests unitaires.
