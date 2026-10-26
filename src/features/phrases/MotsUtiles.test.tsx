import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { MotsUtiles } from './MotsUtiles.tsx';

function monter(
  langues: string[],
  montants: { devise: string; montant: number | null }[] = []
) {
  render(
    <I18nProvider>
      <MotsUtiles
        open
        onClose={() => {}}
        langues={langues}
        montants={montants}
      />
    </I18nProvider>
  );
  return screen.getByRole('dialog', { name: 'Mots utiles' });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
});

afterEach(cleanup);

describe('la feuille des mots utiles (spécification 004)', () => {
  it('l’arabe égyptien : quatre groupes, le texte, sa transcription et son sens (scénario 1)', () => {
    const feuille = monter(['ar-EG']);
    expect(within(feuille).getByText('En arabe (Égypte)')).toBeInTheDocument();
    for (const groupe of [
      'Les bases',
      'Marchander',
      'La monnaie',
      'L’addition',
    ]) {
      expect(
        within(feuille).getByRole('heading', { name: groupe })
      ).toBeInTheDocument();
    }
    const phrase = within(feuille).getByText('بكام ده؟');
    expect(phrase).toHaveAttribute('lang', 'ar-EG');
    expect(phrase).toHaveAttribute('dir', 'rtl');
    expect(within(feuille).getByText('bikam da?')).toBeInTheDocument();
    expect(within(feuille).getByText('Combien ça coûte ?')).toBeInTheDocument();
    expect(within(feuille).getAllByRole('listitem')).toHaveLength(16);
  });

  it('le sens suit la langue de l’application (scénario 2)', () => {
    localStorage.setItem('dwc_locale', 'en');
    render(
      <I18nProvider>
        <MotsUtiles open onClose={() => {}} langues={['ar-EG']} />
      </I18nProvider>
    );
    const feuille = screen.getByRole('dialog', { name: 'Useful phrases' });
    expect(within(feuille).getByText('How much is it?')).toBeInTheDocument();
    expect(within(feuille).getByText('In Arabic (Egypt)')).toBeInTheDocument();
  });

  it('plusieurs langues : la première d’abord, les autres au choix (scénario 3)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['de', 'it']);
    expect(
      within(feuille).getByText('Wie viel kostet das?')
    ).toBeInTheDocument();
    await user.click(within(feuille).getByRole('tab', { name: 'italien' }));
    expect(within(feuille).getByText('Quanto costa?')).toHaveAttribute(
      'lang',
      'it'
    );
    expect(within(feuille).queryByText('Wie viel kostet das?')).toBeNull();
  });

  it('une phrase touchée s’affiche en grand, et le retour rend le focus (scénario 5)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG']);
    const bouton = within(feuille).getByRole('button', { name: /بكام ده؟/ });
    await user.click(bouton);
    const grande = within(feuille).getByRole('region', {
      name: 'Combien ça coûte ?',
    });
    expect(within(grande).getByText('بكام ده؟')).toHaveAttribute(
      'lang',
      'ar-EG'
    );
    expect(within(grande).getByText('bikam da?')).toBeInTheDocument();
    expect(within(feuille).queryAllByRole('listitem')).toHaveLength(0);
    await user.click(
      within(feuille).getByRole('button', { name: 'Retour à la liste' })
    );
    expect(
      within(feuille).getByRole('button', { name: /بكام ده؟/ })
    ).toHaveFocus();
  });
});

describe('les phrases parlées (spécification 005, récit 2)', () => {
  class Enonce {
    lang = '';
    voice: unknown = null;
    rate = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  const voix = (lang: string) => ({
    lang,
    name: lang,
    localService: true,
    default: false,
    voiceURI: lang,
  });
  let synthese: {
    voix: ReturnType<typeof voix>[];
    getVoices: () => ReturnType<typeof voix>[];
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    synthese = {
      voix: [voix('ar-EG')],
      getVoices() {
        return this.voix;
      },
      speak: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('speechSynthesis', synthese);
    vi.stubGlobal('SpeechSynthesisUtterance', Enonce);
  });

  afterEach(() => {
    // Démonter AVANT de retirer la synthèse : le démontage l'arrête.
    cleanup();
    vi.unstubAllGlobals();
  });

  it('« Écouter » dit la phrase en arabe égyptien ; « Arrêter » jusqu’à la fin (scénarios 1, 2)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG']);
    await user.click(
      within(feuille).getByRole('button', {
        name: 'Écouter : Combien ça coûte ?',
      })
    );
    const enonce = synthese.speak.mock.calls[0]![0] as Enonce;
    expect(enonce.text).toBe('بكام ده؟');
    expect(enonce.lang).toBe('ar-EG');
    expect(enonce.voice).toBe(synthese.voix[0]);
    const arret = within(feuille).getByRole('button', {
      name: 'Arrêter : Combien ça coûte ?',
    });
    expect(arret).toBeInTheDocument();
    act(() => enonce.onend?.());
    expect(
      within(feuille).getByRole('button', {
        name: 'Écouter : Combien ça coûte ?',
      })
    ).toBeInTheDocument();
  });

  it('en grand aussi, la phrase s’écoute', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG']);
    await user.click(within(feuille).getByRole('button', { name: /بكام ده؟/ }));
    const grande = within(feuille).getByRole('region', {
      name: 'Combien ça coûte ?',
    });
    await user.click(within(grande).getByRole('button', { name: 'Écouter' }));
    expect((synthese.speak.mock.calls[0]![0] as Enonce).text).toBe('بكام ده؟');
  });

  it('« Écouter le montant » dit le prix en arabe (spécification 006, scénario 2)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG'], [{ devise: 'EGP', montant: 150 }]);
    await user.click(
      within(feuille).getByRole('button', { name: 'Écouter le montant' })
    );
    const enonce = synthese.speak.mock.calls[0]![0] as Enonce;
    expect(enonce.lang).toBe('ar-EG');
    expect(enonce.text).toBe(
      new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        currencyDisplay: 'name',
        maximumFractionDigits: 0,
      }).format(150)
    );
  });

  it('sans voix pour la langue : pas de bouton, et la feuille le dit (scénario 4)', () => {
    synthese.voix = [voix('de-DE')];
    const feuille = monter(['th']);
    expect(
      within(feuille).getByText(/^Pas de voix en thaï sur cet appareil/)
    ).toBeInTheDocument();
    expect(
      within(feuille).queryAllByRole('button', { name: /^Écouter/ })
    ).toHaveLength(0);
  });

  it('une variante sans voix propre prend la langue de base (scénario 5)', async () => {
    const user = userEvent.setup();
    synthese.voix = [voix('ar-SA')];
    const feuille = monter(['ar-EG']);
    await user.click(
      within(feuille).getByRole('button', {
        name: 'Écouter : Combien ça coûte ?',
      })
    );
    expect((synthese.speak.mock.calls[0]![0] as Enonce).voice).toBe(
      synthese.voix[0]
    );
  });
});

describe('dire le prix au vendeur (spécification 006, récit 1)', () => {
  const enLangue = (langue: string, devise: string, montant: number) =>
    new Intl.NumberFormat(langue, {
      style: 'currency',
      currency: devise,
      currencyDisplay: 'name',
      maximumFractionDigits: Number.isInteger(montant) ? 0 : 2,
    }).format(montant);
  const lisible = (texte: string | null) => (texte ?? '').replace(/\s/g, ' ');

  it('écrit le montant dans la langue du vendeur, et en clair (scénarios 1, 6)', () => {
    const feuille = monter(['ar-EG'], [{ devise: 'EGP', montant: 150 }]);
    const rangee = within(feuille).getByRole('region', { name: 'Le montant' });
    const texte = within(rangee).getByText(enLangue('ar-EG', 'EGP', 150));
    expect(texte).toHaveAttribute('lang', 'ar-EG');
    expect(texte).toHaveAttribute('dir', 'rtl');
    expect(
      within(rangee)
        .getAllByText(/EGP/)
        .some(n => lisible(n.textContent) === '150 EGP')
    ).toBe(true);
  });

  it('« Montrer » l’affiche en grand (scénario 3)', async () => {
    const user = userEvent.setup();
    const feuille = monter(['ar-EG'], [{ devise: 'EGP', montant: 150 }]);
    await user.click(
      within(feuille).getByRole('button', { name: 'Montrer le montant' })
    );
    const grande = within(feuille).getByRole('region', {
      name: 'Le montant',
    });
    expect(within(grande).getByText(enLangue('ar-EG', 'EGP', 150))).toHaveClass(
      'text-5xl'
    );
  });

  it('une langue de la seconde devise dit le montant de la seconde (scénario 4)', async () => {
    const user = userEvent.setup();
    const feuille = monter(
      ['ar-EG', 'en'],
      [
        { devise: 'EGP', montant: 150 },
        { devise: 'USD', montant: 4.07 },
      ]
    );
    await user.click(within(feuille).getByRole('tab', { name: 'anglais' }));
    expect(
      within(feuille).getByText(enLangue('en', 'USD', 4.07))
    ).toHaveAttribute('lang', 'en');
  });

  it('sans montant, pas de rangée (scénario 5)', () => {
    const feuille = monter(['ar-EG'], [{ devise: 'EGP', montant: null }]);
    expect(
      within(feuille).queryByRole('region', { name: 'Le montant' })
    ).toBeNull();
  });
});
