# Miss Devises

Convertisseur de devises visuel : billets et pièces sous les yeux, conversion
dans les deux sens, historique des taux et conversions annotées.

**L'application** : <https://mister-guiiug.github.io/miss-devises/>

Application web installable de la famille `miss-*` / `mister-*`, née du
squelette [`pwa-starter-kit`](https://github.com/mister-guiiug/pwa-starter-kit)
et bâtie sur
[`@mister-guiiug/dev-pwa-config`](https://github.com/mister-guiiug/dev-pwa-config).

## Ce qu'elle fait

- **Convertir** entre sa monnaie de référence et une devise, dans les deux
  sens, à chaque chiffre tapé ; le taux s'affiche avec sa source et sa date,
  et un taux de plus de trois jours le signale. La référence est l'euro par
  défaut et se change dans les réglages : un franc suisse, un dollar… Une
  paire dont la BCE publie les deux devises se lit à son taux, les autres au
  taux de marché, toujours à une seule date.
- **Voir les billets et les pièces** de 41 devises de voyage, dessinés à leur
  couleur et à leur taille relative, ou, à la demande, en photos libres de
  Wikimedia Commons, chacun avec sa valeur dans la monnaie de référence, et
  l'inverse ; le montant saisi se décompose en coupures (« 200 EGP : un billet
  de 200 »), et l'on compose un montant en touchant les billets qu'on a en
  main.
- **Comparer avec l'historique** : la courbe d'un mois, de six mois ou d'un an,
  le plus haut, le plus bas, la variation, et le montant saisi au début de la
  période (« 200 EGP valaient 3,58 €, et valent 3,40 € aujourd'hui »).
- **Garder une conversion avec un libellé**, comme « Visite du musée » : le
  carnet garde le taux, sa date et la référence du moment, refait chaque
  ligne au taux du jour, et totalise par paire. Il s'exporte et s'importe en
  fichier.
- **Reconnaître chaque devise à son drapeau**, celui du pays qui l'émet ; le
  drapeau européen pour l'euro, un globe pour une devise de plusieurs pays
  (franc CFA, franc CFP). Les drapeaux sont livrés avec l'application.

Elle fonctionne hors ligne avec les derniers taux connus, en français et en
anglais, au clavier et au lecteur d'écran.

## D'où viennent les taux

- Pour les **29 devises** que publie la Banque centrale européenne, ses taux
  de référence, lus par [Frankfurter](https://frankfurter.dev). La BCE les
  publie chaque jour ouvré vers 16 h, heure d'Europe centrale.
- Pour les autres, les **taux de marché** de
  [currency-api](https://github.com/fawazahmed0/exchange-api), lus sur jsDelivr
  puis, en repli, sur Cloudflare Pages.

Une paire garde la même source pour le taux du jour et pour son historique.
Les taux sont indicatifs : un bureau de change ou une banque applique ses
propres taux et ses frais. La page
[« Taux de change de la BCE, taux de marché et bureau de change »](./content/pages/taux-de-change-bce-marche-bureau-de-change.md)
explique la différence.

## Billets et pièces

Le jeu de données, `src/data/coupures.json`, a été relevé le 01/10/2026 auprès
des banques centrales ou de Wikipédia. Ses sources, ses conventions et ses
incertitudes, devise par devise, sont dans
[`specs/001-convertisseur-visuel/coupures.md`](./specs/001-convertisseur-visuel/coupures.md).
Les billets et les pièces sont **dessinés**. À la demande, le volet montre à la
place des **photos libres de Wikimedia Commons**, réduites, d'une seule face et
créditées : 110 coupures sur 465, dans 14 devises. Les devises dont la banque
centrale encadre ou interdit la reproduction gardent leurs dessins. La méthode,
la politique devise par devise et les doutes sont dans
[`specs/002-reference-drapeaux-photos/photos.md`](./specs/002-reference-drapeaux-photos/photos.md).

## Confidentialité

- **Aucun compte.** Le carnet et les réglages restent dans le navigateur de
  l'appareil ; l'export en fichier est la seule façon de les en sortir.
- **Trois origines lues pour les taux**, et elles seules (la politique de
  sécurité du contenu ferme les autres) : `api.frankfurter.dev`,
  `cdn.jsdelivr.net` et `*.currency-api.pages.dev`. Elles voient l'adresse IP
  de l'appareil, les dates demandées et, pour un historique de la BCE, le
  code de la devise ; jamais un montant ni un libellé.
- **Photos (désactivées par défaut).** Si vous activez « Vraies photos » dans
  le volet des billets et des pièces, votre navigateur télécharge leurs images
  directement depuis Wikimedia Commons (`thumb.wikimedia.org` et
  `upload.wikimedia.org`, Wikimedia Foundation, États-Unis). Wikimedia reçoit
  alors l'adresse IP de l'appareil, le navigateur utilisé, l'heure et
  l'adresse de l'image demandée, donc la coupure affichée ; ni référent ni
  cookie ne sont envoyés. Selon sa
  [politique de confidentialité](https://foundation.wikimedia.org/wiki/Policy:Privacy_policy),
  ces données sont supprimées, agrégées ou désidentifiées au plus tard après
  90 jours. L'application le dit avant la première photo. Le lien « sur
  Wikipédia », pour les coupures restées dessinées, ouvre l'article dans un
  nouvel onglet, sans référent ; rien n'est demandé à Wikimedia avant ce clic.
- **Mesure** : Sentry ne se charge que si `VITE_SENTRY_DSN` est posée au build,
  et PostHog (nuage européen) ne mesure qu'après accord dans un bandeau, si
  `VITE_POSTHOG_KEY` est posée. **Au 01/10/2026, aucune des deux n'est posée** :
  rien ne part, et aucun bandeau ne s'affiche.

## Démarrer

```bash
npm install
```

```bash
npm run dev
```

L'installation lit le socle sur GitHub Packages : exporter `NODE_AUTH_TOKEN`
(un jeton avec `read:packages`) avant `npm install`. L'application démarre sans
configuration, sur son stockage local.

## Vérifier

```bash
npm run build
```

Le build enchaîne `tsc -b`, Vite, le budget de poids et `pwa-doctor --strict` :
il échoue à la moindre dette de conformité au parc. Les tests :

```bash
npm test
```

```bash
npm run test:e2e
```

Les e2e simulent le réseau : ils ne dépendent ni de la BCE ni de jsDelivr.

## La méthode

Chaque fonctionnalité suit la démarche de Spec Kit : la
[constitution](./.specify/memory/constitution.md), puis, pour le convertisseur,
[la spécification](./specs/001-convertisseur-visuel/spec.md), le plan, la
recherche, le modèle de données, les contrats et
[les tâches](./specs/001-convertisseur-visuel/tasks.md), cochées au fil des
commits. Les décisions d'architecture sont dans
[`docs/adr/`](./docs/adr/README.md).

## Licence

MIT, voir [LICENSE](./LICENSE). Les drapeaux viennent de
[country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons),
sous licence MIT. Les photos des billets et des pièces ne sont pas dans le
dépôt : le navigateur les lit sur Wikimedia Commons, chacune sous sa licence,
créditée dans le volet.
