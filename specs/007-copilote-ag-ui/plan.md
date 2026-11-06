# Plan d'implémentation : un copilote de démonstration, AG-UI et CopilotKit

**Entrées** : [spec.md](./spec.md).

## Résumé

Un agent AG-UI écrit à la main, servi par le serveur de développement de
Vite, traduit le flux de Claude (ou d'un modèle simulé) en événements AG-UI.
Dans le navigateur, CopilotKit s'y branche directement, sans son propre
serveur ; ses outils règlent l'écran Convertir par les magasins de
l'application, et un inspecteur affiche chaque événement reçu. Tout le
copilote tient dans un morceau que le build de production n'émet pas.

```text
navigateur (npm run dev:copilote)                serveur de développement Vite
┌──────────────────────────────────────────┐     ┌─────────────────────────────┐
│ App ── usePreferences / useConversion    │     │ greffon /agent (agent/)     │
│  │                                       │POST │  RunAgentInput validée      │
│  └ Copilote (morceau à part, DEV seul)   │────▶│  boucle : modèle → outils   │
│     CopilotKit  agents__unsafe_dev_only  │     │  serveur → STATE_DELTA      │
│     ├ outils : convertir, appliquer_frais│◀────│  flux SSE d'événements      │
│     ├ état : dépenses notées             │ SSE │                             │
│     └ inspecteur : agent.subscribe()     │     │ Claude (SDK Anthropic)      │
└──────────────────────────────────────────┘     │  ou modèle simulé           │
                                                 └─────────────────────────────┘
```

## Contexte technique

- **Client** : `@copilotkit/react-core` 1.85 (API v2), `@ag-ui/client` 1.0.2
  (la version que CopilotKit épingle : une seule copie, un seul type
  `AbstractAgent`).
- **Agent** : `@ag-ui/core` et `@ag-ui/encoder` 1.0.2, `@anthropic-ai/sdk`
  1.6, modèle `claude-opus-5-5`.
- **Dépendances de développement** toutes : `npm audit --omit=dev` et le site
  publié ne les voient pas.
- **Fichiers** : `agent/` (Node, vérifié par `tsconfig.node.json`) ;
  `src/copilote/` (navigateur).

## Décisions

**R1. CopilotKit sans son serveur.** `agents__unsafe_dev_only` enregistre un
`HttpAgent` qui parle directement à l'agent. Le serveur CopilotKit
(`CopilotRuntime`) ajouterait sa propre couche entre les deux, alors que le
but est de voir AG-UI nu ; et l'option, réservée par son nom au
développement, dit exactement ce qu'est la démonstration.

**R2. Un agent écrit à la main plutôt que l'agent intégré de CopilotKit.**
L'agent intégré produirait les événements à notre place. Écrit à la main, il
montre la traduction : un bloc de texte devient `TEXT_MESSAGE_START`,
`…_CONTENT`, `…_END` ; un `tool_use` devient `TOOL_CALL_START`, `…_ARGS`,
`…_END` ; un bloc de raisonnement devient `REASONING_*`. La traduction est
une fonction pure (`agent/protocole.ts`), testée sans réseau.

**R3. L'agent dans le serveur de développement, pas dans un processus à
part.** Un greffon Vite (`apply: 'serve'`) monte l'agent à `/agent`. Même
origine : la CSP, dont `connect-src` contient déjà `'self'`, n'est pas
élargie, et aucun CORS n'est à régler. Une seule commande lance tout. Le
greffon n'existe pas au build : `vite.config.ts` ne l'importe qu'en `serve`
avec `VITE_COPILOTE`.

**R4. Un agent sans état, par le raisonnement chiffré du protocole.** Claude
exige qu'on lui rende un tour tel qu'il l'a écrit, blocs de raisonnement
signés compris, quand un appel d'outil se poursuit. Le client AG-UI renvoie
la conversation entière à chaque exécution, mais sous sa forme à lui (texte,
appels d'outils). L'agent joint donc à chaque message de l'assistant le
contenu brut du tour, en `REASONING_ENCRYPTED_VALUE` (sous-type `message`) ;
le client le garde sur le message (`encryptedValue`) et le renvoie ; l'agent
rejoue ce contenu à la place du texte reconstruit. Rien n'est gardé côté
serveur. La valeur n'est pas chiffrée ici, seulement opaque pour le client :
le protocole prévoit ce champ pour l'artefact d'un fournisseur, et c'en est
un.

**R5. Le modèle et son effort.** `claude-opus-5-5`, effort `low` : un
copilote de conversation répond vite, et la tâche (lire un montant, choisir
un outil) ne demande pas plus. Raisonnement adaptatif, résumé affiché
(`display: 'summarized'`), pour que les événements `REASONING_*` aient un
contenu à montrer. Repli côté serveur activé (`fallbacks: 'default'`) : un
refus d'un classifieur de sécurité est rejoué par l'API sur le modèle
qu'elle recommande, au lieu d'arrêter la démonstration. Modèle et effort se
changent par `COPILOTE_MODELE` et `COPILOTE_EFFORT`.

**R6. Un modèle simulé.** Sans clé, `COPILOTE_MODELE=simule` remplace Claude
par un script qui produit les mêmes événements de flux que le SDK (texte,
`tool_use` et ses arguments en morceaux). Toute la chaîne — traduction,
outils, état, inspecteur — tourne donc sans compte, en test comme au
navigateur.

**R7. Les outils.** `convertir` et `appliquer_frais` s'exécutent dans le
navigateur (outils de CopilotKit) : ils agissent sur l'écran et rendent le
résultat que l'application calcule (`deriver`, `tauxDuJour`). `noter_depense`
s'exécute dans l'agent : il ne touche pas l'écran, il écrit l'état partagé.
L'agent n'a aucun outil qui calcule : un montant vient toujours de
l'application (principe I).

**R8. Le contexte.** L'application décrit à l'agent ce que l'écran montre
(paire, saisie, taux, source, date, frais, dépenses converties et leur
total) par `useAgentContext`. Ce contexte change à chaque tour : il suit le
préambule fixe du prompt système, qui seul porte le marqueur de cache.

**R9. L'inspecteur.** Il s'abonne à l'agent (`agent.subscribe`) : il voit ce
que le client reçoit, après validation par le client AG-UI, et l'entrée de
chaque exécution (`onRunInitialized`). Un réducteur pur
(`src/copilote/journal.ts`) range les événements par exécution ; il est testé
sans React. L'inspecteur de CopilotKit est coupé (`enableInspector={false}`) :
deux inspecteurs se disputeraient l'écran.

## Contrôle de la constitution

- **I. Un montant juste et daté** — respecté : l'agent ne calcule rien, les
  outils rendent les montants de l'application avec la source et la date.
- **II. L'appareil d'abord** — **écart, borné au développement** : ce qu'on
  écrit au copilote, et une photo jointe, partent chez Anthropic. Le copilote
  n'existe qu'avec `npm run dev:copilote` ; le site publié n'en contient
  rien (EF-001, vérifié par CR-001). Le jour où il serait publié, il faudrait
  une nouvelle spécification, le tiers nommé dans « Confidentialité » et un
  serveur pour garder la clé.
- **III. Visuel, accessible et légal** — sans objet (aucune image ajoutée).
- **IV. Lisible partout** — français et anglais par un dictionnaire du
  morceau (les libellés n'alourdissent pas le bundle publié) ; panneau au
  clavier, onglets ARIA. Les composants de CopilotKit gardent leur propre
  accessibilité, non auditée par axe : la démonstration n'entre pas dans les
  e2e.
- **V. Les tests d'abord** — traduction, conversion des messages, outils et
  journal ont leurs tests ; le parcours se vérifie au navigateur, en mode
  simulé.
- **VI. Le socle avant le code maison** — le socle n'a rien pour un agent ;
  la démonstration n'y propose rien tant qu'une seconde application n'en
  veut pas (règle de promotion du parc).
- **Poids** — inchangé : le morceau n'est pas émis (CR-001).
- **Aucun secret dans le dépôt** — la clé vit dans l'environnement ou
  `.env.local`, que `.gitignore` exclut.

## Lancer

```bash
npm run dev:copilote:simule   # sans clé, le modèle simulé
npm run dev:copilote          # avec ANTHROPIC_API_KEY dans l'environnement ou .env.local
```

Le bouton « Copilote » apparaît en bas à droite de l'écran.
