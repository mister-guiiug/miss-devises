import { describe, expect, it } from 'vitest';
import { convertirDepenses, lireDepenses } from './depenses.ts';
import type { EtatTaux } from '../rates/service.ts';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const ETAT: EtatTaux = {
  marche: {
    source: 'marche',
    date: AUJOURDHUI,
    taux: { EUR: 1, JPY: 162.4, USD: 1.0815 },
  },
};
const lisible = (texte: string | null) => texte?.replace(/\s/g, ' ');

describe('les dépenses notées par l’agent', () => {
  it('lit l’état de l’agent, en ignorant ce qui n’est pas une dépense', () => {
    expect(
      lireDepenses({
        depenses: [
          { id: '1', libelle: 'taxi', montant: 3000, devise: 'JPY' },
          { id: '2', libelle: 'faux', montant: -1, devise: 'JPY' },
          'rien',
        ],
      })
    ).toEqual([{ id: '1', libelle: 'taxi', montant: 3000, devise: 'JPY' }]);
    expect(lireDepenses(undefined)).toEqual([]);
    expect(lireDepenses({ depenses: 'non' })).toEqual([]);
  });

  it('les convertit au taux du jour et en fait le total ; une ligne sans taux ne compte pas', () => {
    const converties = convertirDepenses(
      [
        { id: '1', libelle: 'taxi', montant: 3000, devise: 'JPY' },
        { id: '2', libelle: 'musée', montant: 12, devise: 'EUR' },
        { id: '3', libelle: 'thé', montant: 50, devise: 'THB' },
      ],
      'EUR',
      ETAT,
      'fr'
    );
    expect(converties.lignes.map(l => lisible(l.texteReference))).toEqual([
      '18,47 €',
      '12,00 €',
      undefined,
    ]);
    expect(lisible(converties.totalTexte)).toBe('30,47 €');
    expect(converties.sansTaux).toBe(1);
  });
});
