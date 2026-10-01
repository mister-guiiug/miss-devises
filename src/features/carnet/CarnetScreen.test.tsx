import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@mister-guiiug/dev-pwa-config/react/toast';
import { I18nProvider } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import type { ConversionEnregistree } from '../../backend/ports.ts';
import { useCarnet } from './store.ts';
import { CarnetScreen } from './CarnetScreen.tsx';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const lisible = (texte: string | null | undefined) =>
  (texte ?? '').replace(/\s/g, ' ');

const musee: ConversionEnregistree = {
  id: 'c1',
  libelle: 'Visite du musée',
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 200 / 58.83 },
  taux: 58.83,
  source: 'marche',
  dateTaux: '2026-10-01',
  creeeLe: '2026-10-01T10:00:00.000Z',
};
const taxi: ConversionEnregistree = {
  ...musee,
  id: 'c2',
  libelle: 'Taxi',
  de: { code: 'EUR', montant: 20 },
  vers: { code: 'EGP', montant: 20 * 58.83 },
};

function monter() {
  render(
    <I18nProvider>
      <ToastProvider>
        <CarnetScreen />
      </ToastProvider>
    </I18nProvider>
  );
}

/** La ligne du carnet qui porte ce libellé. */
const ligne = (libelle: string) => {
  const li = screen.getByRole('heading', { name: libelle }).closest('li');
  if (!li) throw new Error(`pas de ligne « ${libelle} »`);
  return li;
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  useTaux.setState({
    etat: {
      marche: { source: 'marche', date: AUJOURDHUI, taux: { EGP: 59.2 } },
    },
    pret: true,
    chargement: false,
    echec: false,
  });
  // Déjà lu : l'écran ne relit pas un stockage vide par-dessus.
  useCarnet.setState({
    conversions: [taxi, musee],
    ready: true,
    error: null,
    pending: null,
  });
});

afterEach(cleanup);

describe('le carnet (récit 4)', () => {
  it('une ligne : libellé, montants, taux, source et date', () => {
    monter();
    const texte = lisible(ligne('Visite du musée').textContent);
    expect(texte).toContain('200,00 EGP → 3,40 €');
    expect(texte).toContain('Taux du 1 oct. 2026 : 1 € = 58,83 EGP');
    expect(texte).toContain('taux de marché');
  });

  it('la contre-valeur au taux du jour, et l’écart', () => {
    monter();
    expect(lisible(ligne('Visite du musée').textContent)).toContain(
      'Aujourd’hui : 3,38 € (-0,6 %)'
    );
    expect(lisible(ligne('Taxi').textContent)).toContain(
      'Aujourd’hui : 1 184,00 EGP (+0,6 %)'
    );
  });

  it('le total d’une devise, et en euros', () => {
    monter();
    const totaux = screen.getByRole('region', { name: 'Totaux' });
    expect(lisible(totaux.textContent)).toContain('1 376,60 EGP, soit 23,40 €');
  });

  it('renomme une ligne', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(
      within(ligne('Taxi')).getByRole('button', { name: /Renommer/ })
    );
    const feuille = screen.getByRole('dialog');
    const champ = within(feuille).getByLabelText('Libellé');
    expect(champ).toHaveValue('Taxi');
    await user.clear(champ);
    await user.type(champ, 'Taxi pour Gizeh');
    await user.click(within(feuille).getByRole('button', { name: 'Valider' }));
    expect(useCarnet.getState().conversions[0]?.libelle).toBe(
      'Taxi pour Gizeh'
    );
    expect(
      screen.getByRole('heading', { name: 'Taxi pour Gizeh' })
    ).toBeInTheDocument();
  });

  it('supprime une ligne, et l’annulation la rend', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(
      within(ligne('Taxi')).getByRole('button', { name: /Supprimer/ })
    );
    expect(screen.queryByRole('heading', { name: 'Taxi' })).toBeNull();
    expect(
      await screen.findByText('Conversion supprimée.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('heading', { name: 'Taxi' })).toBeInTheDocument();
    expect(useCarnet.getState().conversions.map(c => c.id)).toEqual([
      'c2',
      'c1',
    ]);
  });

  it('un carnet vide le dit, et dit comment le remplir', () => {
    useCarnet.setState({ conversions: [] });
    monter();
    expect(
      screen.getByText('Aucune conversion enregistrée.')
    ).toBeInTheDocument();
    expect(screen.getByText(/donnez un libellé/)).toBeInTheDocument();
  });
});
