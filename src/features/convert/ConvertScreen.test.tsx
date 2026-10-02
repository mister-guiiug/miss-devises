import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@mister-guiiug/dev-pwa-config/react/toast';
import { I18nProvider } from '../../i18n/index.ts';
import { useTaux } from '../../rates/store.ts';
import { usePreferences } from '../../app/preferences.ts';
import { useConversion } from './conversion.ts';
import { ConvertScreen } from './ConvertScreen.tsx';
import { useCarnet } from '../carnet/store.ts';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const lisible = (texte: string) => texte.replace(/\s/g, ' ');

function monter() {
  render(
    <I18nProvider>
      <ToastProvider>
        <MemoryRouter>
          <ConvertScreen />
        </MemoryRouter>
      </ToastProvider>
    </I18nProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  useTaux.setState({
    etat: {
      marche: {
        source: 'marche',
        date: AUJOURDHUI,
        taux: { EUR: 1, EGP: 58.83, USD: 1.0815, JPY: 162.4, CHF: 0.9384 },
      },
    },
    pret: true,
    chargement: false,
    echec: false,
  });
  usePreferences.setState({ reference: 'EUR', devise: 'EGP', recentes: [] });
  useConversion.setState({
    saisie: { champ: 'devise', texte: '' },
    haut: 'devise',
  });
});

afterEach(cleanup);

describe('l’écran Convertir (récit 1)', () => {
  it('200 EGP donnent 3,40 €, et 20 € donnent 1 176,60 EGP', async () => {
    const user = userEvent.setup();
    monter();
    const egp = screen.getByLabelText('Montant en livres égyptiennes');
    const eur = screen.getByLabelText('Montant en euros');
    await user.type(egp, '200');
    expect(eur).toHaveValue('3,40');
    await user.clear(eur);
    await user.type(eur, '20');
    expect(lisible((egp as HTMLInputElement).value)).toBe('1 176,60');
  });

  it('inverse la paire sans changer les montants', async () => {
    const user = userEvent.setup();
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    await user.click(
      screen.getByRole('button', { name: 'Inverser les deux devises' })
    );
    const champs = screen.getAllByRole('textbox');
    expect(champs[0]).toHaveAccessibleName('Montant en euros');
    expect(champs[0]).toHaveValue('3,40');
  });

  it('dit le taux, sa source et sa date', () => {
    monter();
    // La région des toasts du socle est un `status` elle aussi : la ligne de
    // taux se trouve par son texte, puis sa région.
    const ligne = screen
      .getByText(/1\s€ = 58,83 EGP/)
      .closest('[role="status"]');
    expect(lisible(ligne?.textContent ?? '')).toContain('1 EGP = 0,016998 €');
    expect(ligne).toHaveTextContent('taux de marché');
  });

  it('signale une saisie illisible sans l’effacer', async () => {
    const user = userEvent.setup();
    monter();
    const egp = screen.getByLabelText('Montant en livres égyptiennes');
    await user.type(egp, 'abc');
    expect(egp).toHaveValue('abc');
    expect(screen.getByText(/Montant illisible/)).toBeInTheDocument();
  });

  it('n’invente pas de taux pour une devise inconnue', () => {
    usePreferences.setState({ devise: 'XOF' });
    monter();
    expect(screen.getByText(/Aucun taux connu/)).toBeInTheDocument();
  });

  it('change de devise par la recherche', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: /Changer de devise/ }));
    const feuille = screen.getByRole('dialog');
    await user.type(
      within(feuille).getByLabelText('Rechercher une devise'),
      'yen'
    );
    await user.click(within(feuille).getByRole('button', { name: /^JPY/ }));
    expect(usePreferences.getState().devise).toBe('JPY');
    expect(
      screen.getByLabelText('Montant en yens japonais')
    ).toBeInTheDocument();
  });
});

describe('la monnaie de référence (spécification 002, récit 1)', () => {
  it('avec le franc pour référence, 200 EGP valent 3,19 CHF', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ reference: 'CHF' });
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    expect(screen.getByLabelText('Montant en francs suisses')).toHaveValue(
      '3,19'
    );
    const ligne = screen
      .getByText(/1\sCHF = 62,692 EGP/)
      .closest('[role="status"]');
    expect(lisible(ligne?.textContent ?? '')).toContain('1 EGP = 0,015951 CHF');
    expect(ligne).toHaveTextContent('taux de marché');
  });

  it('ne propose jamais la référence dans la liste des devises', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ reference: 'CHF' });
    monter();
    await user.click(screen.getByRole('button', { name: /Changer de devise/ }));
    const feuille = screen.getByRole('dialog');
    expect(within(feuille).queryByRole('button', { name: /^CHF/ })).toBeNull();
    expect(
      within(feuille).getByRole('button', { name: /^EUR/ })
    ).toBeInTheDocument();
  });
});

describe('enregistrer au carnet (récit 4)', () => {
  beforeEach(() => {
    useCarnet.setState({ conversions: [], pending: null, error: null });
  });

  it('garde la conversion, son libellé, son taux et sa date', async () => {
    const user = userEvent.setup();
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    await user.type(screen.getByLabelText('Libellé'), 'Visite du musée');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const [gardee] = useCarnet.getState().conversions;
    expect(gardee?.libelle).toBe('Visite du musée');
    expect(gardee?.de).toEqual({ code: 'EGP', montant: 200 });
    expect(gardee?.vers.code).toBe('EUR');
    expect(gardee?.vers.montant).toBeCloseTo(200 / 58.83, 10);
    expect(gardee).toMatchObject({
      taux: 58.83,
      source: 'marche',
      dateTaux: AUJOURDHUI,
    });
    expect(
      await screen.findByText('Enregistré dans le carnet.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Libellé')).toHaveValue('');
  });

  it('sans libellé, la paire et le montant en tiennent lieu', async () => {
    const user = userEvent.setup();
    monter();
    await user.type(screen.getByLabelText('Montant en euros'), '20');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const [gardee] = useCarnet.getState().conversions;
    expect(lisible(gardee?.libelle ?? '')).toBe('20,00 € → EGP');
    expect(gardee?.de).toEqual({ code: 'EUR', montant: 20 });
  });

  it('rien à enregistrer sans montant', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(useCarnet.getState().conversions).toHaveLength(0);
  });
});

describe('le volet des billets et des pièces (récit 2)', () => {
  it('s’ouvre depuis Convertir, et compose le montant saisi', async () => {
    const user = userEvent.setup();
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    await user.click(screen.getByRole('button', { name: 'Billets et pièces' }));
    const volet = await screen.findByRole('dialog', {
      name: 'Billets et pièces',
    });
    expect(
      await within(volet).findByRole('region', {
        name: /Composition de 200,00\sEGP/,
      })
    ).toBeInTheDocument();
  });
});
