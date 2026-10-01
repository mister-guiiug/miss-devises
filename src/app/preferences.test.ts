import { beforeEach, describe, expect, it } from 'vitest';
import { creerPreferences, DEFAUTS, preferencesStore } from './preferences.ts';

describe('les préférences', () => {
  beforeEach(() => {
    localStorage.clear();
    preferencesStore.clear();
  });

  it('partent des valeurs par défaut', () => {
    const { devise, recentes, sensVolet, periode } =
      creerPreferences().getState();
    expect({ devise, recentes, sensVolet, periode }).toEqual(DEFAUTS);
  });

  it('mettent la devise choisie en tête des récentes, sans doublon, six au plus', () => {
    const prefs = creerPreferences();
    for (const code of [
      'USD',
      'JPY',
      'USD',
      'GBP',
      'CHF',
      'MAD',
      'TND',
      'THB',
    ]) {
      prefs.getState().choisirDevise(code);
    }
    expect(prefs.getState().devise).toBe('THB');
    expect(prefs.getState().recentes).toEqual([
      'THB',
      'TND',
      'MAD',
      'CHF',
      'GBP',
      'USD',
    ]);
  });

  it('survivent à un rechargement', () => {
    const prefs = creerPreferences();
    prefs.getState().choisirDevise('MAD');
    prefs.getState().basculerVolet();
    prefs.getState().choisirPeriode('6M');
    const relues = creerPreferences().getState();
    expect(relues.devise).toBe('MAD');
    expect(relues.sensVolet).toBe('euro');
    expect(relues.periode).toBe('6M');
  });
});
