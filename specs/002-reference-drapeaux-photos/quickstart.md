# Démarrage rapide : vérifier la spécification 002

## Lancer

```bash
npm ci
npm run dev
```

## Vérifier

```bash
npm test
npm run test:e2e
npm run build
```

`npm run build` enchaîne le budget de poids et `pwa-doctor --strict` : zéro
défaut, zéro dette, zéro info.

## Scénarios à rejouer à la main

1. **Référence** : Réglages, « Monnaie de référence », choisir le franc suisse.
   Sur Convertir, saisir 200 côté EGP : le champ du franc se remplit, la ligne
   de taux dit « 1 CHF = … EGP », taux de marché. Choisir USD : taux de la BCE.
   Recharger : la référence reste. Revenir à l'euro : tout est comme avant.
2. **Échange** : avec la devise EGP affichée, choisir EGP comme référence : la
   devise affichée devient l'ancienne référence.
3. **Carnet** : enregistrer une conversion en euros, passer au franc, en
   enregistrer une autre ; chacune garde sa référence, les totaux se font par
   paire.
4. **Drapeaux** : ouvrir la liste des devises ; chacune a son drapeau, le franc
   CFA un signe neutre. Hors ligne, les drapeaux restent.
5. **Photos** : ouvrir le volet de l'euro, passer en photos ; lire l'avis, voir
   les vignettes et leurs crédits. Revenir aux dessins : plus aucune requête
   vers Wikimedia (onglet Réseau).
6. **À propos** : à 320 px, nom, version, fonctions, sources liées,
   confidentialité, crédits ; rien ne déborde.
7. **Historique** : changer de devise depuis l'écran ; promener le curseur au
   clavier (flèches) et lire date et taux.
