# Démarrage rapide : lancer et valider

## Lancer

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # le socle vit sur GitHub Packages
npm ci
npm run dev                                 # http://localhost:5213/
```

## Vérifier

```bash
npm run format:check && npm run lint && npx tsc -p tsconfig.app.json --noEmit
npm test                                    # règles, magasins, composants
npm run build                               # budget de poids + pwa-doctor --strict
npm run test:e2e                            # parcours @critical et @a11y
```

## Scénarios à rejouer à la main

Sur un téléphone de 390 × 664 px (outils de développement), en ligne puis hors
ligne :

1. **Conversion** (récit 1) : choisir EGP, saisir 200 côté EGP, lire l'euro ;
   saisir 20 côté euro, lire l'EGP ; inverser la paire ; la ligne de taux dit la
   source et la date.
2. **Volet** (récit 2) : ouvrir « Billets et pièces », vérifier l'ordre et les
   contre-valeurs, basculer le sens, lire la composition de 200 EGP.
3. **Historique** (récit 3) : ouvrir l'historique d'EGP, changer de période,
   lire le plus haut, le plus bas, la variation et la comparaison du montant.
4. **Carnet** (récit 4) : enregistrer « Visite du musée » pour 200 EGP,
   recharger, renommer, supprimer puis annuler.
5. **Hors ligne** : couper le réseau, recharger, convertir avec le dernier taux
   et sa date ; l'historique déjà vu s'affiche, l'autre dit qu'il ne l'est pas.
6. **Petits écrans** : en 320 px, rien ne déborde, même pour 1 000 000 VND.
