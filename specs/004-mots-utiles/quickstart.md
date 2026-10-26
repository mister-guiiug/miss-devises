# Démarrage rapide : vérifier la spécification 004

## Vérifier

```bash
npm test
npm run test:e2e
npm run build
```

## Scénarios à rejouer à la main

1. **Arabe égyptien** : devise EGP, « Mots utiles » : seize phrases en quatre
   groupes, texte, transcription et sens en français. Toucher « بكام ده؟ » :
   la phrase en grand ; « Retour à la liste ».
2. **Langue de l'application** : passer en anglais dans les réglages, rouvrir
   la feuille : le sens est en anglais.
3. **Plusieurs langues** : devise CHF : allemand, italien ; le français n'est
   pas proposé (application en français).
4. **Seconde devise** : EGP et USD : arabe égyptien puis anglais.
5. **Rien à proposer** : devise XOF, application en français : pas de bouton.
6. **Hors ligne** : couper le réseau après une première ouverture : la feuille
   s'ouvre.
7. **Petits écrans** : 320 px, une phrase longue (« Vous pouvez me faire la
   monnaie sur ce billet ? ») se replie sans déborder.
