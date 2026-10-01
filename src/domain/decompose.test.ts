import { describe, expect, it } from 'vitest';
import { decomposer, type Systeme } from './decompose.ts';

// Des systèmes de coupures écrits ici, et non lus dans `coupures.json` : ces
// tests éprouvent l'algorithme, pas le jeu de données.
const euro: Systeme = {
  decimales: 2,
  billets: [
    { valeur: 5 },
    { valeur: 10 },
    { valeur: 20 },
    { valeur: 50 },
    { valeur: 100 },
    { valeur: 200 },
    { valeur: 500, plusEmis: true },
  ],
  pieces: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2].map(valeur => ({ valeur })),
};

const yen: Systeme = {
  decimales: 0,
  billets: [{ valeur: 1000 }, { valeur: 5000 }, { valeur: 10000 }],
  pieces: [1, 5, 10, 50, 100, 500].map(valeur => ({ valeur })),
};

// La plus petite pièce vaut 25 piastres : un reste est possible.
const livre: Systeme = {
  decimales: 2,
  billets: [5, 10, 20, 50, 100, 200].map(valeur => ({ valeur })),
  pieces: [0.25, 0.5, 1].map(valeur => ({ valeur })),
};

const lignes = (montant: number, systeme: Systeme) =>
  decomposer(montant, systeme).lignes.map(
    l => `${l.nombre} × ${l.valeur} ${l.type}`
  );

describe('decomposer : un montant en billets et pièces (recherche R5)', () => {
  it('du plus grand au plus petit', () => {
    expect(lignes(3.4, euro)).toEqual([
      '1 × 2 piece',
      '1 × 1 piece',
      '2 × 0.2 piece',
    ]);
  });

  it('arrondit d’abord aux décimales de la devise', () => {
    expect(lignes(3.3996, euro)).toEqual(lignes(3.4, euro));
  });

  it('ne compte pas une coupure qui n’est plus émise', () => {
    expect(lignes(1234.56, euro)).toEqual([
      '6 × 200 billet',
      '1 × 20 billet',
      '1 × 10 billet',
      '2 × 2 piece',
      '1 × 0.5 piece',
      '1 × 0.05 piece',
      '1 × 0.01 piece',
    ]);
  });

  it('compte en unités entières : 0,1 + 0,2 font bien 0,3', () => {
    const d = decomposer(0.3, euro);
    expect(d.lignes.map(l => [l.valeur, l.nombre])).toEqual([
      [0.2, 1],
      [0.1, 1],
    ]);
    expect(d.reste).toBe(0);
  });

  it('une devise sans décimales arrondit à l’unité', () => {
    expect(lignes(1176.6, yen)).toEqual([
      '1 × 1000 billet',
      '1 × 100 piece',
      '1 × 50 piece',
      '2 × 10 piece',
      '1 × 5 piece',
      '2 × 1 piece',
    ]);
  });

  it('dit ce qui reste sous la plus petite pièce', () => {
    const d = decomposer(1176.66, livre);
    expect(d.lignes.map(l => `${l.nombre} × ${l.valeur}`)).toEqual([
      '5 × 200',
      '1 × 100',
      '1 × 50',
      '1 × 20',
      '1 × 5',
      '1 × 1',
      '1 × 0.5',
    ]);
    expect(d.reste).toBe(0.16);
  });

  it('une valeur à la fois billet et pièce compte une fois, en pièce', () => {
    const d = decomposer(3, {
      decimales: 2,
      billets: [{ valeur: 1 }, { valeur: 5 }],
      pieces: [{ valeur: 1 }],
    });
    expect(d.lignes).toEqual([{ valeur: 1, type: 'piece', nombre: 3 }]);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rien à décomposer pour %s',
    montant => {
      expect(decomposer(montant, euro)).toEqual({ lignes: [], reste: 0 });
    }
  );

  it('sans coupures connues, tout est reste', () => {
    expect(
      decomposer(12.345, { decimales: 2, billets: [], pieces: [] })
    ).toEqual({ lignes: [], reste: 12.35 });
  });
});
