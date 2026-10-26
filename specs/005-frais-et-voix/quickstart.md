# Démarrage rapide : vérifier la spécification 005

```bash
npm test
npm run test:e2e
npm run build
```

## Scénarios à rejouer à la main

1. **Frais** : Réglages, « Ajouter des frais » : « Carte », 2 %, 0,50 €.
   Convertir : choisir « Carte », saisir 200 EGP : « Coût avec frais : 3,97 € »,
   « dont 0,57 € de frais ». Recharger : « Carte » reste choisi.
2. **Frais en devise locale** : « Retrait », 220 THB ; sur la paire EUR-THB,
   le montant fixe se convertit au taux de la paire.
3. **Supprimer** : supprimer « Carte » dans les réglages : Convertir revient à
   « Aucun ».
4. **Voix** : devise THB, « Mots utiles », « Écouter » à côté de « ลดได้ไหม » :
   la phrase est dite en thaï ; le bouton devient « Arrêter ». Sur un appareil
   sans voix thaïe : pas de bouton, et la feuille le dit.
