import { describe, expect, it } from 'vitest';
import coupuresJson from './coupures.json';
import photosJson from './photos.json';
import documentation from '../../specs/002-reference-drapeaux-photos/photos.md?raw';
import { coupuresSchema } from './coupures.ts';
import {
  largeurDeVignette,
  pageCommons,
  PALIERS,
  photosSchema,
} from './photos.ts';

const coupures = coupuresSchema.parse(coupuresJson);
const photos = photosSchema.parse(photosJson);

/**
 * Les devises dont Commons refuse les dessins (relevé du 02/10/2026,
 * `photos.md`) : aucune photo ne doit en entrer, même hébergée.
 */
const REFUSEES = [
  'GBP', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'AED', 'ZAR',
  'CNY', 'HKD', 'MYR', 'SGD', 'THB', 'VND', 'MXN', 'ARS',
]; // prettier-ignore

/** Chaque photo du jeu, avec sa devise et son genre. */
const toutes = Object.entries(photos.devises).flatMap(([code, d]) => [
  ...d.billets.map(photo => ({ code, genre: 'billet' as const, photo })),
  ...d.pieces.map(photo => ({ code, genre: 'piece' as const, photo })),
]);

describe('le jeu des photos (spécification 002, récit 3)', () => {
  it('ne photographie que des coupures du jeu de données, une fois chacune', () => {
    const vues = new Set<string>();
    for (const { code, genre, photo } of toutes) {
      const devise = coupures.devises[code];
      const liste = genre === 'billet' ? devise?.billets : devise?.pieces;
      expect(
        liste?.some(c => c.valeur === photo.valeur),
        `${code} ${genre} ${photo.valeur}`
      ).toBe(true);
      const cle = `${code} ${genre} ${photo.valeur}`;
      expect(vues.has(cle), cle).toBe(false);
      vues.add(cle);
    }
  });

  it('ne prend rien d’une devise que Commons refuse', () => {
    for (const code of REFUSEES) {
      expect(photos.devises[code], code).toBeUndefined();
    }
  });

  it('demande ses vignettes aux paliers que Commons sert', () => {
    for (const { code, photo } of toutes) {
      const largeur = largeurDeVignette(photo.vignette);
      if (largeur === undefined) {
        // Un original plus étroit que le palier, servi tel quel.
        expect(photo.vignette, code).toMatch(/^https:\/\/upload\./);
        expect(photo.largeur, code).toBeLessThanOrEqual(120);
      } else {
        expect(PALIERS, `${code} ${photo.fichier}`).toContain(largeur);
      }
    }
  });

  it('montre chaque billet à 72 dpi au plus, à sa taille réelle', () => {
    for (const { code, genre, photo } of toutes) {
      if (genre !== 'billet') continue;
      const billet = coupures.devises[code]?.billets.find(
        b => b.valeur === photo.valeur
      );
      const largeur = largeurDeVignette(photo.vignette) ?? photo.largeur;
      if (!billet?.largeurMm || !billet.hauteurMm) continue;
      // La largeur de l'image porte le grand côté d'un billet couché, le
      // petit d'un billet debout (9e série suisse).
      const mm =
        photo.hauteur > photo.largeur
          ? Math.min(billet.largeurMm, billet.hauteurMm)
          : Math.max(billet.largeurMm, billet.hauteurMm);
      const dpi = largeur / (mm / 25.4);
      expect(dpi, `${code} ${photo.valeur}`).toBeLessThanOrEqual(72);
    }
  });

  it('donne à chaque photo un auteur et une licence à créditer', () => {
    for (const { photo } of toutes) {
      expect(photo.auteur.trim()).not.toBe('');
      expect(photo.licence.trim()).not.toBe('');
    }
  });

  it('publie sa couverture dans photos.md (CR-005)', () => {
    const repertoriees = Object.values(coupures.devises).reduce(
      (n, d) => n + d.billets.length + d.pieces.length,
      0
    );
    expect(documentation).toContain(
      `**Couverture** : ${toutes.length} coupures sur ${repertoriees}`
    );
  });
});

describe('pageCommons : la page du fichier, sa source et sa licence', () => {
  it('remplace les espaces et encode le reste', () => {
    expect(pageCommons('EUR 50 obverse (2002 issue).jpg')).toBe(
      'https://commons.wikimedia.org/wiki/File:EUR_50_obverse_(2002_issue).jpg'
    );
    expect(pageCommons('The Europa series 20 € obverse side.jpg')).toBe(
      'https://commons.wikimedia.org/wiki/File:The_Europa_series_20_%E2%82%AC_obverse_side.jpg'
    );
  });
});
