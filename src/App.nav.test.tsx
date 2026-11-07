import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
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

/*
 * LE CLIC QUI RÉPOND, SANS « CHARGEMENT… » QUI CLIGNOTE.
 *
 * Le routeur navigue dans une transition : React garde l'écran courant tant
 * que le morceau des écrans n'est pas arrivé. C'est la barre qui le dit
 * (`navNavigate`, socle 6.33.0) : l'entrée cliquée porte `aria-busy`.
 *
 * Le repli de la frontière, lui, ne doit pas paraître au clic. L'app la
 * remontait à chaque chemin (`key={pathname}`) avant que la coquille ne
 * transmette `navigate` : une frontière neuve montre son repli, même pour un
 * écran déjà en mémoire, et React le garde environ 300 ms. Remettre la clé
 * fait échouer les deux tests ; retirer `navNavigate`, le premier.
 */
function guetterLeRepli() {
  const vu = { repli: false };
  const observateur = new MutationObserver(() => {
    if (screen.queryByText('Chargement…')) vu.repli = true;
  });
  observateur.observe(document.body, { childList: true, subtree: true });
  return {
    vu,
    arreter: () => observateur.disconnect(),
  };
}

describe('au clic dans la barre, l’entrée dit qu’elle charge', () => {
  it('vers un écran pas encore chargé : l’entrée occupée, pas de repli', async () => {
    const entree = monterSous('/');
    const guet = guetterLeRepli();

    fireEvent.click(entree(/^Historique/));

    expect(entree(/^Historique/)).toHaveAttribute('aria-busy', 'true');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Historique' })
    ).toBeInTheDocument();
    expect(entree(/^Historique/)).toHaveAttribute('aria-current', 'page');
    expect(entree(/^Historique/)).not.toHaveAttribute('aria-busy');
    guet.arreter();
    expect(guet.vu.repli).toBe(false);
  });

  it('vers un écran du morceau déjà arrivé : aucun repli non plus', async () => {
    const entree = monterSous('/');
    fireEvent.click(entree(/^Historique/));
    await screen.findByRole('heading', { level: 1, name: 'Historique' });

    // Le morceau des écrans est là ; le carnet n'a encore jamais été rendu.
    const guet = guetterLeRepli();
    fireEvent.click(entree(/^Carnet/));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Carnet' })
    ).toBeInTheDocument();
    guet.arreter();
    expect(guet.vu.repli).toBe(false);
  });
});
