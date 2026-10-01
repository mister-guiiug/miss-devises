import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { MoneySheet } from './MoneySheet.tsx';

const lisible = (texte: string | null | undefined) =>
  (texte ?? '').replace(/\s/g, ' ');

interface Options {
  devise?: string;
  taux?: number;
  montantDevise?: number | null;
  montantEuro?: number | null;
}

function monter(options: Options = {}) {
  const { devise = 'EGP', montantDevise = null, montantEuro = null } = options;
  // `taux: undefined` est un cas éprouvé : pas de valeur par défaut ici.
  const taux = 'taux' in options ? options.taux : 58.83;
  render(
    <I18nProvider>
      <MoneySheet
        open
        onClose={() => {}}
        devise={devise}
        taux={taux}
        montantDevise={montantDevise}
        montantEuro={montantEuro}
      />
    </I18nProvider>
  );
}

/** Les noms des dessins d'une section, dans l'ordre de l'écran. */
async function dessins(section: string) {
  const region = await screen.findByRole('region', { name: section });
  return within(region)
    .getAllByRole('img')
    .map(img => lisible(img.getAttribute('aria-label')));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  usePreferences.setState({ devise: 'EGP', sensVolet: 'devise' });
});

afterEach(cleanup);

describe('le volet des billets et des pièces (récit 2)', () => {
  it('chaque billet de la livre, du plus petit au plus grand, en euros', async () => {
    monter();
    const billets = await dessins('Billets');
    expect(billets).toHaveLength(9);
    // 0,004 € : « 0,00 € » serait juste et ne dirait rien.
    expect(billets[0]).toBe(
      'Billet de 0,25 livre égyptienne, soit moins de 0,01 €'
    );
    expect(billets.at(-1)).toBe(
      'Billet de 200 livres égyptiennes, soit 3,40 €'
    );
    const pieces = await dessins('Pièces');
    expect(pieces).toEqual([
      'Pièce de 0,25 livre égyptienne, soit moins de 0,01 €',
      'Pièce de 0,50 livre égyptienne, soit 0,01 €',
      'Pièce de 1 livre égyptienne, soit 0,02 €',
    ]);
  });

  it('bascule vers l’euro : ses coupures, en livres', async () => {
    const user = userEvent.setup();
    monter();
    await screen.findByRole('region', { name: 'Billets' });
    await user.click(screen.getByRole('tab', { name: 'En euros' }));
    const billets = await dessins('Billets');
    expect(billets).toContain('Billet de 200 euros, soit 11 766,00 EGP');
    expect(usePreferences.getState().sensVolet).toBe('euro');
    // Le billet de 500 € a cours légal, mais n'est plus émis.
    expect(screen.getByText(/n’est plus émis/)).toBeInTheDocument();
  });

  it('compose le montant saisi : 200 EGP, un billet de 200', async () => {
    monter({ montantDevise: 200, montantEuro: 200 / 58.83 });
    const composition = await screen.findByRole('region', {
      name: /Composition de 200,00\sEGP/,
    });
    expect(lisible(composition.textContent)).toContain('1 × 200 EGP');
  });

  it('dit ce qui reste sous la plus petite pièce', async () => {
    monter({ montantDevise: 1176.66, montantEuro: 20 });
    expect(
      lisible(
        (await screen.findByText(/sous la plus petite pièce/)).textContent
      )
    ).toBe('Reste 0,16 EGP, sous la plus petite pièce.');
  });

  it('une devise sans coupures répertoriées le dit', async () => {
    usePreferences.setState({ devise: 'QAR' });
    monter({ devise: 'QAR', taux: 4.1 });
    expect(
      await screen.findByText(/ne sont pas encore répertoriés/)
    ).toBeInTheDocument();
  });

  it('sans taux, les coupures sans contre-valeur', async () => {
    monter({ taux: undefined });
    const billets = await dessins('Billets');
    expect(billets.at(-1)).toBe('Billet de 200 livres égyptiennes');
  });

  it('dit la date du relevé et ses sources', async () => {
    monter();
    expect(
      await screen.findByText('Coupures relevées le 1 oct. 2026.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /wikipedia\.org/ })
    ).toBeInTheDocument();
  });
});
