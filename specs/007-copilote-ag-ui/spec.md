# Spécification : un copilote de démonstration, AG-UI et CopilotKit

**Branche** : `demo/copilote-ag-ui`
**Créée le** : 06/11/2026 · **Révisée le** : 07/11/2026
**Statut** : publiée, éteinte par défaut
**Demande d'origine** : « mettre en place une démo pour essayer AG-UI et
CopilotKit », puis « fais la 1 avec l'inspecteur » : un copilote qui règle le
convertisseur à partir d'une phrase ou d'une photo, et un inspecteur qui montre
les événements du protocole. Puis « fusionner la démo après avoir ajouté le
BYOK », publiée sur le site, la clé gardée le temps de l'onglet.

## Ce que la démonstration doit prouver

AG-UI est le protocole qui relie un agent à une interface : une suite
d'événements (texte en flux, appels d'outils, état partagé, raisonnement,
fin d'exécution et jetons consommés). CopilotKit en est le client React. La
démonstration les essaie sur une application réelle plutôt que sur un
exemple de documentation, et rend le protocole VISIBLE : chaque événement que
le navigateur reçoit s'affiche dans un inspecteur.

Le site est statique : il n'a ni serveur ni clé. L'agent tourne donc dans la
page, et le visiteur qui veut Claude apporte SA clé (BYOK, « bring your own
key »). Sans clé, un modèle simulé répond, et rien ne quitte l'appareil.

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

Pendant que l'agent répond, l'onglet « Événements » se remplit : début
d'exécution, morceaux de texte, appel d'outil et ses arguments en flux,
résultat, état, fin d'exécution avec les jetons consommés. Chaque ligne se
déplie sur son corps JSON.

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
4. Un échec (`RUN_ERROR`) s'affiche comme un événement, avec son message, et
   la conversation le dit aussi.

### Récit 3 : les frais de carte (priorité P2)

Elle ajoute « avec 2 % de frais de carte ». La ligne des frais apparaît sous
la conversion (spécification 005), et l'agent donne le coût frais compris
que l'application affiche.

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

**Scénarios d'acceptation** :

1. **Quand** l'agent appelle son outil `noter_depense`, **alors** il émet un
   `STATE_DELTA` qui ajoute la dépense, et la liste s'affiche.
2. Chaque dépense est convertie par l'application, au taux du jour de sa
   paire ; sans taux, la ligne le dit et le total ne la compte pas.
3. **Quand** je retire une ligne, **alors** l'état de l'agent change, et le
   contexte de l'exécution suivante porte le nouveau total.

### Récit 5 : la photo d'une étiquette (priorité P3)

Elle photographie l'étiquette d'un marché et l'envoie. Avec Claude, l'agent
lit le prix et la devise sur la photo, puis convertit comme au récit 1.

**Scénarios d'acceptation** :

1. Une image jointe part dans le message de l'utilisateur, en partie `image`
   du protocole (multimodal, AG-UI 1.0).
2. En mode simulé, l'agent répond qu'il ne lit pas les images.

### Récit 6 : apporter sa clé (priorité P1)

Elle active le copilote dans les réglages. Il répond d'abord avec le modèle
simulé. Dans l'onglet « Modèle », elle choisit Claude : un avis dit ce qui
partira chez Anthropic, depuis son navigateur, avec sa clé ; elle colle sa
clé, choisit le modèle, et la conversation passe à Claude. En fermant
l'onglet, la clé disparaît.

**Pourquoi cette priorité** : sans elle, la démonstration ne peut pas être
publiée — le site n'a ni serveur ni clé.

**Test indépendant** : sans clé, choisir Claude et écrire : l'exécution
s'arrête sur une erreur qui dit où saisir la clé, et aucune requête ne part.
Avec un faux réseau, une clé saisie part à `api.anthropic.com` dans l'en-tête
d'autorisation, jamais dans le corps ni dans les événements.

**Scénarios d'acceptation** :

1. Le copilote est éteint par défaut ; rien de lui n'est chargé tant qu'il
   l'est.
2. Le modèle simulé est le défaut : rien ne quitte l'appareil sans que le
   visiteur ait choisi Claude ET saisi sa clé.
3. L'avis précède le champ de la clé : ce qui part (messages, description de
   l'écran, dépenses, photos), où (Anthropic, États-Unis), avec quoi (sa clé),
   et un lien vers la politique d'Anthropic.
4. La clé vit dans `sessionStorage`, jamais dans `localStorage`, ni dans
   l'état de l'agent, les messages ou l'inspecteur ; « Oublier la clé » la
   retire.
5. Une clé refusée, un modèle inaccessible, une limite atteinte ou un réseau
   absent s'affichent en clair dans la conversation.

## Exigences

- **EF-001** Le copilote est publié, éteint par défaut ; un interrupteur des
  réglages l'active. Éteint, rien de lui n'est chargé ; allumé, ses morceaux
  sont chargés à la demande et jamais précachés.
- **EF-002** L'agent tourne dans la page (`AbstractAgent`) : ni serveur ni
  point d'accès d'agent.
- **EF-003** Avec Claude, le navigateur appelle l'API d'Anthropic
  directement, avec la clé du visiteur ; la CSP ouvre `api.anthropic.com`, et
  lui seul de plus.
- **EF-004** Sans clé, un modèle simulé produit les mêmes événements, par un
  modèle écrit à la main : la démonstration et ses tests tournent sans compte.
- **EF-005** Tout montant que l'agent donne vient du résultat d'un outil
  exécuté par l'application (principe I).
- **EF-006** L'agent est sans état : le client lui renvoie la conversation à
  chaque exécution, et le contenu brut de chaque tour de Claude, raisonnement
  signé compris, voyage par `REASONING_ENCRYPTED_VALUE`.
- **EF-007** Le copilote parle français et anglais, selon la langue de
  l'application ; son panneau s'utilise au clavier.

## Critères de réussite

- **CR-001** Le build reste sous le budget de poids, `pwa-doctor --strict` à
  zéro ; le précache ne contient aucun fichier du copilote.
- **CR-002** En mode simulé, sur le build de production et sa CSP, les récits
  1 à 4 se jouent sans erreur en console (e2e, bureau et téléphone).
- **CR-003** Les traductions d'événements, la conversion des messages, les
  outils, le journal de l'inspecteur, le réglage de la clé et l'appel à
  Claude (sur un faux réseau) sont couverts par des tests unitaires.
- **CR-004** axe ne relève aucune violation sur l'onglet « Modèle », dans les
  deux thèmes.
