import { describe, expect, it } from 'vitest';
import type { ConversionEnregistree } from '../backend/ports.ts';
import { auTauxDuJour, deviseEtrangere, totauxParDevise } from './carnet.ts';

const musee: ConversionEnregistree = {
  id: 'c1',
  libelle: 'Visite du musée',
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 200 / 58.83 },
  taux: 58.83,
  source: 'marche',
  dateTaux: '2026-10-01',
  creeeLe: '2026-10-01T10:00:00.000Z',
};

const taxi: ConversionEnregistree = {
  ...musee,
  id: 'c2',
  libelle: 'Taxi',
  de: { code: 'EUR', montant: 20 },
  vers: { code: 'EGP', montant: 20 * 58.83 },
};

const hotel: ConversionEnregistree = {
  ...musee,
  id: 'c3',
  libelle: 'Hôtel',
  de: { code: 'USD', montant: 100 },
  vers: { code: 'EUR', montant: 100 / 1.0812 },
  taux: 1.0812,
  source: 'bce',
};

describe('deviseEtrangere : l’autre côté de l’euro', () => {
  it('que l’euro soit le départ ou l’arrivée', () => {
    expect(deviseEtrangere(musee)).toBe('EGP');
    expect(deviseEtrangere(taxi)).toBe('EGP');
  });
});

describe('auTauxDuJour : la même conversion, refaite aujourd’hui (EF-012)', () => {
  it('200 EGP vers l’euro, la livre ayant baissé', () => {
    const r = auTauxDuJour(musee, 59.2);
    expect(r.montant).toBeCloseTo(200 / 59.2, 10);
    expect(r.ecart).toBeCloseTo(58.83 / 59.2 - 1, 10);
  });

  it('20 € vers la livre', () => {
    const r = auTauxDuJour(taxi, 59.2);
    expect(r.montant).toBeCloseTo(20 * 59.2, 10);
    expect(r.ecart).toBeCloseTo(59.2 / 58.83 - 1, 10);
  });
});

describe('totauxParDevise : par devise étrangère, et en euros', () => {
  it('additionne chaque côté, quel que soit le sens', () => {
    const totaux = totauxParDevise([musee, taxi, hotel]);
    expect(totaux.map(t => t.code)).toEqual(['EGP', 'USD']);
    const egp = totaux[0];
    expect(egp?.nombre).toBe(2);
    expect(egp?.devise).toBeCloseTo(200 + 20 * 58.83, 10);
    expect(egp?.euros).toBeCloseTo(200 / 58.83 + 20, 10);
  });

  it('un carnet vide n’a pas de total', () => {
    expect(totauxParDevise([])).toEqual([]);
  });
});
