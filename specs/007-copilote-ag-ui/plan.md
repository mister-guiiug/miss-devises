# Plan d'implémentation : un copilote de démonstration, AG-UI et CopilotKit

**Entrées** : [spec.md](./spec.md).

## Résumé

Un agent AG-UI écrit à la main tourne dans la page et traduit le flux de
Claude (ou d'un modèle simulé) en événements AG-UI. CopilotKit s'y branche
directement ; ses outils règlent l'écran Convertir par les magasins de
l'application, et un inspecteur affiche chaque événement reçu. Le visiteur qui
veut Claude apporte sa clé, et son navigateur appelle l'API d'Anthropic. Le
copilote est éteint par défaut, et ses morceaux restent hors du précache.

```text
navigateur                                                     Anthropic
┌──────────────────────────────────────────────────────┐
│ App ── usePreferences / useConversion                │
│  │      (Réglages : « Copilote », éteint par défaut) │
│  └ Copilote (assets/copilote/, hors précache)        │
│     CopilotKit  agents__unsafe_dev_only              │
│     ├ outils : convertir, appliquer_frais            │
│     ├ état : dépenses notées                         │
│     ├ inspecteur : agent.subscribe()                 │
│     └ AgentNavigateur ── executer() ─┬─ simulé       │
│                                      └─ Claude ──────┼──▶ api.anthropic.com
│                                         (clé de     │    (clé du visiteur,
│                                          l'onglet)  │     en-tête)
└──────────────────────────────────────────────────────┘
```

## Contexte technique

- **Client** : `@copilotkit/react-core` 1.85 (API v2), `@ag-ui/client` et
  `@ag-ui/core` 1.0.2, épinglés sur la version que CopilotKit épingle (une
  seule copie, un seul type `AbstractAgent`).
- **Modèle** : `@anthropic-ai/sdk` 1.6, `claude-opus-5-5` par défaut,
  Sonnet 5.5 et Haiku 5.5 au choix du visiteur.
- **Dépendances d'exécution** : elles partent dans le site publié, donc
  `npm audit --omit=dev` les voit.
- **Fichiers** : `src/copilote/` ; l'agent dans `src/copilote/agent/`.

## Décisions

**R1. L'agent dans la page.** Un agent AG-UI est un `AbstractAgent` dont
`run` rend un flux d'événements ; rien n'exige un serveur. `AgentNavigateur`
tire ses événements de `executer`, et lit son modèle à chaque exécution
(changer de clé ne recrée rien). CopilotKit l'accepte par
`agents__unsafe_dev_only` : le « unsafe » vise un point d'accès d'agent exposé
sans l'authentification du serveur de CopilotKit, et il n'y en a aucun ici.
`selfManagedAgents` ferait la même chose, en réclamant une licence.

**R2. Un agent écrit à la main plutôt que l'agent intégré de CopilotKit.**
L'agent intégré produirait les événements à notre place. Écrit à la main, il
montre la traduction : un bloc de texte devient `TEXT_MESSAGE_START`,
`…_CONTENT`, `…_END` ; un `tool_use` devient `TOOL_CALL_START`, `…_ARGS`,
`…_END` ; un bloc de raisonnement devient `REASONING_*`. La traduction est
une fonction pure (`agent/protocole.ts`), testée sans réseau.

**R3. Le premier jet tournait dans le serveur de développement** (un greffon
Vite à `/agent`). Il est abandonné : le site publié n'a pas de serveur, et
deux chemins pour le même agent en feraient un de trop.

**R4. Un agent sans état, par le raisonnement chiffré du protocole.** Claude
exige qu'on lui rende un tour tel qu'il l'a écrit, blocs de raisonnement
signés compris, quand un appel d'outil se poursuit. L'agent joint donc à
chaque message de l'assistant le contenu brut du tour, en
`REASONING_ENCRYPTED_VALUE` (sous-type `message`) ; le client le garde
(`encryptedValue`) et le renvoie ; l'agent le rejoue à la place du texte
reconstruit. La valeur n'est pas chiffrée ici, seulement opaque pour le
client.

**R5. Le modèle et son effort.** `claude-opus-5-5` par défaut, effort `low` :
la tâche (lire un montant, choisir un outil) ne demande pas plus.
Raisonnement adaptatif, résumé affiché, pour que les événements `REASONING_*`
aient un contenu. Repli côté serveur (`fallbacks: 'default'`) sauf pour
Haiku 5.5, qui n'en a pas.

**R6. Un modèle simulé, le défaut.** Un script produit les mêmes événements
de flux que le SDK. Toute la chaîne tourne sans compte, en test comme au
navigateur, et un visiteur peut tout essayer sans rien envoyer.

**R7. Les outils.** `convertir` et `appliquer_frais` s'exécutent dans le
navigateur (outils de CopilotKit) et rendent ce que l'application calcule.
`noter_depense` est l'outil de l'agent : il écrit l'état partagé. Aucun outil
ne calcule de montant (principe I).

**R8. Le contexte.** L'application décrit à l'agent son écran et les
dépenses converties (`useAgentContext`) ; ce contexte suit le préambule fixe,
qui seul porte le marqueur de cache.

**R9. L'inspecteur.** Il s'abonne à l'agent (`agent.subscribe`) et range les
événements par un réducteur pur (`journal.ts`). L'inspecteur de CopilotKit
est coupé.

**R10. La clé du visiteur (BYOK).** Elle est saisie dans l'onglet « Modèle »,
après un avis, et gardée dans `sessionStorage` : elle disparaît avec
l'onglet, et toutes les applications du parc partageant l'origine, aucune ne
la retrouve dans un autre onglet. Le SDK la passe en `Authorization` et pose
`anthropic-dangerous-direct-browser-access`, que l'API exige d'un appel venu
d'une page. Elle n'entre ni dans l'état, ni dans les messages, ni dans
l'inspecteur ; un test le vérifie sur un faux réseau.

**R11. Hors du précache, nommés sans empreinte.** CopilotKit tire, pour son
rendu Markdown, Shiki, Mermaid et KaTeX : près de 400 morceaux et leurs
polices, plus de 3 Mo gzip au total, dont 659 kB pour le morceau principal.
Les précacher les imposerait à tous les visiteurs. `vite.config.ts` range
donc sous `assets/copilote/`, nommé sans empreinte, tout morceau dont un
module vient de `src/copilote/` ou d'un paquet que l'application n'atteint
jamais sans lui ; le graphe se lit avant le rendu (`graphesDuCopilote`). Le
précache les ignore, et `pwa-doctor` vérifie les deux invariants : rien
d'empreinté hors du précache, rien d'importé au démarrage hors du précache.

**R12. Le zod de chaque paquet.** Au build, le socle renvoie tout
`import 'zod'` vers le zod de l'application (sans compilation, pour la CSP).
CopilotKit, le client AG-UI et A2UI portent zod 3 et recevaient zod 4 : le
copilote plantait au chargement, en production seulement. Un greffon rend à
chaque paquet sa copie (`zodDeChaquePaquet`). La correction appartient au
socle.

## Contrôle de la constitution

- **I. Un montant juste et daté** — respecté : l'agent ne calcule rien.
- **II. L'appareil d'abord** — **modifié, version 3.0.0** : l'exception de
  l'assistant, à trois conditions (activé par l'utilisateur, fournisseur et
  clé à lui, avis avant le premier envoi). Le modèle simulé est le défaut.
- **III. Visuel, accessible et légal** — sans objet.
- **IV. Lisible partout** — français et anglais par un dictionnaire du
  morceau ; panneau au clavier, onglets ARIA ; axe sur l'onglet « Modèle ».
  La conversation de CopilotKit garde sa propre accessibilité, non auditée.
- **V. Les tests d'abord** — traduction, messages, outils, journal, clé,
  appel à Claude sur faux réseau ; e2e sur le build de production.
- **VI. Le socle avant le code maison** — rien d'équivalent au socle ; le
  correctif zod (R12) lui revient.
- **Poids** — sous le budget ; le copilote, hors précache, n'entre pas dans
  la mesure du total (voir `bundleBudget._pourquoi`).
- **Confidentialité** — Anthropic nommé dans le README et dans l'avis de
  l'onglet « Modèle ».
- **Aucun secret dans le dépôt** — aucune clé de l'application n'existe.
