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
      seconde,
      calculatrice,
      frais,
      fraisChoisis,
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
      seconde,
      calculatrice,
      frais,
      fraisChoisis,
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

  describe('la seconde devise (spécification 003, récit 1)', () => {
    it('n’existe pas par défaut, se pose, s’ajoute aux récentes et survit à un rechargement', () => {
      const prefs = creerPreferences();
      expect(prefs.getState().seconde).toBeNull();
      prefs.getState().choisirSeconde('USD');
      expect(prefs.getState().seconde).toBe('USD');
      expect(prefs.getState().recentes[0]).toBe('USD');
      expect(creerPreferences().getState().seconde).toBe('USD');
      prefs.getState().retirerSeconde();
      expect(creerPreferences().getState().seconde).toBeNull();
    });

    it('n’est jamais la référence ni la devise (EF-002)', () => {
      const prefs = creerPreferences();
      prefs.getState().choisirSeconde('EUR');
      prefs.getState().choisirSeconde('EGP');
      expect(prefs.getState().seconde).toBeNull();
    });

    it('s’échange avec la devise quand elle devient la devise', () => {
      const prefs = creerPreferences();
      prefs.getState().choisirSeconde('USD');
      prefs.getState().choisirDevise('USD');
      expect(prefs.getState().devise).toBe('USD');
      expect(prefs.getState().seconde).toBe('EGP');
    });

    it('s’échange avec la référence quand elle devient la référence', () => {
      const prefs = creerPreferences();
      prefs.getState().choisirSeconde('USD');
      prefs.getState().choisirReference('USD');
      expect(prefs.getState().reference).toBe('USD');
      expect(prefs.getState().devise).toBe('EGP');
      expect(prefs.getState().seconde).toBe('EUR');
    });

    it('se retire quand une ligne rouverte du carnet la prend pour paire', () => {
      const prefs = creerPreferences();
      prefs.getState().choisirSeconde('USD');
      prefs.getState().poserPaire('EUR', 'MAD');
      expect(prefs.getState().seconde).toBe('USD');
      prefs.getState().poserPaire('EUR', 'USD');
      expect(prefs.getState().devise).toBe('USD');
      expect(prefs.getState().seconde).toBeNull();
    });

    it('se lit absente dans une préférence écrite avant elle', () => {
      preferencesStore.store.set('preferences', {
        v: 2,
        data: {
          reference: 'EUR',
          devise: 'MAD',
          recentes: [],
          sensVolet: 'devise',
          periode: '1A',
        },
      });
      expect(creerPreferences().getState().seconde).toBeNull();
    });
  });

  describe('la calculatrice (spécification 003, récit 2)', () => {
    it('est éteinte par défaut, s’allume, et le reste au rechargement', () => {
      const prefs = creerPreferences();
      expect(prefs.getState().calculatrice).toBe(false);
      prefs.getState().basculerCalculatrice();
      expect(creerPreferences().getState().calculatrice).toBe(true);
      prefs.getState().basculerCalculatrice();
      expect(creerPreferences().getState().calculatrice).toBe(false);
    });
  });

  describe('les frais (spécification 005, récit 1)', () => {
    const CARTE = {
      libelle: 'Carte',
      pourcentage: 2,
      fixe: 0.5,
      deviseFixe: 'EUR',
    };

    it('aucun par défaut ; ajoutés, choisis, ils survivent à un rechargement', () => {
      const prefs = creerPreferences();
      expect(prefs.getState().frais).toEqual([]);
      expect(prefs.getState().fraisChoisis).toBeNull();
      prefs.getState().ajouterFrais(CARTE);
      const [carte] = prefs.getState().frais;
      expect(carte).toMatchObject(CARTE);
      expect(carte?.id).toBeTruthy();
      prefs.getState().choisirFrais(carte!.id);
      const relues = creerPreferences().getState();
      expect(relues.frais).toEqual([carte]);
      expect(relues.fraisChoisis).toBe(carte!.id);
    });

    it('se modifient, et se suppriment : les frais choisis reviennent à « aucun » (scénario 5)', () => {
      const prefs = creerPreferences();
      prefs.getState().ajouterFrais(CARTE);
      const id = prefs.getState().frais[0]!.id;
      prefs.getState().choisirFrais(id);
      prefs.getState().modifierFrais(id, { ...CARTE, pourcentage: 3 });
      expect(prefs.getState().frais[0]?.pourcentage).toBe(3);
      prefs.getState().supprimerFrais(id);
      expect(prefs.getState().frais).toEqual([]);
      expect(creerPreferences().getState().fraisChoisis).toBeNull();
    });

    it('refuse des frais nuls, hors bornes ou sans libellé, et plus de six', () => {
      const prefs = creerPreferences();
      prefs.getState().ajouterFrais({ ...CARTE, pourcentage: 0, fixe: 0 });
      prefs.getState().ajouterFrais({ ...CARTE, pourcentage: 101 });
      prefs.getState().ajouterFrais({ ...CARTE, fixe: -1 });
      prefs.getState().ajouterFrais({ ...CARTE, libelle: '  ' });
      expect(prefs.getState().frais).toHaveLength(0);
      for (let i = 0; i < 8; i += 1) {
        prefs.getState().ajouterFrais({ ...CARTE, libelle: `Frais ${i}` });
      }
      expect(prefs.getState().frais).toHaveLength(6);
    });

    it('ne choisit pas des frais qui n’existent pas', () => {
      const prefs = creerPreferences();
      prefs.getState().choisirFrais('inconnu');
      expect(prefs.getState().fraisChoisis).toBeNull();
    });

    it('se lisent absents dans une préférence écrite avant eux', () => {
      preferencesStore.store.set('preferences', {
        v: 2,
        data: {
          reference: 'EUR',
          devise: 'MAD',
          recentes: [],
          sensVolet: 'devise',
          periode: '1A',
        },
      });
      const relues = creerPreferences().getState();
      expect(relues.frais).toEqual([]);
      expect(relues.fraisChoisis).toBeNull();
    });
  });
});
