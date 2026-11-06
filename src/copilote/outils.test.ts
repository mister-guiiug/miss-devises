import { beforeEach, describe, expect, it } from 'vitest';
import { useTaux } from '../rates/store.ts';
import { usePreferences } from '../app/preferences.ts';
import { useConversion } from '../features/convert/conversion.ts';
import { executerAppliquerFrais, executerConvertir } from './outils.ts';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const lisible = (texte: string) => texte.replace(/\s/g, ' ');

beforeEach(() => {
  localStorage.clear();
  useTaux.setState({
    etat: {
      marche: {
        source: 'marche',
        date: AUJOURDHUI,
        taux: { EUR: 1, EGP: 58.83, USD: 1.0815, JPY: 162.4 },
      },
    },
    pret: true,
    chargement: false,
    echec: false,
  });
  usePreferences.setState({
    reference: 'EUR',
    devise: 'EGP',
    recentes: [],
    seconde: null,
    marge: 0,
    decimales: null,
    frais: [],
    fraisChoisis: null,
  });
  useConversion.setState({
    saisie: { champ: 'devise', texte: '' },
    haut: 'devise',
  });
});

describe('l’outil convertir règle l’écran et rend le calcul de l’application', () => {
  it('« 1200 JPY » : la devise devient JPY, son champ vaut 1200, le résultat est en euros', () => {
    const resultat = executerConvertir({ montant: 1200, devise: 'JPY' }, 'fr');
    expect(usePreferences.getState().devise).toBe('JPY');
    expect(useConversion.getState().saisie).toEqual({
      champ: 'devise',
      texte: '1200',
    });
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(lisible(resultat.saisi)).toBe('1 200 JPY');
    expect(resultat.resultats).toHaveLength(1);
    expect(resultat.resultats[0]).toMatchObject({
      code: 'EUR',
      source: 'marché',
      ancien: false,
    });
    expect(lisible(resultat.resultats[0]!.texte)).toBe('7,39 €');
    expect(lisible(resultat.resultats[0]!.taux)).toBe('1 € = 162,4 JPY');
  });

  it('« 50 € en yens » : le montant va dans la référence, la devise affichée devient JPY', () => {
    const resultat = executerConvertir(
      { montant: 50, devise: 'EUR', vers: 'JPY' },
      'fr'
    );
    expect(usePreferences.getState().devise).toBe('JPY');
    expect(useConversion.getState().saisie).toEqual({
      champ: 'reference',
      texte: '50',
    });
    expect(resultat.ok && lisible(resultat.resultats[0]!.texte)).toBe(
      '8 120 JPY'
    );
  });

  it('« 20 USD en yens », sans être la référence : le yen devient la seconde devise, et passe en tête', () => {
    const resultat = executerConvertir(
      { montant: 20, devise: 'USD', vers: 'JPY' },
      'fr'
    );
    expect(usePreferences.getState()).toMatchObject({
      devise: 'USD',
      seconde: 'JPY',
    });
    expect(resultat.ok && resultat.resultats.map(r => r.code)).toEqual([
      'JPY',
      'EUR',
    ]);
  });

  it('une devise inconnue ne change rien à l’écran', () => {
    const resultat = executerConvertir({ montant: 10, devise: 'XYZ' }, 'fr');
    expect(resultat).toEqual({
      ok: false,
      raison: 'l’application ne connaît pas la devise XYZ',
    });
    expect(usePreferences.getState().devise).toBe('EGP');
    expect(useConversion.getState().saisie.texte).toBe('');
  });

  it('sans taux chargés, aucun montant n’est rendu', () => {
    useTaux.setState({ pret: false });
    expect(executerConvertir({ montant: 10, devise: 'JPY' }, 'fr')).toEqual({
      ok: false,
      raison: 'les taux ne sont pas encore chargés',
    });
  });

  it('des paramètres invalides sont refusés, avec la raison', () => {
    const resultat = executerConvertir({ montant: -3, devise: 'yen' }, 'fr');
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.raison).toMatch(/^paramètres invalides : /);
  });

  it('une décimale s’écrit dans la langue de l’application', () => {
    executerConvertir({ montant: 4.5, devise: 'USD' }, 'fr');
    expect(useConversion.getState().saisie.texte).toBe('4,5');
    executerConvertir({ montant: 4.5, devise: 'USD' }, 'en');
    expect(useConversion.getState().saisie.texte).toBe('4.5');
  });
});

describe('l’outil appliquer_frais', () => {
  it('crée les frais une fois, puis les reprend ; la conversion les compte', () => {
    const premier = executerAppliquerFrais(
      { libelle: 'Carte', pourcentage: 2 },
      'fr'
    );
    expect(premier).toMatchObject({
      ok: true,
      frais: { libelle: 'Carte', repris: false },
    });
    const second = executerAppliquerFrais(
      { libelle: 'Carte bis', pourcentage: 2 },
      'fr'
    );
    expect(second).toMatchObject({
      ok: true,
      frais: { libelle: 'Carte', repris: true },
    });
    const { frais, fraisChoisis } = usePreferences.getState();
    expect(frais).toHaveLength(1);
    expect(fraisChoisis).toBe(frais[0]!.id);

    const resultat = executerConvertir({ montant: 1200, devise: 'JPY' }, 'fr');
    expect(
      resultat.ok && resultat.avecFrais && lisible(resultat.avecFrais.total)
    ).toBe('7,54 €');
  });

  it('refuse des frais hors bornes, ou nuls', () => {
    expect(
      executerAppliquerFrais({ libelle: 'Carte', pourcentage: 150 }, 'fr').ok
    ).toBe(false);
    expect(
      executerAppliquerFrais({ libelle: 'Carte', pourcentage: 0 }, 'fr')
    ).toEqual({
      ok: false,
      raison: 'des frais nuls ne s’appliquent pas',
    });
    expect(usePreferences.getState().frais).toEqual([]);
  });
});
