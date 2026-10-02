import { describe, expect, it } from 'vitest';
import { codeRetenu } from '../rates/sources.ts';
import { drapeauDe, paysDe, PAYS_LIVRES } from './drapeaux.ts';

/**
 * Les codes que la source de marché cote encore sans qu'`Intl` les compte
 * parmi les devises actuelles (relevé du 02/10/2026) : anciennes monnaies de
 * l'euro, monnaies remplacées, yuan offshore. L'application les liste, donc
 * leur drapeau doit exister.
 */
const ANCIENNES = [
  'ATS', 'AZM', 'BEF', 'BYR', 'CNH', 'CYP', 'DEM', 'EEK', 'ESP', 'FIM', 'FRF',
  'GHC', 'GRD', 'IEP', 'ITL', 'LTL', 'LUF', 'LVL', 'MGF', 'MRO', 'MTL', 'MXV',
  'MZM', 'NLG', 'PTE', 'ROL', 'SDD', 'SIT', 'SKK', 'SRG', 'STD', 'TMM', 'TRL',
  'VEB', 'VED', 'VEF', 'ZMK', 'ZWD',
]; // prettier-ignore

/** Toutes les devises que l'application peut lister. */
const LISTABLES = [
  ...new Set([...Intl.supportedValuesOf('currency'), ...ANCIENNES]),
].filter(codeRetenu);

describe('paysDe', () => {
  it('prend le pays aux deux premières lettres du code', () => {
    expect(paysDe('EGP')).toBe('EG');
    expect(paysDe('CHF')).toBe('CH');
    expect(paysDe('USD')).toBe('US');
    expect(paysDe('JPY')).toBe('JP');
  });

  it('donne à l’euro le drapeau européen', () => {
    expect(paysDe('EUR')).toBe('EU');
  });

  it('ne donne aucun pays aux devises de plusieurs pays', () => {
    // Avec la règle des deux lettres, XAF aurait pris le drapeau de
    // l'Abkhazie (XA), XOF celui de l'Ossétie du Sud (XO), XCD celui de
    // Chypre du Nord (XC) : la bibliothèque a ces trois fichiers.
    for (const code of ['XAF', 'XOF', 'XPF', 'XCD', 'XCG', 'ANG']) {
      expect(paysDe(code), code).toBeUndefined();
    }
  });
});

describe('drapeauDe', () => {
  it('rend le fichier du pays', () => {
    expect(drapeauDe('EUR')).toMatch(/EU.*\.svg/);
    expect(drapeauDe('EGP')).toMatch(/EG.*\.svg/);
  });

  it('ne rend rien pour une devise sans pays', () => {
    expect(drapeauDe('XOF')).toBeUndefined();
  });

  it('couvre chaque devise listable : un drapeau ou un signe neutre', () => {
    const sansDrapeau = LISTABLES.filter(
      code => paysDe(code) !== undefined && drapeauDe(code) === undefined
    );
    expect(sansDrapeau).toEqual([]);
  });

  it('ne livre aucun drapeau qu’aucune devise ne demande', () => {
    const demandes = new Set(LISTABLES.map(paysDe));
    expect([...PAYS_LIVRES].filter(pays => !demandes.has(pays))).toEqual([]);
  });

  it('ne livre aucun code attribué par l’utilisateur', () => {
    for (const pays of ['XA', 'XC', 'XK', 'XO']) {
      expect(PAYS_LIVRES.has(pays), pays).toBe(false);
    }
  });
});
