# Constitution de Miss Devises

Les principes que chaque spécification, chaque plan et chaque tâche de ce dépôt
doivent respecter. Un plan qui s'en écarte le dit dans sa section « Contrôle de
la constitution », avec la raison ; sinon il est refusé.

## Principes

### I. Un montant juste et daté

Un taux s'affiche toujours avec sa source et sa date ; l'application n'en
invente jamais. Hors ligne, elle convertit avec le dernier taux connu et le
dit. Chaque montant s'arrondit aux décimales de sa devise (ISO 4217) au moment
de l'afficher, jamais pendant le calcul. Les taux sont indicatifs : l'écran ne
laisse pas croire à un prix de bureau de change.

### II. L'appareil d'abord

Tout ce que l'utilisateur crée (carnet, préférences) reste sur son appareil,
sans compte, et s'exporte en fichier. Le réseau ne sert qu'à lire des taux
publics. Ce qui a été lu une fois reste disponible hors ligne.

### III. Visuel, accessible et légal

Les billets et les pièces se dessinent en formes stylisées (couleur dominante,
valeur, proportions) : aucune reproduction, ni image ni imitation. Chaque
élément visuel porte son équivalent textuel ; la couleur n'est jamais la seule
information.

### IV. Lisible partout

Contrastes AA dans les thèmes clair et sombre, usage complet au clavier et au
lecteur d'écran, rien qui déborde sur 320 px, l'écran principal sans
défilement sur un téléphone. Français et anglais.

### V. Les tests d'abord

Une exigence entre avec le test qui la vérifie, écrit avant le code et vu
rouge : Vitest pour les règles (conversion, arrondi, décomposition, séries),
Playwright pour les parcours, axe pour l'accessibilité. Un correctif
s'accompagne du test qui échouait.

### VI. Le socle avant le code maison

Ce que `@mister-guiiug/dev-pwa-config` fournit (composants, formats, stockage
versionné, workflows) ne se réécrit pas ici. Un besoin que plusieurs
applications partagent se propose au socle plutôt que de se copier.

## Contraintes du parc

- Poids sous le budget du squelette (`totalGzipKb`, `mainChunkKb`), et
  `pwa-doctor --strict` à zéro défaut.
- Toute requête vers un tiers (sources de taux) est nommée dans la section
  « Confidentialité » du README.
- Aucun secret dans le dépôt ; les sources de taux retenues n'en demandent pas.
- `main` est protégé : tout passe par une pull request et une CI verte.
- Aucune signature d'assistant dans les commits, les pull requests ou la
  documentation (règle 1 du parc).

## Méthode

Chaque fonctionnalité suit la même suite, dans `specs/<numéro>-<nom>/` :
`spec.md` (quoi et pourquoi), clarifications, `plan.md` (comment, avec
`research.md`, `data-model.md`, `contracts/`, `quickstart.md`), `tasks.md`
(tâches ordonnées, tests en tête), puis l'implémentation, une pull request par
étape livrable.

## Gouvernance

Cette constitution prime sur les habitudes. Elle se modifie par une pull
request qui dit ce qui change et pourquoi, et relève sa version : majeure pour
un principe retiré ou renversé, mineure pour un principe ajouté, correctif pour
une précision.

**Version** : 1.0.0 · **Ratifiée le** : 01/10/2026 · **Dernière modification** :
01/10/2026
