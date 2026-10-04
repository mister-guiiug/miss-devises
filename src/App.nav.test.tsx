import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@mister-guiiug/dev-pwa-config/react/toast';
import { I18nProvider } from './i18n/index.ts';
import { Shell } from './App.tsx';

/*
 * LA COQUILLE DÉMARRE LES TAUX VIA QUERY. Sans réseau ni IndexedDB ici : le
 * bootstrap est remplacé, et la barre seule reste l'objet du test.
 */
vi.mock('./shared/queries/taux.ts', () => ({
  useTauxBootstrap: () => {},
  rafraichirTaux: vi.fn(),
}));

/*
 * L'ONGLET COURANT, SOUS LE CHEMIN DE GITHUB PAGES.
 *
 * La barre basse compare les `href` de ses entrées, relatifs au routeur, au
 * chemin courant. Sans `navCurrentPath`, elle lit `window.location.pathname`,
 * qui vaut `/miss-devises/` une fois déployé là où l'entrée vaut `/` : aucun
 * des cinq onglets n'était actif en ligne, jamais en développement ni en e2e,
 * servis sous `/`. Relevé le 03/10/2026 sur
 * https://mister-guiiug.github.io/miss-devises/.
 *
 * Le test place donc jsdom SOUS LA BASE, comme le navigateur déployé. Sans ce
 * geste, `location.pathname` vaut `/` et l'accueil serait trouvé par hasard.
 */

/*
 * LA BARRE EST L'OBJET DU TEST, PAS LES ÉCRANS. Remplacés par rien, ils
 * n'ouvrent ni le réseau ni IndexedDB ; le titre de l'en-tête, que `Shell`
 * tire du chemin, suffit à dire quelle route est montée.
 */
vi.mock('./features/home/HomeScreen.tsx', () => ({ HomeScreen: () => null }));
vi.mock('./features/history/HistoryScreen.tsx', () => ({
  HistoryScreen: () => null,
}));
vi.mock('./features/carnet/CarnetScreen.tsx', () => ({
  CarnetScreen: () => null,
}));
vi.mock('./features/settings/SettingsScreen.tsx', () => ({
  SettingsScreen: () => null,
}));
vi.mock('./features/about/AboutScreen.tsx', () => ({
  AboutScreen: () => null,
}));

const BASE = '/miss-devises';

function monterSous(chemin: string) {
  window.history.replaceState(null, '', `${BASE}${chemin}`);
  render(
    <I18nProvider>
      <ToastProvider>
        <MemoryRouter basename={BASE} initialEntries={[`${BASE}${chemin}`]}>
          <Shell />
        </MemoryRouter>
      </ToastProvider>
    </I18nProvider>
  );
  const barre = within(
    screen.getByRole('navigation', { name: 'Navigation principale' })
  );
  // Une expression régulière, pas une chaîne : le socle ajoute « Page
  // actuelle » au nom accessible de l'entrée courante.
  return (nom: RegExp) => barre.getByRole('link', { name: nom });
}

beforeEach(() => {
  localStorage.clear();
  // Sans locale stockée, jsdom rapporte `en-US` et la barre parle anglais.
  localStorage.setItem('dwc_locale', 'fr');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('sous un basename, la barre dit où l’on est', () => {
  it('marque « Convertir » comme page actuelle sur l’accueil', () => {
    const entree = monterSous('/');

    expect(entree(/^Convertir/)).toHaveAttribute('aria-current', 'page');
  });

  it('marque « Historique », et plus l’accueil, sur l’historique', () => {
    const entree = monterSous('/historique');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Historique' })
    ).toBeInTheDocument();
    expect(entree(/^Historique/)).toHaveAttribute('aria-current', 'page');
    // L'accueil est `end: true` : il ne doit pas rester allumé sous un
    // chemin qui commence par `/`.
    expect(entree(/^Convertir/)).not.toHaveAttribute('aria-current');
  });
});
