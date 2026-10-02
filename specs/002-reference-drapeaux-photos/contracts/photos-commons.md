# Contrat : les photos de Wikimedia Commons

Ce que l'application attend du jeu `src/data/photos.json`, et ce qu'elle
demande à Wikimedia.

## Le jeu

```json
{
  "releveLe": "2026-10-02",
  "devises": {
    "EUR": {
      "billets": [
        {
          "valeur": 50,
          "fichier": "The Europa series 50 € obverse side.png",
          "vignette": "https://thumb.wikimedia.org/wikipedia/commons/thumb/…/330px-…png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
          "largeur": 588,
          "hauteur": 322,
          "auteur": "Robert Kalina, redesign by Reinhold Gerstetter ; © BCE",
          "licence": "ECB decisions ECB/2003/4 and ECB/2003/5"
        }
      ],
      "pieces": []
    }
  }
}
```

`licenceUrl`, facultatif, est le texte de la licence (`LicenseUrl` de l'API),
présent pour les licences Creative Commons et GODL-India.

Validé par `photosSchema` (`src/data/photos.ts`) au chargement. Les tests
vérifient en plus : chaque photo désigne une coupure du jeu des coupures, une
fois ; aucune devise que Commons refuse ; une largeur de palier ; 72 dpi au
plus pour un billet à sa taille réelle ; 70 % de la taille réelle au plus à
l'écran ; un auteur et une licence, liée à son texte pour une licence Creative
Commons ; le crédit de la Banque d'Israël ; aucune devise refusée par Commons
ni écartée par prudence ; la couverture publiée dans [photos.md](../photos.md).

## Les requêtes

| Quand        | Vers                             | Quoi                                         |
| ------------ | -------------------------------- | -------------------------------------------- |
| mode dessins | rien                             | aucune requête vers Wikimedia                |
| mode photos  | `thumb.wikimedia.org`, `upload…` | les vignettes des coupures montrées          |
| hors ligne   | le cache du service worker       | les vignettes déjà vues ; sinon, les dessins |

Chaque image part avec `crossorigin="anonymous"` (ni cookie envoyé ni cookie
gardé) et `referrerpolicy="no-referrer"` (pas de référent). Wikimedia voit
l'adresse IP, le navigateur, l'heure et l'adresse de l'image.

## Les crédits

Pour chaque photo montrée : un lien « Crédit » vers sa page Commons
(`https://commons.wikimedia.org/wiki/File:<nom>`), et une ligne de la liste
« Crédits des photos » : la coupure, le titre du fichier, l'auteur, la licence
(liée à `licenceUrl` quand il existe), le lien vers la page Commons.
