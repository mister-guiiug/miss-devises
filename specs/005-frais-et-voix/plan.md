# Plan d'implémentation : les frais d'une conversion, et les phrases parlées

**Branche** : `005-frais-et-voix` · **Date** : 26/10/2026 ·
**Spécification** : [spec.md](./spec.md)

## Résumé

Des frais nommés (pourcentage, montant fixe et sa devise) s'enregistrent dans
les réglages ; l'écran Convertir en applique un, et montre sous les montants le
coût en référence frais compris. Les phrases des mots utiles gagnent un bouton
« Écouter », qui passe par la synthèse vocale de l'appareil.

## Contexte technique

| Point       | Choix                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- |
| Langage     | TypeScript ~6.0.3 strict                                                                      |
| Dépendances | aucune nouvelle ; `speechSynthesis` du navigateur                                             |
| Stockage    | préférences en version 2 : `frais` et `fraisChoisis`, à valeur par défaut, sans migration     |
| Réseau      | aucune requête de plus                                                                        |
| Tests       | Vitest 5 + jsdom (synthèse vocale simulée) ; Playwright (`@critical`, `@a11y`) ; `pwa-doctor` |
| Performance | quelques kilo-octets ; la voix vit dans le morceau des mots utiles                            |

## Contrôle de la constitution

Contrôlé contre la version 2.0.0.

| Principe                       | Tenu par                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| I. Un montant juste et daté    | frais calculés sur le montant indicatif, arrondis à l'affichage ; montant fixe converti au taux de sa paire, jamais un taux inventé |
| II. L'appareil d'abord         | frais dans les préférences locales ; voix de l'appareil, aucune requête                                                             |
| III. Visuel, accessible, légal | inchangé                                                                                                                            |
| IV. Lisible partout            | boutons nommés par la phrase qu'ils disent ; 320 px ; axe dans les deux thèmes ; fr et en                                           |
| V. Les tests d'abord           | calcul des frais, préférences, choix d'une voix, feuille et écran : chacun son test, vu rouge ; e2e par récit                       |
| VI. Le socle avant le code     | `Sheet`, `TextField`, `Button`, `CurrencyPicker` de l'app ; ni frais ni voix dans le socle ni dans une autre app du parc            |

**Écarts** : aucun.

## Structure

```text
src/
├── domain/frais.ts                    # coût frais compris (nouveau)
├── app/preferences.ts                 # frais, frais choisis
├── features/
│   ├── convert/LigneFrais.tsx         # choix et coût sous les montants (nouveau)
│   ├── settings/ReglageFrais.tsx      # liste et formulaire (nouveau)
│   └── phrases/
│       ├── voix.ts                    # choisir une voix, dire une phrase (nouveau)
│       └── MotsUtiles.tsx             # « Écouter »
```

## Livraison

Une pull request, un commit par récit.

## Suivi de la complexité

| Choix                             | Pourquoi                                                             | Plus simple, écarté parce que                                                                       |
| --------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| des frais nommés, un à la fois    | une carte et un retrait n'ont pas les mêmes frais ; on paie par l'un | un seul jeu de frais : il faudrait le retaper à chaque changement de moyen de paiement              |
| la devise du montant fixe         | les 220 bahts d'un distributeur ne sont pas des euros                | un montant fixe en référence : faux pour les frais locaux, et faux après un changement de référence |
| le coût à part, sous les montants | la conversion reste lisible et comparable au taux affiché            | appliquer les frais aux champs : le taux affiché et les montants ne se répondraient plus            |
| la voix de l'appareil             | aucune requête, aucun fichier                                        | des enregistrements : des mégaoctets, et un tiers pour les produire                                 |
