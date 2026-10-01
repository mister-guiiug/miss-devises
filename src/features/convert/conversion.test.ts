import { describe, expect, it } from 'vitest';
import { deriver } from './conversion.ts';

const lisible = (texte: string) => texte.replace(/\s/g, ' ');

describe('deriver : un champ saisi, l’autre calculé', () => {
  it('200 EGP saisis donnent 3,40 € (récit 1, scénario 1)', () => {
    const d = deriver({ champ: 'devise', texte: '200' }, 'EGP', 58.83, 'fr');
    expect(d.montantDevise).toBe(200);
    expect(d.montantEuro).toBeCloseTo(3.39963, 5);
    expect(d.texteEuro).toBe('3,40');
    expect(d.texteDevise).toBe('200');
    expect(d.invalide).toBe(false);
  });

  it('20 € saisis donnent 1 176,60 EGP (récit 1, scénario 2)', () => {
    const d = deriver({ champ: 'euro', texte: '20' }, 'EGP', 58.83, 'fr');
    expect(lisible(d.texteDevise)).toBe('1 176,60');
    expect(d.texteEuro).toBe('20');
  });

  it('une devise sans décimales s’affiche sans décimales (scénario 5)', () => {
    const d = deriver({ champ: 'euro', texte: '10' }, 'JPY', 162.4, 'fr');
    expect(lisible(d.texteDevise)).toBe('1 624');
  });

  it('une saisie illisible est signalée, et l’autre champ reste vide', () => {
    const d = deriver({ champ: 'devise', texte: 'abc' }, 'EGP', 58.83, 'fr');
    expect(d.invalide).toBe(true);
    expect(d.texteEuro).toBe('');
    expect(d.montantEuro).toBeNull();
  });

  it('sans taux, rien n’est inventé', () => {
    const d = deriver(
      { champ: 'devise', texte: '200' },
      'EGP',
      undefined,
      'fr'
    );
    expect(d.texteEuro).toBe('');
    expect(d.montantEuro).toBeNull();
    expect(d.montantDevise).toBe(200);
  });

  it('un champ vide n’est pas une erreur', () => {
    const d = deriver({ champ: 'devise', texte: '' }, 'EGP', 58.83, 'fr');
    expect(d.invalide).toBe(false);
    expect(d.texteEuro).toBe('');
  });
});
