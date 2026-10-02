import { describe, expect, it } from 'vitest';
import {
  chercherDevises,
  listerDevises,
  nomAuPluriel,
  nomDevise,
} from './currencies.ts';

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

describe('nomAuPluriel : « Montant en livres égyptiennes »', () => {
  it('en français et en anglais', () => {
    expect(nomAuPluriel('EGP', 'fr')).toBe('livres égyptiennes');
    expect(nomAuPluriel('EUR', 'fr')).toBe('euros');
    expect(nomAuPluriel('CHF', 'fr')).toBe('francs suisses');
    expect(nomAuPluriel('EGP', 'en')).toBe('Egyptian pounds');
    expect(nomAuPluriel('EUR', 'en')).toBe('euros');
  });

  it('un code inconnu se nomme par lui-même', () => {
    expect(nomAuPluriel('ZZZ', 'fr')).toBe('ZZZ');
  });
});

describe('listerDevises', () => {
  const codes = ['USD', 'EGP', 'JPY', 'EUR', 'MAD', 'CHF'];

  it('écarte la référence et trie par nom, les récentes en tête', () => {
    const liste = listerDevises(codes, 'fr', ['MAD', 'JPY'], 'CHF');
    expect(liste.map(d => d.code)).toEqual(['MAD', 'JPY', 'USD', 'EUR', 'EGP']);
    expect(liste[0]).toEqual({
      code: 'MAD',
      nom: 'Dirham marocain',
      recente: true,
    });
  });

  it('avec l’euro pour référence, l’euro n’est pas proposé', () => {
    const liste = listerDevises(codes, 'fr', ['MAD', 'JPY'], 'EUR');
    expect(liste.map(d => d.code)).not.toContain('EUR');
  });

  it('place les épingles avant les récentes, sans les répéter', () => {
    const liste = listerDevises(codes, 'fr', ['MAD', 'JPY'], 'CHF', [
      'JPY',
      'USD',
    ]);
    expect(liste.map(d => d.code)).toEqual(['JPY', 'USD', 'MAD', 'EUR', 'EGP']);
    expect(liste[0]?.epinglee).toBe(true);
    expect(liste[2]?.recente).toBe(true);
  });

  it('sans référence à écarter, toutes les devises', () => {
    const liste = listerDevises(codes, 'fr', ['MAD', 'JPY']);
    expect(liste.map(d => d.code)).toEqual([
      'MAD',
      'JPY',
      'USD',
      'EUR',
      'CHF',
      'EGP',
    ]);
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
