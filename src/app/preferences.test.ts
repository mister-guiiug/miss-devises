import { beforeEach, describe, expect, it } from 'vitest';
import { creerPreferences, DEFAUTS, preferencesStore } from './preferences.ts';

describe('les préférences', () => {
  beforeEach(() => {
    localStorage.clear();
    preferencesStore.clear();
  });

  it('partent des valeurs par défaut : l’euro pour référence', () => {
    const {
      reference,
      devise,
      recentes,
      sensVolet,
      periode,
      images,
      avisPhotos,
      epinglees,
      marge,
      decimales,
    } = creerPreferences().getState();
    expect({
      reference,
      devise,
      recentes,
      sensVolet,
      periode,
      images,
      avisPhotos,
      epinglees,
      marge,
      decimales,
    }).toEqual(DEFAUTS);
    expect(DEFAUTS.reference).toBe('EUR');
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
    prefs.getState().choisirReference('CHF');
    prefs.getState().basculerVolet();
    prefs.getState().choisirPeriode('6M');
    const relues = creerPreferences().getState();
    expect(relues.devise).toBe('MAD');
    expect(relues.reference).toBe('CHF');
    expect(relues.sensVolet).toBe('reference');
    expect(relues.periode).toBe('6M');
  });

  it('échangent les deux devises quand la référence devient la devise affichée', () => {
    const prefs = creerPreferences();
    prefs.getState().choisirDevise('EGP');
    prefs.getState().choisirReference('EGP');
    expect(prefs.getState().reference).toBe('EGP');
    expect(prefs.getState().devise).toBe('EUR');
  });

  it('montrent les dessins par défaut, et gardent le choix des photos', () => {
    const prefs = creerPreferences();
    expect(prefs.getState().images).toBe('dessins');
    expect(prefs.getState().avisPhotos).toBe(false);
    prefs.getState().accepterPhotos();
    const relues = creerPreferences().getState();
    expect(relues.images).toBe('photos');
    expect(relues.avisPhotos).toBe(true);
    relues.choisirImages('dessins');
    expect(creerPreferences().getState().images).toBe('dessins');
    // L'avis a été lu une fois : il ne revient pas.
    expect(creerPreferences().getState().avisPhotos).toBe(true);
  });

  it('lisent une version 2 d’avant les photos : dessins, avis à lire', () => {
    preferencesStore.store.set('preferences', {
      v: 2,
      data: {
        reference: 'CHF',
        devise: 'MAD',
        recentes: [],
        sensVolet: 'devise',
        periode: '1A',
      },
    });
    const relues = creerPreferences().getState();
    expect(relues.reference).toBe('CHF');
    expect(relues.images).toBe('dessins');
    expect(relues.avisPhotos).toBe(false);
  });

  it('lisent la version 1 : l’euro pour référence, le volet « euro » devient « référence »', () => {
    preferencesStore.store.set('preferences', {
      v: 1,
      data: {
        devise: 'MAD',
        recentes: ['MAD', 'USD'],
        sensVolet: 'euro',
        periode: '6M',
      },
    });
    const relues = creerPreferences().getState();
    expect(relues.reference).toBe('EUR');
    expect(relues.devise).toBe('MAD');
    expect(relues.recentes).toEqual(['MAD', 'USD']);
    expect(relues.sensVolet).toBe('reference');
    expect(relues.periode).toBe('6M');
  });
});
