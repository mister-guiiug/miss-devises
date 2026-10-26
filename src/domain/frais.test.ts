import { describe, expect, it } from 'vitest';
import { coutAvecFrais, decrireFrais, fixeEnReference } from './frais.ts';

const CARTE = {
  id: 'carte',
  libelle: 'Carte',
  pourcentage: 2,
  fixe: 0.5,
  deviseFixe: 'EUR',
};

describe('les frais d’une conversion (spécification 005, recherche R1)', () => {
  it('200 EGP coûtent 3,97 €, dont 0,57 € de frais (scénario 2)', () => {
    const indicatif = 200 / 58.83;
    const fixe = fixeEnReference(CARTE, 'EUR', undefined);
    expect(fixe).toBe(0.5);
    const { frais, total } = coutAvecFrais(indicatif, CARTE.pourcentage, fixe!);
    expect(frais).toBeCloseTo(indicatif * 0.02 + 0.5, 12);
    expect(total).toBeCloseTo(3.9676, 4);
    expect(frais).toBeCloseTo(0.568, 3);
  });

  it('un montant fixe dans une autre devise se convertit au taux de sa paire (scénario 3)', () => {
    const retrait = { ...CARTE, pourcentage: 0, fixe: 220, deviseFixe: 'THB' };
    // 38,5 THB pour un euro : 220 THB font 5,714 €.
    expect(fixeEnReference(retrait, 'EUR', 38.5)).toBeCloseTo(5.7143, 4);
  });

  it('sans taux pour la devise du montant fixe, rien n’est inventé', () => {
    const retrait = { ...CARTE, fixe: 220, deviseFixe: 'THB' };
    expect(fixeEnReference(retrait, 'EUR', undefined)).toBeNull();
    expect(fixeEnReference(retrait, 'EUR', 0)).toBeNull();
  });

  it('un montant fixe nul n’a pas besoin de taux', () => {
    const pourcent = { ...CARTE, fixe: 0, deviseFixe: 'THB' };
    expect(fixeEnReference(pourcent, 'EUR', undefined)).toBe(0);
  });

  it('aucun arrondi en route : il se fait à l’affichage', () => {
    const { total } = coutAvecFrais(1 / 3, 1.5, 0);
    expect(total).toBe(1 / 3 + (1 / 3) * 0.015);
  });
});

describe('decrireFrais', () => {
  const lisible = (texte: string) => texte.replace(/\s/g, ' ');

  it('dit le pourcentage et le montant fixe, dans la langue', () => {
    expect(lisible(decrireFrais(CARTE, 'fr'))).toBe('2 % + 0,50 €');
    expect(lisible(decrireFrais(CARTE, 'en'))).toBe('2% + €0.50');
  });

  it('tait la part nulle', () => {
    expect(lisible(decrireFrais({ ...CARTE, fixe: 0 }, 'fr'))).toBe('2 %');
    expect(
      lisible(
        decrireFrais(
          { ...CARTE, pourcentage: 0, fixe: 220, deviseFixe: 'THB' },
          'fr'
        )
      )
    ).toBe('220,00 THB');
  });
});
