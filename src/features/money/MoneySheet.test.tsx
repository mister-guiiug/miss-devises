import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { usePreferences } from '../../app/preferences.ts';
import { MoneySheet } from './MoneySheet.tsx';
import { useConversion } from '../convert/conversion.ts';

const lisible = (texte: string | null | undefined) =>
  (texte ?? '').replace(/\s/g, ' ');

interface Options {
  devise?: string;
  taux?: number;
  montantDevise?: number | null;
  montantReference?: number | null;
}

function monter(options: Options = {}) {
  const {
    devise = 'EGP',
    montantDevise = null,
    montantReference = null,
  } = options;
  // `taux: undefined` est un cas éprouvé : pas de valeur par défaut ici.
  const taux = 'taux' in options ? options.taux : 58.83;
  render(
    <I18nProvider>
      <MoneySheet
        open
        onClose={() => {}}
        devise={devise}
        reference="EUR"
        taux={taux}
        montantDevise={montantDevise}
        montantReference={montantReference}
      />
    </I18nProvider>
  );
}

/**
 * Les noms des coupures d'une section, dans l'ordre de l'écran : chaque
 * coupure est un bouton qu'on touche (récit 5), nommé comme le dessin.
 */
async function dessins(section: string) {
  const region = await screen.findByRole('region', { name: section });
  return within(region)
    .getAllByRole('button')
    .map(bouton => lisible(bouton.getAttribute('aria-label')))
    .filter(nom => !nom.startsWith('Retirer'));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  usePreferences.setState({
    reference: 'EUR',
    devise: 'EGP',
    sensVolet: 'devise',
    images: 'dessins',
    avisPhotos: false,
  });
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
    await user.click(screen.getByRole('tab', { name: 'En EUR' }));
    const billets = await dessins('Billets');
    expect(billets).toContain('Billet de 200 euros, soit 11 766,00 EGP');
    expect(usePreferences.getState().sensVolet).toBe('reference');
    // Le billet de 500 € a cours légal, mais n'est plus émis.
    expect(screen.getByText(/n’est plus émis/)).toBeInTheDocument();
  });

  it('avec le franc pour référence, ses coupures valent des livres', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ reference: 'CHF' });
    render(
      <I18nProvider>
        <MoneySheet
          open
          onClose={() => {}}
          devise="EGP"
          reference="CHF"
          taux={62.69}
          montantDevise={null}
          montantReference={null}
        />
      </I18nProvider>
    );
    await screen.findByRole('region', { name: 'Billets' });
    expect(screen.getByRole('tab', { name: 'En CHF' })).toBeInTheDocument();
    // Les livres d'abord, chacune en francs suisses.
    expect((await dessins('Billets')).at(-1)).toBe(
      'Billet de 200 livres égyptiennes, soit 3,19 CHF'
    );
    await user.click(screen.getByRole('tab', { name: 'En CHF' }));
    expect(await dessins('Billets')).toContain(
      'Billet de 10 francs suisses, soit 626,90 EGP'
    );
  });

  it('compose le montant saisi : 200 EGP, un billet de 200', async () => {
    monter({ montantDevise: 200, montantReference: 200 / 58.83 });
    const composition = await screen.findByRole('region', {
      name: /Composition de 200,00\sEGP/,
    });
    expect(lisible(composition.textContent)).toContain('1 × 200 EGP');
  });

  it('dit ce qui reste sous la plus petite pièce', async () => {
    monter({ montantDevise: 1176.66, montantReference: 20 });
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

describe('composer un montant au toucher (récit 5)', () => {
  const billet100 = /^Billet de 100 livres égyptiennes, soit 1,70\s€/;
  const piece1 = /^Pièce de 1 livre égyptienne, soit 0,02\s€/;

  it('deux billets de 100 et une pièce de 1 : 201 EGP, convertis', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(await screen.findByRole('button', { name: billet100 }));
    await user.click(screen.getByRole('button', { name: billet100 }));
    await user.click(screen.getByRole('button', { name: piece1 }));
    // Le compteur se lit sur la coupure, et se dit au lecteur d'écran.
    expect(
      screen.getByRole('button', {
        name: /^Billet de 100 livres égyptiennes, soit 1,70\s€, 2 ajoutés$/,
      })
    ).toBeInTheDocument();
    expect(lisible(screen.getByTestId('total-compose').textContent)).toBe(
      'Total : 201,00 EGP, soit 3,42 €'
    );
  });

  it('retirer une coupure, puis tout remettre à zéro', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(await screen.findByRole('button', { name: billet100 }));
    await user.click(screen.getByRole('button', { name: billet100 }));
    await user.click(
      screen.getByRole('button', { name: /^Retirer un 100\sEGP$/ })
    );
    expect(lisible(screen.getByTestId('total-compose').textContent)).toBe(
      'Total : 100,00 EGP, soit 1,70 €'
    );
    await user.click(screen.getByRole('button', { name: 'Remettre à zéro' }));
    expect(screen.queryByTestId('total-compose')).toBeNull();
  });

  it('« Utiliser ce montant » le reporte dans Convertir', async () => {
    const user = userEvent.setup();
    let ferme = false;
    render(
      <I18nProvider>
        <MoneySheet
          open
          onClose={() => {
            ferme = true;
          }}
          devise="EGP"
          taux={58.83}
          montantDevise={null}
          reference="EUR"
          montantReference={null}
        />
      </I18nProvider>
    );
    await user.click(await screen.findByRole('button', { name: billet100 }));
    await user.click(screen.getByRole('button', { name: piece1 }));
    await user.click(
      screen.getByRole('button', { name: 'Utiliser ce montant' })
    );
    expect(useConversion.getState().saisie).toEqual({
      champ: 'devise',
      texte: '101',
    });
    expect(ferme).toBe(true);
  });
});

describe('les photos de Wikimedia Commons (spécification 002, récit 3)', () => {
  /** Les photos montrées : une image par coupure photographiée. */
  const photos = () => document.querySelectorAll('img[data-photo]');
  /** L'interrupteur « Vraies photos ». */
  const interrupteur = () =>
    screen.getByRole('switch', { name: 'Vraies photos' });
  const AVIS = 'Les photos viennent de Wikimedia Commons';

  it('montre les dessins par défaut, sans aucune photo', async () => {
    monter();
    await screen.findByRole('region', { name: 'Billets' });
    expect(interrupteur()).toHaveAttribute('aria-checked', 'false');
    expect(photos()).toHaveLength(0);
  });

  it('dit d’avance combien de coupures ont une photo, côté devise et côté référence', async () => {
    const user = userEvent.setup();
    monter();
    await screen.findByRole('region', { name: 'Billets' });
    // La livre : ses trois pièces ; ses billets, que le Code pénal égyptien
    // réserve, restent dessinés.
    expect(await screen.findByText('3 sur 12 coupures')).toBeInTheDocument();
    expect(interrupteur()).toHaveAccessibleDescription('3 sur 12 coupures');
    await user.click(screen.getByRole('tab', { name: 'En EUR' }));
    expect(await screen.findByText('13 sur 15 coupures')).toBeInTheDocument();
  });

  it('ouvre l’avis dans sa rangée avant la première photo, puis les montre', async () => {
    const user = userEvent.setup();
    monter();
    await screen.findByText('3 sur 12 coupures');
    await user.click(interrupteur());
    const avis = screen.getByRole('region', { name: AVIS });
    // Rien n'est demandé tant que l'avis n'est pas accepté, et le bouton
    // qui l'accepte reçoit le focus.
    expect(photos()).toHaveLength(0);
    expect(interrupteur()).toHaveAttribute('aria-checked', 'false');
    const afficher = within(avis).getByRole('button', {
      name: 'Afficher les photos',
    });
    expect(afficher).toHaveFocus();
    await user.click(afficher);
    await waitFor(() => expect(photos().length).toBeGreaterThan(0));
    expect(interrupteur()).toHaveAttribute('aria-checked', 'true');
    expect(usePreferences.getState().images).toBe('photos');
    // Chaque photo a son crédit, et le volet les liste.
    expect(
      screen.getAllByRole('link', { name: /^Crédit de la photo : / }).length
    ).toBe(photos().length);
    const credits = screen.getByText('Crédits des photos').closest('details')!;
    expect(credits.textContent).toMatch(/« [^»]+\.(jpe?g|png|gif) »/i);
    expect(
      within(credits as HTMLElement).getAllByRole('link', {
        hidden: true,
        name: /^CC BY/,
      })[0]
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/creativecommons\.org\//)
    );
    // L'avis ne revient pas.
    await user.click(interrupteur());
    expect(interrupteur()).toHaveAttribute('aria-checked', 'false');
    await user.click(interrupteur());
    expect(screen.queryByRole('region', { name: AVIS })).toBeNull();
    expect(interrupteur()).toHaveAttribute('aria-checked', 'true');
  });

  it('garder les dessins referme l’avis et rend le focus à l’interrupteur', async () => {
    const user = userEvent.setup();
    monter();
    await screen.findByText('3 sur 12 coupures');
    await user.click(interrupteur());
    await user.click(
      screen.getByRole('button', { name: 'Garder les dessins' })
    );
    expect(screen.queryByRole('region', { name: AVIS })).toBeNull();
    expect(interrupteur()).toHaveFocus();
    expect(usePreferences.getState().images).toBe('dessins');
    expect(photos()).toHaveLength(0);
  });

  it('en mode photos, une coupure sans photo dit qu’elle reste dessinée', async () => {
    usePreferences.setState({ images: 'photos', avisPhotos: true });
    monter();
    await waitFor(() => expect(photos()).toHaveLength(3));
    // Les neuf billets égyptiens, et eux seuls.
    expect(screen.getAllByText('Dessin')).toHaveLength(9);
  });

  it('une photo qui ne se charge pas rend son dessin', async () => {
    usePreferences.setState({ images: 'photos', avisPhotos: true });
    const { container } = render(
      <I18nProvider>
        <MoneySheet
          open
          onClose={() => {}}
          devise="EGP"
          reference="EUR"
          taux={58.83}
          montantDevise={null}
          montantReference={null}
        />
      </I18nProvider>
    );
    await waitFor(() => expect(photos().length).toBeGreaterThan(0));
    const avant = photos().length;
    const dessins = container.querySelectorAll('svg').length;
    fireEvent.error(photos()[0]!);
    expect(photos()).toHaveLength(avant - 1);
    expect(container.querySelectorAll('svg').length).toBe(dessins + 1);
  });

  it('sans photo libre pour la devise, l’interrupteur est grisé et dit pourquoi', async () => {
    const user = userEvent.setup();
    monter({ devise: 'GBP', taux: 0.85 });
    expect(
      await screen.findByText('Aucune photo libre pour cette devise.')
    ).toBeInTheDocument();
    expect(interrupteur()).toHaveAttribute('aria-disabled', 'true');
    await user.click(interrupteur());
    expect(screen.queryByRole('region', { name: AVIS })).toBeNull();
    expect(usePreferences.getState().images).toBe('dessins');
  });

  it('en mode photos, une devise sans photo garde ses dessins, l’interrupteur reste actif', async () => {
    usePreferences.setState({ images: 'photos', avisPhotos: true });
    monter({ devise: 'GBP', taux: 0.85 });
    expect(
      await screen.findByText('Aucune photo libre pour cette devise.')
    ).toBeInTheDocument();
    expect(interrupteur()).toHaveAttribute('aria-checked', 'true');
    expect(interrupteur()).not.toHaveAttribute('aria-disabled');
    expect(photos()).toHaveLength(0);
  });
});

describe('le lien vers Wikipédia, pour les coupures restées dessinées', () => {
  /** Le lien de la rangée « Vraies photos ». */
  const lien = () =>
    screen.findByRole('link', { name: /^Les vraies, sur Wikipédia/ });

  it('mène à l’article de la devise montrée, dans un nouvel onglet, sans référent', async () => {
    const user = userEvent.setup();
    monter();
    // Les billets égyptiens restent dessinés : la loi égyptienne en interdit
    // l'image ; un lien n'en publie aucune.
    const egp = await lien();
    expect(egp).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Egyptian_pound'
    );
    expect(egp).toHaveAttribute('target', '_blank');
    expect(egp).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    // L'article est en anglais, et le lien le dit, à l'œil comme à l'oreille.
    expect(egp).toHaveAttribute('hreflang', 'en');
    expect(egp).toHaveTextContent('Wikipédia en anglais');
    expect(egp).toHaveAccessibleName(/nouvel onglet$/);
    // Il suit le côté montré.
    await user.click(screen.getByRole('tab', { name: 'En EUR' }));
    await waitFor(async () =>
      expect(await lien()).toHaveAttribute(
        'href',
        'https://en.wikipedia.org/wiki/Euro'
      )
    );
  });

  it('existe aussi pour une devise sans aucune photo, et en mode dessins', async () => {
    monter({ devise: 'GBP', taux: 0.85 });
    expect(await lien()).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Pound_sterling'
    );
    expect(usePreferences.getState().images).toBe('dessins');
  });

  it('manque quand toutes les coupures ont leur photo', async () => {
    monter({ devise: 'RON', taux: 4.97 });
    expect(await screen.findByText('12 sur 12 coupures')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /^Les vraies, sur Wikipédia/ })
    ).toBeNull();
  });
});
