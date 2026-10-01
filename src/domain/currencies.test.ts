import { describe, expect, it } from 'vitest';
import { chercherDevises, listerDevises, nomDevise } from './currencies.ts';

describe('nomDevise : le nom d’une devise, par Intl', () => {
  it('en français, avec une majuscule en tête de liste', () => {
    expect(nomDevise('EGP', 'fr')).toBe('Livre égyptienne');
    expect(nomDevise('USD', 'fr')).toBe('Dollar des États-Unis');
  });

  it('en anglais', () => {
    expect(nomDevise('EGP', 'en')).toBe('Egyptian Pound');
  });

  it('un code inconnu se nomme par lui-même', () => {
    expect(nomDevise('ZZZ', 'fr')).toBe('ZZZ');
  });
});

describe('listerDevises', () => {
  const codes = ['USD', 'EGP', 'JPY', 'EUR', 'MAD'];

  it('écarte l’euro et trie par nom, les récentes en tête', () => {
    const liste = listerDevises(codes, 'fr', ['MAD', 'JPY']);
    expect(liste.map(d => d.code)).toEqual(['MAD', 'JPY', 'USD', 'EGP']);
    expect(liste[0]).toEqual({
      code: 'MAD',
      nom: 'Dirham marocain',
      recente: true,
    });
  });
});

describe('chercherDevises : par code ou par nom, sans accents ni casse', () => {
  const liste = listerDevises(['USD', 'EGP', 'GBP', 'JPY'], 'fr');

  it.each([
    ['egp', ['EGP']],
    ['EG', ['EGP']],
    ['egyptienne', ['EGP']],
    ['LIVRE', ['EGP', 'GBP']],
    ['', ['USD', 'EGP', 'GBP', 'JPY']],
  ])('« %s »', (requete, attendus) => {
    expect(
      chercherDevises(liste, requete)
        .map(d => d.code)
        .sort()
    ).toEqual([...attendus].sort());
  });
});
