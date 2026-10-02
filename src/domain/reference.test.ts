import { describe, expect, it } from 'vitest';
import { sourceDePaire, tauxCroise } from './reference.ts';

/** Ce que publient les deux sources : unités de chaque devise pour UN euro. */
const BCE = { USD: 1.0812, CHF: 0.9381, JPY: 162.4 };
const MARCHE = { EUR: 1, USD: 1.0815, CHF: 0.9384, EGP: 58.83 };

describe('sourceDePaire (recherche R1)', () => {
  it('la BCE quand elle publie les deux devises, l’euro compris', () => {
    expect(sourceDePaire('EUR', 'USD', BCE)).toBe('bce');
    expect(sourceDePaire('CHF', 'USD', BCE)).toBe('bce');
    expect(sourceDePaire('USD', 'EUR', BCE)).toBe('bce');
  });

  it('le marché dès que l’une des deux n’y est pas', () => {
    expect(sourceDePaire('EUR', 'EGP', BCE)).toBe('marche');
    expect(sourceDePaire('CHF', 'EGP', BCE)).toBe('marche');
    expect(sourceDePaire('EGP', 'USD', BCE)).toBe('marche');
  });

  it('le marché tant que la BCE n’est pas connue', () => {
    expect(sourceDePaire('EUR', 'USD', undefined)).toBe('marche');
  });
});

describe('tauxCroise : unités de la devise pour une unité de la référence', () => {
  it('avec l’euro pour référence, le taux publié tel quel', () => {
    expect(tauxCroise('EUR', 'EGP', MARCHE)).toBe(58.83);
    expect(tauxCroise('EUR', 'USD', BCE)).toBe(1.0812);
  });

  it('entre deux devises, le rapport de leurs taux contre l’euro', () => {
    // 58,83 EGP et 0,9384 CHF pour un euro : 62,69 EGP pour un franc.
    expect(tauxCroise('CHF', 'EGP', MARCHE)).toBeCloseTo(62.6918, 4);
    // La spécification 002, récit 1, scénario 2 : 200 EGP valent 3,19 CHF.
    expect(200 / tauxCroise('CHF', 'EGP', MARCHE)!).toBeCloseTo(3.19, 2);
  });

  it('vers l’euro, l’inverse du taux publié', () => {
    expect(tauxCroise('USD', 'EUR', BCE)).toBeCloseTo(1 / 1.0812, 12);
  });

  it('rien quand l’instantané ignore l’une des deux devises', () => {
    expect(tauxCroise('CHF', 'XOF', MARCHE)).toBeUndefined();
    expect(tauxCroise('XOF', 'EUR', MARCHE)).toBeUndefined();
  });
});
