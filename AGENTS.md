# Instructions pour les agents

Miss Devises est le convertisseur de devises visuel de la famille
`miss-*` / `mister-*` : billets et pièces dessinés, conversion dans les deux
sens, historique des taux, carnet de conversions annotées. Il est né du
squelette `pwa-starter-kit` par le générateur `create-lg-pwa-app`.

## La méthode : spécifier avant de coder

Chaque fonctionnalité suit la démarche de Spec Kit, et ses documents vivent
dans le dépôt :

1. [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) :
   les principes que tout plan respecte (un montant juste et daté,
   l'appareil d'abord, visuel accessible et légal, lisible partout, les tests
   d'abord, le socle avant le code maison) ;
2. `specs/<numéro>-<nom>/spec.md` : quoi et pourquoi, en récits priorisés,
   exigences et critères mesurables, puis les clarifications ;
3. `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` :
   comment ;
4. `tasks.md` : les tâches ordonnées, tests en tête, cochées au fil des
   commits.

Une demande nouvelle commence par sa spécification, pas par le code. Un écart
à la constitution s'écrit dans le plan, avec sa raison.

## Ce qui vient du socle, et ne se réécrit pas

Avant d'écrire quoi que ce soit, chercher dans
[`@mister-guiiug/dev-pwa-config`](https://github.com/mister-guiiug/dev-pwa-config) :
formats (`format`), stockage (`versioned-store`, `idb`), géométrie des
courbes (`sparkline`), feuille, toast, coquille, i18n et libellés, manifeste
PWA, CSP, SEO, mise à jour du service worker, workflows.

**`components.css` est le prérequis de toute adoption de `/react`.** Les
composants du socle ne posent que des attributs `data-dwc` : sans cette
feuille, ils compilent, les tests passent, et l'écran est cassé. Elle est
importée dans `src/index.css` — ne pas la retirer.

## Les décisions

Une décision qui change l'architecture s'écrit dans `docs/adr/` : le code
montre la décision, l'ADR dit le contexte et ce qu'on écarte. Les douze
premiers viennent du squelette ;
[0013](./docs/adr/0013-sans-compte-ni-backend-distant.md) retire le compte et
le backend distant.

## La porte

`npm run build` enchaîne le budget de poids et `pwa-doctor --strict` : zéro
défaut, zéro dette, zéro info. Une pull request, la CI verte ; le dépôt est
protégé. Les commits suivent
[Conventional Commits](https://www.conventionalcommits.org/fr/), sujet en
français, à l'impératif ; le corps explique **pourquoi**. Aucune signature
d'assistant, nulle part.
