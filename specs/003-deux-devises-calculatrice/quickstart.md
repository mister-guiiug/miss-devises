# Démarrage rapide : vérifier la spécification 003

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

1. **Seconde devise** : sur Convertir, avec la paire EUR-EGP, « Ajouter une
   devise », choisir USD. Saisir 20 dans les euros : livres et dollars se
   remplissent ; saisir dans les dollars : euros et livres suivent. Deux
   lignes de taux, chacune avec sa source. Recharger : USD reste. Le retirer :
   l'écran revient à la paire.
2. **Échanges** : choisir USD comme devise principale : EGP devient la seconde.
   Dans les réglages, choisir USD comme référence : l'euro devient la seconde.
3. **Carnet** : saisir 10 dans les dollars, enregistrer : la ligne va de USD
   vers EUR.
4. **Calculatrice** : toucher « Calculatrice » ; au pavé, taper 12,5 + 7,5 dans
   les euros : « = 20,00 € » sous le champ, les livres à 1 176,60. Appuyer sur
   « = » : 20,00. Toucher le champ des livres, appuyer sur « + » : le calcul
   repart de son montant. Recharger : le pavé reste.
5. **Erreurs** : « 12 ÷ 0 », « 5 − 8 » : le message, les autres champs vides.
6. **Au clavier** : calculatrice éteinte, taper « 12+8 » dans un champ : le
   calcul est compris. Calculatrice allumée, parcourir le pavé à la
   tabulation.
7. **Petits écrans** : 320 px, pavé ouvert et seconde devise : rien ne déborde.
