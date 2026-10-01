## Pour qui

Les voyageurs qui comptent en euros : voir d'un coup d'œil ce que vaut un prix en livres égyptiennes, en dirhams ou en bahts, et à quoi ressemblent les billets et les pièces du pays.

## Comment ça marche

Choisissez une devise et tapez un montant, d'un côté ou de l'autre : la conversion se fait à chaque chiffre, dans les deux sens. Un volet montre tous les billets et toutes les pièces, dessinés à leur couleur, avec leur valeur en euros ; l'historique compare le montant d'aujourd'hui à celui d'il y a un mois, six mois ou un an. Le carnet garde vos conversions avec un libellé, comme « visite du musée, 200 EGP ».

## D'où viennent les taux

Pour les 29 devises qu'elle publie, les taux de référence de la Banque centrale européenne, via Frankfurter ; pour les autres, les taux de marché de currency-api. Ils sont indicatifs : un bureau de change applique ses propres taux et ses frais. Chaque taux s'affiche avec sa source et sa date, et l'application fonctionne hors ligne avec les derniers taux connus.

## Vos données

Le carnet et les réglages restent dans votre navigateur, sans compte, et s'exportent en fichier. Pour lire un taux, l'application interroge api.frankfurter.dev, cdn.jsdelivr.net et currency-api.pages.dev, qui voient l'adresse IP de l'appareil et rien d'autre. Sentry n'est chargé que si un DSN est posé au build ; PostHog, dans son nuage européen, ne mesure l'audience qu'après accord dans un bandeau.

## Prix

Gratuit et open source, sous licence MIT : lisez le code, reprenez ce qui vous sert.
