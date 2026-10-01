import { describe, expect, it } from 'vitest';
import { comparer, statistiques } from './history.ts';

const serie = [
  { date: '2025-10-01', taux: 56.18 },
  { date: '2026-01-05', taux: 60.4 },
  { date: '2026-04-06', taux: 50.9 },
  { date: '2026-10-01', taux: 58.83 },
];

describe('statistiques : la série d’une période (récit 3)', () => {
  it('début, fin, plus haut, plus bas et variation', () => {
    const s = statistiques(serie);
    expect(s?.debut).toEqual(serie[0]);
    expect(s?.fin).toEqual(serie[3]);
    expect(s?.plusHaut).toEqual(serie[1]);
    expect(s?.plusBas).toEqual(serie[2]);
    expect(s?.variation).toBeCloseTo((58.83 - 56.18) / 56.18, 10);
  });

  it('remet les points dans l’ordre des dates', () => {
    const melangee = [serie[2], serie[0], serie[3], serie[1]].filter(
      p => p !== undefined
    );
    expect(statistiques(melangee)).toEqual(statistiques(serie));
  });

  it('un seul point : aucune variation', () => {
    const s = statistiques([{ date: '2026-10-01', taux: 58.83 }]);
    expect(s?.variation).toBe(0);
    expect(s?.plusHaut).toEqual(s?.plusBas);
  });

  it('rien à dire d’une série vide', () => {
    expect(statistiques([])).toBeUndefined();
  });
});

describe('comparer : le montant saisi au début de la période et aujourd’hui', () => {
  it('200 EGP valaient 3,56 € il y a un an, 3,40 € aujourd’hui', () => {
    const c = comparer(200, 'versEuro', 56.18, 58.83);
    expect(c.avant).toBeCloseTo(3.56, 2);
    expect(c.maintenant).toBeCloseTo(3.4, 2);
    expect(c.ecart).toBeCloseTo(200 / 58.83 - 200 / 56.18, 10);
    expect(c.pourcentage).toBeCloseTo(56.18 / 58.83 - 1, 10);
  });

  it('20 € valaient 1 123,60 EGP, et valent 1 176,60 EGP', () => {
    const c = comparer(20, 'versDevise', 56.18, 58.83);
    expect(c.avant).toBeCloseTo(1123.6, 6);
    expect(c.maintenant).toBeCloseTo(1176.6, 6);
    expect(c.pourcentage).toBeCloseTo(58.83 / 56.18 - 1, 10);
  });
});
