import { describe, expect, it } from 'vitest';
import coupuresJson from './coupures.json';
import photosJson from './photos.json';
import documentation from '../../specs/002-reference-drapeaux-photos/photos.md?raw';
import { coupuresSchema } from './coupures.ts';
import {
  DIAMETRE_PIECE,
  LARGEUR_BILLET,
} from '../features/money/MoneySheet.tsx';
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

/**
 * Écartées par prudence, bien que Commons les admette (revue juridique du
 * 02/10/2026, `photos.md`) : la roupie indonésienne (loi 7/2011, art. 24 :
 * « spesimen » exigé) et le réal (loi 4.511/1964, art. 13 : diffusion soumise
 * à la Banque centrale). Les billets égyptiens aussi, plus bas.
 */
const ECARTEES = ['IDR', 'BRL'];

/** Un pixel CSS, au pixel de référence (96 par pouce), en millimètres. */
const MM_PAR_PX = 25.4 / 96;

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

  it('ne prend rien d’une devise que Commons refuse, ni de celles écartées', () => {
    for (const code of [...REFUSEES, ...ECARTEES]) {
      expect(photos.devises[code], code).toBeUndefined();
    }
  });

  it('ne montre aucun billet égyptien : une licence du ministre de l’Intérieur l’exige', () => {
    // Code pénal égyptien, art. 204 bis (A) ; les pièces n'y sont pas visées.
    expect(photos.devises.EGP?.billets ?? []).toEqual([]);
  });

  it('montre chaque coupure à 70 % de sa taille réelle au plus', () => {
    // La Banque d'Israël veut ses pièces réduites d'au moins 30 % ; la règle
    // est tenue partout. Le volet donne au plus grand billet de la devise
    // LARGEUR_BILLET pixels, et à sa plus grande pièce DIAMETRE_PIECE.
    for (const { code, genre, photo } of toutes) {
      const devise = coupures.devises[code]!;
      if (genre === 'piece') {
        const piece = devise.pieces.find(p => p.valeur === photo.valeur);
        const max = Math.max(...devise.pieces.map(p => p.diametreMm ?? 0));
        if (!piece?.diametreMm || !max) continue;
        const px = Math.max(
          DIAMETRE_PIECE * 0.55,
          (DIAMETRE_PIECE * piece.diametreMm) / max
        );
        expect(px * MM_PAR_PX, `${code} ${photo.valeur}`).toBeLessThanOrEqual(
          0.7 * piece.diametreMm
        );
      } else {
        const billet = devise.billets.find(b => b.valeur === photo.valeur);
        const max = Math.max(...devise.billets.map(b => b.largeurMm ?? 0));
        if (!billet?.largeurMm || !max) continue;
        const px = (LARGEUR_BILLET * billet.largeurMm) / max;
        expect(px * MM_PAR_PX, `${code} ${photo.valeur}`).toBeLessThanOrEqual(
          0.7 * billet.largeurMm
        );
      }
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

  it('lie chaque licence Creative Commons à son texte', () => {
    for (const { code, photo } of toutes) {
      if (!/^CC/.test(photo.licence)) continue;
      expect(photo.licenceUrl, `${code} ${photo.fichier}`).toMatch(
        /^https:\/\/creativecommons\.org\//
      );
    }
  });

  it('crédite la Banque d’Israël comme elle le demande', () => {
    for (const { code, photo } of toutes) {
      if (code !== 'ILS') continue;
      expect(photo.auteur).toContain('droits réservés à la Banque d’Israël');
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
