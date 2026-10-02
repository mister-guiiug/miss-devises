import { describe, expect, it } from 'vitest';
import coupures from './coupures.json';
import { chargerWikipedia } from './wikipedia.ts';

describe('l’article Wikipédia de chaque devise', () => {
  it('chaque devise du jeu a le sien, sur en.wikipedia.org', async () => {
    const { devises } = await chargerWikipedia();
    expect(Object.keys(devises).sort()).toEqual(
      Object.keys(coupures.devises).sort()
    );
    for (const url of Object.values(devises)) {
      expect(url).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/);
    }
    // Celle dont les billets restent dessinés, et pourquoi le lien existe.
    expect(devises.EGP).toBe('https://en.wikipedia.org/wiki/Egyptian_pound');
  });

  it('un code porté par deux éléments Wikidata mène à la devise, pas au reste', async () => {
    const { devises } = await chargerWikipedia();
    // GBP : aussi « économie du Royaume-Uni » ; INR : aussi la roupie numérique.
    expect(devises.GBP).toBe('https://en.wikipedia.org/wiki/Pound_sterling');
    expect(devises.INR).toBe('https://en.wikipedia.org/wiki/Indian_rupee');
  });
});
