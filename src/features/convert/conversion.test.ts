import { describe, expect, it } from 'vitest';
import { deriver } from './conversion.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

describe('deriver : un champ saisi, l’autre calculé', () => {
  it('200 EGP saisis donnent 3,40 € (récit 1, scénario 1)', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.montantDevise).toBe(200);
    expect(d.montantReference).toBeCloseTo(3.39963, 5);
    expect(d.texteReference).toBe('3,40');
    expect(d.texteDevise).toBe('200');
    expect(d.invalide).toBe(false);
  });

  it('20 € saisis donnent 1 176,60 EGP (récit 1, scénario 2)', () => {
    const d = deriver(
      { champ: 'reference', texte: '20' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(lisible(d.texteDevise)).toBe('1 176,60');
    expect(d.texteReference).toBe('20');
  });

  it('une devise sans décimales s’affiche sans décimales (scénario 5)', () => {
    const d = deriver(
      { champ: 'reference', texte: '10' },
      'JPY',
      'EUR',
      162.4,
      'fr'
    );
    expect(lisible(d.texteDevise)).toBe('1 624');
  });

  it('une saisie illisible est signalée, et l’autre champ reste vide', () => {
    const d = deriver(
      { champ: 'devise', texte: 'abc' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.invalide).toBe(true);
    expect(d.texteReference).toBe('');
    expect(d.montantReference).toBeNull();
  });

  it('sans taux, rien n’est inventé', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      undefined,
      'fr'
    );
    expect(d.texteReference).toBe('');
    expect(d.montantReference).toBeNull();
    expect(d.montantDevise).toBe(200);
  });

  it('le champ de la référence garde ses décimales : le yen', () => {
    // Le yen pour référence : un yen vaut 1/162,4 euro.
    const d = deriver(
      { champ: 'devise', texte: '10' },
      'EUR',
      'JPY',
      1 / 162.4,
      'fr'
    );
    expect(lisible(d.texteReference)).toBe('1 624');
  });

  it('une marge libre de 1,5 % réduit le montant reçu', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      50,
      'fr',
      1.5
    );
    expect(d.montantReference).toBeCloseTo(3.94, 5);
  });

  it('le nombre de chiffres choisi remplace ceux de la devise', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'EUR',
      58.83,
      'fr',
      0,
      4
    );
    expect(lisible(d.texteReference)).toBe('3,3996');
  });

  it('une marge de 2 % réduit le montant reçu, pas le montant saisi', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      'USD',
      50,
      'fr',
      2
    );
    expect(d.montantDevise).toBe(200);
    expect(d.montantReference).toBeCloseTo(3.92, 5);
  });

  it('un champ vide n’est pas une erreur', () => {
    const d = deriver(
      { champ: 'devise', texte: '' },
      'EGP',
      'EUR',
      58.83,
      'fr'
    );
    expect(d.invalide).toBe(false);
    expect(d.texteReference).toBe('');
  });
});
