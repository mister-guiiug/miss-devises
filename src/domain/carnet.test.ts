import { describe, expect, it } from 'vitest';
import type { ConversionEnregistree } from '../backend/ports.ts';
import { auTauxDuJour, deviseEtrangere, totauxParPaire } from './carnet.ts';

const musee: ConversionEnregistree = {
  id: 'c1',
  libelle: 'Visite du musée',
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 200 / 58.83 },
  reference: 'EUR',
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

/** En francs suisses : 62,69 livres pour un franc. */
const souk: ConversionEnregistree = {
  ...musee,
  id: 'c4',
  libelle: 'Souk',
  de: { code: 'CHF', montant: 10 },
  vers: { code: 'EGP', montant: 626.9 },
  reference: 'CHF',
  taux: 62.69,
};

describe('deviseEtrangere : l’autre côté de la référence', () => {
  it('que la référence soit le départ ou l’arrivée', () => {
    expect(deviseEtrangere(musee)).toBe('EGP');
    expect(deviseEtrangere(taxi)).toBe('EGP');
    expect(deviseEtrangere(souk)).toBe('EGP');
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

  it('10 CHF vers la livre, au taux croisé du jour', () => {
    const r = auTauxDuJour(souk, 63);
    expect(r.montant).toBeCloseTo(630, 10);
    expect(r.ecart).toBeCloseTo(630 / 626.9 - 1, 10);
  });
});

describe('totauxParPaire : par devise étrangère et par référence', () => {
  it('additionne chaque côté, quel que soit le sens', () => {
    const totaux = totauxParPaire([musee, taxi, hotel]);
    expect(totaux.map(t => `${t.code}/${t.reference}`)).toEqual([
      'EGP/EUR',
      'USD/EUR',
    ]);
    const egp = totaux[0];
    expect(egp?.nombre).toBe(2);
    expect(egp?.devise).toBeCloseTo(200 + 20 * 58.83, 10);
    expect(egp?.montantReference).toBeCloseTo(200 / 58.83 + 20, 10);
  });

  it('ne mêle pas deux références : la livre en euros, la livre en francs', () => {
    const totaux = totauxParPaire([musee, souk, taxi]);
    expect(totaux.map(t => `${t.code}/${t.reference}`)).toEqual([
      'EGP/EUR',
      'EGP/CHF',
    ]);
    expect(totaux[1]?.montantReference).toBe(10);
  });

  it('un carnet vide n’a pas de total', () => {
    expect(totauxParPaire([])).toEqual([]);
  });
});
