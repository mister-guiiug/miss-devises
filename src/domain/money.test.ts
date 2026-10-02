import { describe, expect, it } from 'vitest';
import {
  arrondir,
  decimalesDe,
  formaterCoupure,
  formaterDate,
  formaterMontant,
  formaterPourcentage,
  formaterTaux,
  formaterTauxEn,
  formaterValeur,
  lireMontant,
  nommerMontant,
} from './money.ts';

// Les espaces de `Intl` (insécable U+00A0, fine insécable U+202F) rendus
// ordinaires, pour comparer des chaînes lisibles : `\s` les couvre toutes
// les deux. ATTENTION, CARACTÈRES INVISIBLES : le deuxième et le troisième
// « 1 234,56 » de `lireMontant` contiennent ces espaces (U+00A0 puis U+202F),
// et c’est ce qu’ils éprouvent. `cat -A` les montre.
const lisible = (texte: string) => texte.replace(/\s/g, ' ');

describe('lireMontant : la saisie devient un nombre (recherche R4)', () => {
  it.each([
    ['200', 'fr', 200],
    ['12,5', 'fr', 12.5],
    ['12.5', 'fr', 12.5],
    ['12,5', 'en', 12.5],
    ['12.5', 'en', 12.5],
    ['1 234,56', 'fr', 1234.56],
    ['1 234,56', 'fr', 1234.56],
    ['1 234,56', 'fr', 1234.56],
    ['1,234.56', 'en', 1234.56],
    ['1.234,56', 'fr', 1234.56],
    ['1.234', 'fr', 1234],
    ['1,234', 'en', 1234],
    ['1.234.567', 'fr', 1234567],
    ['0,5', 'fr', 0.5],
    [',5', 'fr', 0.5],
  ] as const)('« %s » en %s vaut %d', (saisie, langue, attendu) => {
    expect(lireMontant(saisie, langue)).toBe(attendu);
  });

  // Pendant la frappe, « 12, » est un état normal, pas une erreur.
  it('un séparateur décimal en fin de saisie garde la partie entière', () => {
    expect(lireMontant('12,', 'fr')).toBe(12);
    expect(lireMontant('12.', 'en')).toBe(12);
  });

  it.each(['', '   ', 'abc', '-5', '1e5', '1,2,3', '1.23.4', '12,5,6.7'])(
    '« %s » n’est pas un montant',
    saisie => {
      expect(lireMontant(saisie, 'fr')).toBeNull();
    }
  );
});

describe('decimalesDe : les décimales de la devise, selon Intl', () => {
  it.each([
    ['EUR', 2],
    ['EGP', 2],
    ['JPY', 0],
    ['VND', 0],
    ['TND', 3],
  ] as const)('%s : %d', (code, attendu) => {
    expect(decimalesDe(code)).toBe(attendu);
  });

  it('un code inconnu retombe sur deux décimales', () => {
    expect(decimalesDe('ZZZ')).toBe(2);
  });
});

describe('arrondir', () => {
  it('arrondit au plus proche, demi vers le haut', () => {
    expect(arrondir(3.39963, 2)).toBe(3.4);
    expect(arrondir(1.005, 2)).toBe(1.01);
    expect(arrondir(1176.6, 0)).toBe(1177);
  });

  // `String(1e-7)` s'écrit « 1e-7 » : collé à « e2 », il donnait « 1e-7e2 »,
  // soit NaN, et « NaN € » à l'écran pour une saisie de « 0,0000001 ».
  it('tient les nombres que JavaScript écrit en notation exponentielle', () => {
    expect(arrondir(1e-7, 2)).toBe(0);
    expect(arrondir(1.5e-7, 7)).toBe(2e-7);
    expect(arrondir(1e21, 2)).toBe(1e21);
  });
});

describe('formaterMontant : arrondi à l’affichage, aux décimales de la devise', () => {
  it('en français', () => {
    expect(lisible(formaterMontant(3.39963, 'EUR', 'fr'))).toBe('3,40 €');
    expect(lisible(formaterMontant(1176.6, 'EGP', 'fr'))).toBe('1 176,60 EGP');
    expect(lisible(formaterMontant(1234.5, 'JPY', 'fr'))).toBe('1 235 JPY');
  });

  it('un montant infime s’affiche à zéro, pas en NaN', () => {
    expect(lisible(formaterMontant(1.7e-9, 'EUR', 'fr'))).toBe('0,00 €');
  });

  it('en anglais', () => {
    expect(lisible(formaterMontant(3.39963, 'EUR', 'en'))).toBe('€3.40');
  });
});

describe('formaterDate : une date de taux, en UTC', () => {
  // Une date sans heure se lit comme minuit UTC : formatée en heure locale,
  // elle reculerait d'un jour à l'ouest de Greenwich.
  it('ne recule pas d’un jour', () => {
    expect(formaterDate('2026-10-01', 'fr')).toBe('1 oct. 2026');
    expect(formaterDate('2026-10-01', 'en')).toBe('Oct 1, 2026');
  });
});

describe('formaterTaux : cinq chiffres significatifs', () => {
  it.each([
    [58.83286362, 'fr', '58,833'],
    [1.0812, 'en', '1.0812'],
    [0.016997, 'fr', '0,016997'],
  ] as const)('%d en %s : %s', (taux, langue, attendu) => {
    expect(lisible(formaterTaux(taux, langue))).toBe(attendu);
  });
});

describe('formaterTauxEn : un taux dit dans une devise, cinq chiffres significatifs', () => {
  it.each([
    [1 / 58.83, 'EUR', 'fr', '0,016998 €'],
    [1 / 58.83, 'EUR', 'en', '€0.016998'],
    [1 / 62.6918, 'CHF', 'fr', '0,015951 CHF'],
    [2.76051, 'JPY', 'fr', '2,7605 JPY'],
  ] as const)('%d %s en %s : %s', (taux, code, langue, attendu) => {
    expect(lisible(formaterTauxEn(taux, code, langue))).toBe(attendu);
  });
});

describe('les écarts : un signe, toujours', () => {
  it('formaterMontant signé', () => {
    expect(
      lisible(formaterMontant(-0.1604, 'EUR', 'fr', { signe: true }))
    ).toBe('-0,16 €');
    expect(lisible(formaterMontant(53, 'EGP', 'fr', { signe: true }))).toBe(
      '+53,00 EGP'
    );
  });

  it('formaterPourcentage : une décimale, signé, zéro sans signe', () => {
    expect(lisible(formaterPourcentage(0.0472, 'fr'))).toBe('+4,7 %');
    expect(formaterPourcentage(-0.0472, 'en')).toBe('-4.7%');
    expect(lisible(formaterPourcentage(0.00004, 'fr'))).toBe('0 %');
  });
});

describe('nommerMontant : un montant dit en toutes lettres de devise', () => {
  it.each([
    [200, 'EGP', 'fr', '200 livres égyptiennes'],
    [0.25, 'EGP', 'fr', '0,25 livre égyptienne'],
    [0.5, 'EUR', 'fr', '0,50 euro'],
    [200, 'EGP', 'en', '200 Egyptian pounds'],
  ] as const)('%d %s en %s : « %s »', (valeur, code, langue, attendu) => {
    expect(lisible(nommerMontant(valeur, code, langue))).toBe(attendu);
  });
});

describe('formaterValeur : la valeur écrite sur une coupure', () => {
  it.each([
    [200, 'EGP', 'fr', '200'],
    [0.25, 'EGP', 'fr', '0,25'],
    [0.5, 'EUR', 'fr', '0,50'],
    [10000, 'JPY', 'fr', '10 000'],
  ] as const)('%d %s en %s : « %s »', (valeur, code, langue, attendu) => {
    expect(lisible(formaterValeur(valeur, code, langue))).toBe(attendu);
  });
});

describe('formaterCoupure : une coupure, avec sa devise', () => {
  it.each([
    [200, 'EGP', 'fr', '200 EGP'],
    [0.2, 'EUR', 'fr', '0,20 €'],
    [5, 'EUR', 'en', '€5'],
  ] as const)('%d %s en %s : « %s »', (valeur, code, langue, attendu) => {
    expect(lisible(formaterCoupure(valeur, code, langue))).toBe(attendu);
  });
});
