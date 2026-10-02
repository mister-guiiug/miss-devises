import { describe, expect, it } from 'vitest';
import { convertir } from './convert.ts';

// Le taux s'exprime en unités de la devise étrangère pour UN euro, comme le
// publient les deux sources : 58,83 EGP pour 1 €.
const EGP = 58.83;

describe('convertir : euro ↔ devise', () => {
  it('de la devise vers l’euro (récit 1, scénario 1)', () => {
    expect(convertir(200, EGP, 'versReference')).toBeCloseTo(3.39963, 5);
  });

  it('de l’euro vers la devise (récit 1, scénario 2)', () => {
    expect(convertir(20, EGP, 'versDevise')).toBeCloseTo(1176.6, 10);
  });

  // Aucun arrondi interne : l'aller-retour rend le montant de départ.
  it('l’aller-retour rend le montant de départ', () => {
    const euros = convertir(200, EGP, 'versReference');
    expect(convertir(euros, EGP, 'versDevise')).toBeCloseTo(200, 10);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuse un taux de %s',
    taux => {
      expect(() => convertir(10, taux, 'versReference')).toThrow(RangeError);
    }
  );
});
