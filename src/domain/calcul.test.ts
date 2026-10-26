import { describe, expect, it } from 'vitest';
import { appuyer, estUnCalcul, evaluer } from './calcul.ts';

const valeur = (texte: string, langue: 'fr' | 'en' = 'fr') => {
  const lecture = evaluer(texte, langue);
  return 'valeur' in lecture ? lecture.valeur : lecture.erreur;
};

describe('evaluer : lire un calcul (spécification 003, recherche R2)', () => {
  it('lit un montant seul comme un champ simple', () => {
    expect(valeur('12,5')).toBe(12.5);
    expect(valeur('1 234,50')).toBe(1234.5);
    expect(valeur('1.234')).toBe(1234);
    expect(valeur('12.5', 'en')).toBe(12.5);
  });

  it('additionne et soustrait, avec les opérateurs du pavé et du clavier', () => {
    expect(valeur('12,5 + 7,5')).toBe(20);
    expect(valeur('12+8')).toBe(20);
    expect(valeur('20 − 4,5')).toBe(15.5);
    expect(valeur('20-4,5')).toBe(15.5);
  });

  it('multiplie et divise avant d’additionner (scénario 5)', () => {
    expect(valeur('2 + 3 × 4')).toBe(14);
    expect(valeur('2+3*4')).toBe(14);
    expect(valeur('20 ÷ 4 − 1')).toBe(4);
    expect(valeur('20/4-1')).toBe(4);
    expect(valeur('10 − 2 × 3 + 1')).toBe(5);
  });

  it('lit les nombres à la manière de la langue', () => {
    expect(valeur('1,234 + 1', 'en')).toBe(1235);
    expect(valeur('1 176,60 + 3,40')).toBeCloseTo(1180, 10);
  });

  it('ignore un opérateur final : c’est une frappe en cours (scénario 6)', () => {
    expect(valeur('12 +')).toBe(12);
    expect(valeur('12 + ')).toBe(12);
    expect(valeur('12 ×')).toBe(12);
  });

  it('refuse une division par zéro, un résultat négatif, une saisie illisible (scénario 7)', () => {
    expect(valeur('12 ÷ 0')).toBe('division');
    expect(valeur('5 − 8')).toBe('negatif');
    expect(valeur('+ 5')).toBe('illisible');
    expect(valeur('12 + + 3')).toBe('illisible');
    expect(valeur('12 + abc')).toBe('illisible');
    expect(valeur('')).toBe('illisible');
  });

  it('ne laisse jamais passer autre chose que des nombres et quatre opérateurs', () => {
    expect(valeur('alert(1)')).toBe('illisible');
    expect(valeur('2 ** 3')).toBe('illisible');
    expect(valeur('(2 + 3)')).toBe('illisible');
  });
});

describe('estUnCalcul', () => {
  it('reconnaît un opérateur, d’où qu’il vienne', () => {
    expect(estUnCalcul('12,5')).toBe(false);
    expect(estUnCalcul('12 + 3')).toBe(true);
    expect(estUnCalcul('12*3')).toBe(true);
    expect(estUnCalcul('12 ÷ 3')).toBe(true);
  });
});

describe('appuyer : les gestes du pavé (recherche R4)', () => {
  const suite = (touches: string[], depart = '', langue: 'fr' | 'en' = 'fr') =>
    touches.reduce(
      (texte, touche) => appuyer(texte, touche as never, langue),
      depart
    );

  it('écrit un calcul lisible, opérateurs entourés d’espaces', () => {
    expect(suite(['1', '2', 'decimal', '5', '+', '7', 'decimal', '5'])).toBe(
      '12,5 + 7,5'
    );
    expect(suite(['3', '×', '4'], '', 'en')).toBe('3 × 4');
  });

  it('écrit le séparateur décimal de la langue, et un zéro devant au besoin', () => {
    expect(suite(['decimal', '5'])).toBe('0,5');
    expect(suite(['1', 'decimal', '5'], '', 'en')).toBe('1.5');
    expect(suite(['2', '+', 'decimal'])).toBe('2 + 0,');
  });

  it('ignore une seconde virgule dans un même nombre', () => {
    expect(suite(['1', 'decimal', '2', 'decimal', '3'])).toBe('1,23');
    expect(suite(['1', 'decimal', '2', '+', '3', 'decimal', '4'])).toBe(
      '1,2 + 3,4'
    );
  });

  it('remplace un opérateur par le suivant, et n’en met jamais en tête', () => {
    expect(suite(['1', '2', '+', '×'])).toBe('12 × ');
    expect(suite(['+'])).toBe('');
  });

  it('« ⌫ » retire le dernier caractère, et un opérateur avec ses espaces', () => {
    expect(suite(['retour'], '12,5')).toBe('12,');
    expect(suite(['retour'], '12 + ')).toBe('12');
    expect(suite(['retour', '4'], '12 + 3')).toBe('12 + 4');
    expect(suite(['retour'], '')).toBe('');
  });

  it('« C » vide tout', () => {
    expect(suite(['effacer'], '12 + 3')).toBe('');
  });

  it('prolonge un montant affiché, groupé à la française', () => {
    expect(suite(['+', '1'], '1 176,60')).toBe('1 176,60 + 1');
  });
});
