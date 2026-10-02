import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mister-guiiug/dev-pwa-config/react/theme-provider';
import { I18nProvider } from '../../i18n/index.ts';
import { DEFAUTS, usePreferences } from '../../app/preferences.ts';
import { useCarnet } from '../carnet/store.ts';
import type { ConversionEnregistree } from '../../backend/ports.ts';
import { SettingsScreen } from './SettingsScreen.tsx';

/** jsdom ne sait pas recharger une page : le rechargement est remplacé. */
vi.mock('../../app/application.ts', () => ({ rechargerLaPage: vi.fn() }));
vi.mock('@mister-guiiug/dev-pwa-config/sw-update', () => ({
  applyUpdate: vi.fn(async () => 'purged'),
}));
/** L'état des mises à jour, que `AppUpdates` fournit dans l'application. */
const majs = vi.hoisted(() => ({
  valeur: null as null | {
    needRefresh: boolean;
    updating: boolean;
    update: () => Promise<unknown>;
    forceUpdate: () => Promise<unknown>;
  },
}));
vi.mock('@mister-guiiug/dev-pwa-config/react/app-updates', () => ({
  useAppUpdates: () => majs.valeur,
}));

const { rechargerLaPage } = await import('../../app/application.ts');
const { applyUpdate } = await import('@mister-guiiug/dev-pwa-config/sw-update');

function monter({ theme = true } = {}) {
  const ecran = (
    <I18nProvider>
      <SettingsScreen />
    </I18nProvider>
  );
  render(theme ? <ThemeProvider>{ecran}</ThemeProvider> : ecran);
}

const conversion = (id: string): ConversionEnregistree => ({
  id,
  libelle: `Achat ${id}`,
  de: { code: 'EGP', montant: 200 },
  vers: { code: 'EUR', montant: 3.4 },
  reference: 'EUR',
  taux: 58.83,
  source: 'marche',
  dateTaux: '2026-10-01',
  creeeLe: '2026-10-01T10:00:00.000Z',
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  usePreferences.setState({ ...DEFAUTS });
  useCarnet.setState({ conversions: [], ready: true, error: null });
  majs.valeur = null;
  vi.mocked(rechargerLaPage).mockClear();
  vi.mocked(applyUpdate).mockClear();
});

afterEach(cleanup);

describe('les réglages, rangés en sections', () => {
  it('quatre sections titrées, au rang 2, sous le titre de l’écran', () => {
    monter();
    const titres = screen
      .getAllByRole('heading', { level: 2 })
      .map(h => h.textContent);
    expect(titres).toEqual([
      'Conversion',
      'Affichage',
      'Carnet',
      'Application',
    ]);
    // La référence, la marge et les décimales sont rangées sous « Conversion ».
    expect(
      screen.getByRole('heading', { level: 3, name: 'Marge d’un bureau' })
    ).toBeInTheDocument();
  });
});

/** Le groupe des raccourcis de la marge, et celui des décimales. */
const groupeMarge = () =>
  screen.getByRole('tablist', { name: 'Marge d’un bureau' });
const groupeDecimales = () =>
  screen.getByRole('tablist', { name: 'Chiffres après la virgule' });

describe('la marge : des raccourcis, et un champ seulement pour « Autre »', () => {
  it('le champ libre n’apparaît qu’à la demande', async () => {
    const user = userEvent.setup();
    monter();
    expect(screen.queryByLabelText('Marge, en pour cent')).toBeNull();
    await user.click(within(groupeMarge()).getByRole('tab', { name: '5 %' }));
    expect(usePreferences.getState().marge).toBe(5);
    // L'effet, en clair, dans la monnaie de référence.
    expect(
      screen.getByText(/vous recevez l’équivalent de 95 EUR/)
    ).toBeInTheDocument();

    await user.click(within(groupeMarge()).getByRole('tab', { name: 'Autre' }));
    const champ = screen.getByLabelText('Marge, en pour cent');
    await user.clear(champ);
    await user.type(champ, '3,5');
    expect(usePreferences.getState().marge).toBe(3.5);
    expect(screen.getByText(/le bureau garde 3,5 EUR/)).toBeInTheDocument();
    // Revenir à un raccourci referme le champ.
    await user.click(within(groupeMarge()).getByRole('tab', { name: '0 %' }));
    expect(screen.queryByLabelText('Marge, en pour cent')).toBeNull();
    expect(screen.queryByText(/le bureau garde/)).toBeNull();
  });

  it('une marge hors raccourci s’ouvre sur « Autre », son champ rempli', () => {
    usePreferences.setState({ marge: 3.5 });
    monter();
    expect(
      within(groupeMarge()).getByRole('tab', { name: 'Autre' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Marge, en pour cent')).toHaveValue('3,5');
  });
});

describe('les décimales : un aperçu, et un champ seulement pour « Autre »', () => {
  it('l’aperçu suit le choix, dans la monnaie de référence', async () => {
    const user = userEvent.setup();
    monter();
    expect(screen.getByText(/^Aperçu : 1\s234,57 EUR$/)).toBeInTheDocument();
    await user.click(within(groupeDecimales()).getByRole('tab', { name: '4' }));
    expect(usePreferences.getState().decimales).toBe(4);
    expect(screen.getByText(/^Aperçu : 1\s234,5678 EUR$/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre de chiffres')).toBeNull();

    await user.click(
      within(groupeDecimales()).getByRole('tab', { name: 'Autre' })
    );
    const champ = screen.getByLabelText('Nombre de chiffres');
    await user.clear(champ);
    await user.type(champ, '3');
    expect(usePreferences.getState().decimales).toBe(3);
    expect(screen.getByText(/^Aperçu : 1\s234,568 EUR$/)).toBeInTheDocument();
  });
});

describe('l’affichage : le thème et la langue, nommés', () => {
  it('le thème se choisit en clair, et l’en-tête le partage', async () => {
    const user = userEvent.setup();
    monter();
    const groupe = screen.getByRole('tablist', { name: 'Thème' });
    expect(
      within(groupe)
        .getAllByRole('tab')
        .map(t => t.textContent)
    ).toEqual(['Système', 'Clair', 'Sombre']);
    await user.click(within(groupe).getByRole('tab', { name: 'Sombre' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    // La clé de la bascule de l'en-tête : un seul thème pour les deux.
    expect(localStorage.getItem('dwc_theme')).toBe('dark');
  });

  it('sans fournisseur de thème, la bascule du socle prend le relais', () => {
    monter({ theme: false });
    expect(screen.getByRole('button', { name: /Thème/ })).toBeInTheDocument();
  });

  it('chaque langue se nomme dans la sienne', async () => {
    const user = userEvent.setup();
    monter();
    const groupe = screen.getByRole('tablist', { name: 'Langue' });
    const english = within(groupe).getByRole('tab', { name: 'English' });
    expect(within(english).getByText('English')).toHaveAttribute('lang', 'en');
    expect(
      within(within(groupe).getByRole('tab', { name: 'Français' })).getByText(
        'Français'
      )
    ).toHaveAttribute('lang', 'fr');
    await user.click(english);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Display' })
    ).toBeInTheDocument();
  });
});

describe('le carnet : son état, et l’effacement à part', () => {
  it('vide : il le dit, et rien ne s’exporte ni ne s’efface', () => {
    monter();
    expect(screen.getByText('Le carnet est vide.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Exporter le carnet' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Effacer le carnet' })
    ).toBeDisabled();
    // Importer reste possible : c'est ainsi qu'on remplit un appareil neuf.
    expect(
      screen.getByRole('button', { name: 'Importer un carnet' })
    ).toBeEnabled();
  });

  it('rempli : il compte, et l’effacement demande confirmation', async () => {
    const user = userEvent.setup();
    useCarnet.setState({ conversions: [conversion('a'), conversion('b')] });
    monter();
    expect(
      screen.getByText('2 conversions sur cet appareil.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Effacer le carnet' }));
    expect(
      screen.getByRole('alertdialog', { name: 'Effacer tout le carnet ?' })
    ).toBeInTheDocument();
  });
});

describe('l’application : recharger, et forcer la mise à jour', () => {
  it('recharger relance la page quand aucune version n’attend', async () => {
    const user = userEvent.setup();
    majs.valeur = {
      needRefresh: false,
      updating: false,
      update: vi.fn(async () => 'activated'),
      forceUpdate: vi.fn(async () => 'purged'),
    };
    monter();
    await user.click(
      screen.getByRole('button', { name: 'Recharger l’application' })
    );
    expect(rechargerLaPage).toHaveBeenCalledTimes(1);
    expect(majs.valeur.update).not.toHaveBeenCalled();
    expect(screen.queryByText(/nouvelle version est prête/)).toBeNull();
  });

  it('une version attend : il le dit, et recharger l’applique', async () => {
    const user = userEvent.setup();
    majs.valeur = {
      needRefresh: true,
      updating: false,
      update: vi.fn(async () => 'activated'),
      forceUpdate: vi.fn(async () => 'purged'),
    };
    monter();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Une nouvelle version est prête'
    );
    await user.click(
      screen.getByRole('button', { name: 'Recharger l’application' })
    );
    expect(majs.valeur.update).toHaveBeenCalledTimes(1);
    expect(rechargerLaPage).not.toHaveBeenCalled();
  });

  it('forcer la mise à jour passe par le socle, avec ou sans fournisseur', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(
      screen.getByRole('button', { name: 'Forcer la mise à jour' })
    );
    // Hors `AppUpdates`, la purge du socle directement.
    expect(applyUpdate).toHaveBeenCalledWith({ hard: true });
    cleanup();

    majs.valeur = {
      needRefresh: false,
      updating: false,
      update: vi.fn(async () => 'activated'),
      forceUpdate: vi.fn(async () => 'purged'),
    };
    monter();
    await user.click(
      screen.getByRole('button', { name: 'Forcer la mise à jour' })
    );
    expect(majs.valeur.forceUpdate).toHaveBeenCalledTimes(1);
  });

  it('pendant une mise à jour, les boutons le disent et ne relancent rien', () => {
    majs.valeur = {
      needRefresh: true,
      updating: true,
      update: vi.fn(async () => 'activated'),
      forceUpdate: vi.fn(async () => 'purged'),
    };
    monter();
    const recharger = screen.getByRole('button', { name: 'Rechargement…' });
    expect(recharger).toHaveAttribute('aria-busy', 'true');
    expect(recharger).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Forcer la mise à jour' })
    ).toBeDisabled();
  });
});
