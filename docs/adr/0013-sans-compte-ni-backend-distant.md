# 0013 — Sans compte ni backend distant

**Remplace**, pour cette application : [0004](./0004-backend.md) (le choix du
backend à l'exécution), [0007](./0007-comptes-et-droits.md),
[0009](./0009-supprimer-son-compte.md) et la partie distante de
[0010](./0010-ecrire-hors-ligne.md).

## Contexte

Le squelette livre deux adaptateurs derrière un port : l'appareil, et Supabase
quand ses deux variables sont posées, avec la connexion, les rôles, la
suppression de compte, une file d'écriture hors ligne, trois migrations, des
tests pgTAP et trois workflows.

La spécification 001 de Miss Devises demande l'inverse : tout ce que
l'utilisateur crée reste sur son appareil, sans compte (EF-014), et le réseau
ne sert qu'à lire des taux publics (constitution, principe II).

## Décision

Le backend est local, et lui seul. Partent : l'adaptateur Supabase, la file
d'écriture distante, la couche d'authentification, l'écran de compte, le
dossier `supabase/`, les workflows `supabase-*.yml`, la dépendance
`@supabase/supabase-js` et les variables qui les configuraient.

Le **port** reste : le carnet garde la forme du port `notes` (mutations,
asynchrone même en local), et un adaptateur distant pourrait revenir sans que
les écrans changent.

## Conséquences

- Aucune donnée ne quitte l'appareil, et aucun compte n'est à protéger :
  l'export et l'import en fichier sont le seul moyen de changer d'appareil.
- Le build ne construit plus de morceau Supabase, et la CI ne joue plus de
  tests pgTAP sans objet.
- Rattraper une synchronisation plus tard demandera de reprendre l'adaptateur
  du squelette, ses migrations et ses tests : c'est le prix d'un code qu'on ne
  livre pas sans s'en servir.

## Ce qu'on écarte

**Garder la couche inerte**, comme le permet le squelette sans ses variables :
elle se construirait, se testerait et se mettrait à jour sans jamais servir, et
l'écran de compte promettrait une fonction qui n'existe pas.
