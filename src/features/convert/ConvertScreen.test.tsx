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
  usePreferences.setState({
    reference: 'EUR',
    devise: 'EGP',
    recentes: [],
    seconde: null,
    marge: 0,
    calculatrice: false,
    frais: [],
    fraisChoisis: null,
  });
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

describe('deux devises à la fois (spécification 003, récit 1)', () => {
  async function ajouterUsd(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole('button', { name: 'Ajouter une devise' })
    );
    const feuille = await screen.findByRole('dialog', {
      name: 'Seconde devise',
    });
    await user.type(
      within(feuille).getByLabelText('Rechercher une devise'),
      'dollar'
    );
    await user.click(within(feuille).getByRole('button', { name: /^USD/ }));
  }

  it('aucune seconde devise par défaut : deux champs, comme avant', () => {
    monter();
    expect(screen.getAllByLabelText(/^Montant en/)).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Ajouter une devise' })
    ).toBeInTheDocument();
  });

  it('20 € donnent les livres ET les dollars ; chaque devise dit son taux', async () => {
    const user = userEvent.setup();
    monter();
    await ajouterUsd(user);
    expect(usePreferences.getState().seconde).toBe('USD');
    await user.type(screen.getByLabelText('Montant en euros'), '20');
    expect(
      lisible(
        (
          screen.getByLabelText(
            'Montant en livres égyptiennes'
          ) as HTMLInputElement
        ).value
      )
    ).toBe('1 176,60');
    expect(screen.getByLabelText(/^Montant en dollars/)).toHaveValue('21,63');
    expect(screen.getByText(/1\s€ = 58,83 EGP/)).toBeInTheDocument();
    expect(screen.getByText(/1\s€ = 1,0815 USD/)).toBeInTheDocument();
  });

  it('une saisie en dollars remplit les euros et les livres', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ seconde: 'USD' });
    monter();
    await user.type(screen.getByLabelText(/^Montant en dollars/), '10');
    expect(screen.getByLabelText('Montant en euros')).toHaveValue('9,25');
    expect(screen.getByLabelText('Montant en livres égyptiennes')).toHaveValue(
      '543,97'
    );
  });

  it('le choix de la seconde devise ne propose ni la référence ni la devise', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(
      screen.getByRole('button', { name: 'Ajouter une devise' })
    );
    const feuille = await screen.findByRole('dialog', {
      name: 'Seconde devise',
    });
    expect(
      within(feuille).queryByRole('button', { name: /^EUR/ })
    ).not.toBeInTheDocument();
    expect(
      within(feuille).queryByRole('button', { name: /^EGP/ })
    ).not.toBeInTheDocument();
    expect(
      within(feuille).getByRole('button', { name: /^USD/ })
    ).toBeInTheDocument();
  });

  it('retirée, elle rend son montant au champ des euros', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ seconde: 'USD' });
    monter();
    await user.type(screen.getByLabelText(/^Montant en dollars/), '10');
    await user.click(screen.getByRole('button', { name: 'Retirer USD' }));
    expect(usePreferences.getState().seconde).toBeNull();
    expect(screen.queryByLabelText(/^Montant en dollars/)).toBeNull();
    expect(screen.getByLabelText('Montant en euros')).toHaveValue('9,25');
    // Les euros affichés deviennent la saisie : les livres en partent
    // (recherche R5), 9,25 × 58,83.
    expect(screen.getByLabelText('Montant en livres égyptiennes')).toHaveValue(
      '544,18'
    );
  });

  it('un montant saisi en dollars s’enregistre de USD vers EUR, à son taux', async () => {
    const user = userEvent.setup();
    useCarnet.setState({ conversions: [], pending: null, error: null });
    usePreferences.setState({ seconde: 'USD' });
    monter();
    await user.type(screen.getByLabelText(/^Montant en dollars/), '10');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const gardee = useCarnet.getState().conversions[0];
    expect(gardee?.de).toEqual({ code: 'USD', montant: 10 });
    expect(gardee?.vers.code).toBe('EUR');
    expect(gardee?.taux).toBe(1.0815);
  });
});

describe('la mini-calculatrice (spécification 003, récit 2)', () => {
  const touches = async (
    user: ReturnType<typeof userEvent.setup>,
    noms: string[]
  ) => {
    const pave = screen.getByRole('group', { name: 'Calculatrice' });
    for (const nom of noms) {
      await user.click(within(pave).getByRole('button', { name: nom }));
    }
  };

  it('éteinte par défaut : pas de pavé, le clavier décimal du téléphone', () => {
    monter();
    expect(screen.queryByRole('group', { name: 'Calculatrice' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Calculatrice' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Montant en euros')).toHaveAttribute(
      'inputmode',
      'decimal'
    );
  });

  it('allumée, un pavé s’affiche et les champs n’ouvrent plus le clavier', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: 'Calculatrice' }));
    expect(usePreferences.getState().calculatrice).toBe(true);
    expect(
      screen.getByRole('group', { name: 'Calculatrice' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Montant en euros')).toHaveAttribute(
      'inputmode',
      'none'
    );
  });

  it('« 12,5 + 7,5 » au pavé dans les euros : le résultat sous le champ, les livres déjà calculées, puis « = »', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ calculatrice: true });
    monter();
    const eur = screen.getByLabelText('Montant en euros');
    await user.click(eur);
    await touches(user, [
      '1',
      '2',
      'virgule',
      '5',
      'plus',
      '7',
      'virgule',
      '5',
    ]);
    expect(eur).toHaveValue('12,5 + 7,5');
    expect(screen.getByText(/^=\s20,00\s€$/)).toBeInTheDocument();
    expect(
      lisible(
        (
          screen.getByLabelText(
            'Montant en livres égyptiennes'
          ) as HTMLInputElement
        ).value
      )
    ).toBe('1 176,60');
    await touches(user, ['Égal']);
    expect(eur).toHaveValue('20,00');
    // Le champ garde le focus : le pavé n'en prend pas.
    expect(eur).toHaveFocus();
  });

  it('dans un autre champ, un opérateur prolonge le montant affiché, un chiffre le remplace', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ calculatrice: true });
    monter();
    await user.click(screen.getByLabelText('Montant en euros'));
    await touches(user, ['2', '0']);
    const egp = screen.getByLabelText(
      'Montant en livres égyptiennes'
    ) as HTMLInputElement;
    await user.click(egp);
    await touches(user, ['plus', '1']);
    expect(lisible(egp.value)).toBe('1 176,60 + 1');
    expect(screen.getByLabelText('Montant en euros')).toHaveValue('20,02');

    await user.click(screen.getByLabelText('Montant en euros'));
    await touches(user, ['5']);
    expect(screen.getByLabelText('Montant en euros')).toHaveValue('5');
  });

  it('une division par zéro le dit, et ne remplit rien', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ calculatrice: true });
    monter();
    await user.click(screen.getByLabelText('Montant en euros'));
    await touches(user, ['1', '2', 'divisé par', '0']);
    expect(screen.getByText('Division par zéro.')).toBeInTheDocument();
    expect(screen.getByLabelText('Montant en livres égyptiennes')).toHaveValue(
      ''
    );
  });

  it('calculatrice éteinte, un calcul tapé au clavier est compris', async () => {
    const user = userEvent.setup();
    monter();
    await user.type(screen.getByLabelText('Montant en euros'), '12+8');
    expect(
      lisible(
        (
          screen.getByLabelText(
            'Montant en livres égyptiennes'
          ) as HTMLInputElement
        ).value
      )
    ).toBe('1 176,60');
  });
});

describe('les mots utiles (spécification 004)', () => {
  it('« Mots utiles » ouvre les phrases du pays de la devise', async () => {
    const user = userEvent.setup();
    monter();
    await user.click(screen.getByRole('button', { name: 'Mots utiles' }));
    const feuille = await screen.findByRole('dialog', { name: 'Mots utiles' });
    expect(within(feuille).getByText('بكام ده؟')).toBeInTheDocument();
  });

  it('pas de bouton quand le pays parle la langue de l’application (scénario 6)', () => {
    usePreferences.setState({ devise: 'XOF' });
    monter();
    expect(screen.queryByRole('button', { name: 'Mots utiles' })).toBeNull();
  });

  it('les langues de la seconde devise s’ajoutent (scénario 4)', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ devise: 'XOF', seconde: 'USD' });
    monter();
    await user.click(screen.getByRole('button', { name: 'Mots utiles' }));
    const feuille = await screen.findByRole('dialog', { name: 'Mots utiles' });
    expect(within(feuille).getByText('How much is it?')).toHaveAttribute(
      'lang',
      'en'
    );
  });
});

describe('les frais d’une conversion (spécification 005, récit 1)', () => {
  const CARTE = {
    id: 'carte',
    libelle: 'Carte',
    pourcentage: 2,
    fixe: 0.5,
    deviseFixe: 'EUR',
  };

  it('aucun frais enregistré : l’écran est inchangé (scénario 1)', () => {
    monter();
    expect(screen.queryByLabelText('Frais')).toBeNull();
  });

  it('« Carte » choisie, 200 EGP coûtent 3,97 €, dont 0,57 € de frais (scénario 2)', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ frais: [CARTE], fraisChoisis: null });
    monter();
    await user.selectOptions(screen.getByLabelText('Frais'), 'Carte');
    expect(usePreferences.getState().fraisChoisis).toBe('carte');
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    expect(
      lisible(screen.getByText(/^Coût avec frais/).textContent ?? '')
    ).toBe('Coût avec frais : 3,97 €');
    expect(lisible(screen.getByText(/^dont/).textContent ?? '')).toBe(
      'dont 0,57 € de frais (2 % + 0,50 €)'
    );
    expect(
      screen.getByText(
        'Le carnet enregistre le taux indicatif, sans les frais.'
      )
    ).toBeInTheDocument();
  });

  it('les frais s’ajoutent au montant indicatif, pas à celui après marge (scénario 6)', async () => {
    const user = userEvent.setup();
    usePreferences.setState({
      frais: [CARTE],
      fraisChoisis: 'carte',
      marge: 5,
    });
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    expect(
      lisible(screen.getByText(/^Coût avec frais/).textContent ?? '')
    ).toBe('Coût avec frais : 3,97 €');
  });

  it('un montant fixe sans taux : le coût n’est pas calculé (scénario 3)', async () => {
    const user = userEvent.setup();
    usePreferences.setState({
      frais: [{ ...CARTE, fixe: 220, deviseFixe: 'THB' }],
      fraisChoisis: 'carte',
    });
    monter();
    await user.type(
      screen.getByLabelText('Montant en livres égyptiennes'),
      '200'
    );
    expect(
      screen.getByText(
        'Pas de taux pour THB : le coût avec frais n’est pas calculé.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Coût avec frais/)).toBeNull();
  });
});
