import { describe, expect, it } from 'vitest';
import { libelleErreur, libellesPour } from './libelles.ts';

/*
 * La conversation dit l'erreur d'une exécution dans la langue de l'interface,
 * par son code : le message de `RUN_ERROR` est celui de l'agent, en français.
 * Un visiteur anglophone lisait « Aucune clé Anthropic : … l'onglet
 * « Modèle » », alors que l'onglet s'appelle « Model » chez lui.
 */
const CODES = [
  'cle-absente',
  'cle',
  'acces',
  'limite',
  'reseau',
  'demande',
  'api',
  'refus',
  'tronque',
];
const BRUT = 'message brut de l’agent';

describe('libelleErreur', () => {
  it('chaque code connu a son libellé, en français et en anglais', () => {
    for (const locale of ['fr', 'en']) {
      const t = libellesPour(locale);
      for (const code of CODES) {
        const libelle = libelleErreur(t, code, BRUT);
        expect(libelle, `${locale} : ${code}`).not.toBe(BRUT);
        expect(libelle.length).toBeGreaterThan(10);
      }
    }
  });

  it('en anglais, la clé manquante renvoie à l’onglet « Model », sans un mot de français', () => {
    const libelle = libelleErreur(libellesPour('en'), 'cle-absente', BRUT);
    expect(libelle).toContain('“Model” tab');
    expect(libelle).not.toMatch(/Modèle|clé|onglet/);
    expect(libelleErreur(libellesPour('fr'), 'cle-absente', BRUT)).toContain(
      'onglet « Modèle »'
    );
  });

  it('le détail de l’API reste tel quel, encadré dans la langue de l’interface', () => {
    const detail = '400 prompt is too long';
    expect(libelleErreur(libellesPour('en'), 'demande', detail)).toBe(
      'Request refused by the API: 400 prompt is too long'
    );
    expect(libelleErreur(libellesPour('fr'), 'api', detail)).toBe(
      'Erreur de l’API : 400 prompt is too long'
    );
  });

  it('un code inconnu, absent ou hérité d’Object garde le message brut', () => {
    const t = libellesPour('en');
    for (const code of ['erreur', undefined, null, 42, 'toString', '__proto__'])
      expect(libelleErreur(t, code, BRUT)).toBe(BRUT);
  });
});
