import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/index.ts';
import { serviceTaux, useTaux } from '../../rates/store.ts';
import type { Serie } from '../../rates/service.ts';
import { usePreferences } from '../../app/preferences.ts';
import { useConversion } from '../convert/conversion.ts';
import { HistoryScreen } from './HistoryScreen.tsx';

const AUJOURDHUI = new Date().toISOString().slice(0, 10);

// Un an de livre égyptienne : 56,18 au début, 58,83 aujourd'hui, et les deux
// extrêmes entre les deux.
const unAn: Serie = {
  source: 'marche',
  complete: true,
  points: [
    { date: '2025-10-01', taux: 56.18 },
    { date: '2026-01-05', taux: 60.4 },
    { date: '2026-04-06', taux: 50.9 },
    { date: AUJOURDHUI, taux: 58.83 },
  ],
};

function monter() {
  render(
    <I18nProvider>
      <HistoryScreen />
    </I18nProvider>
  );
}

/** La valeur d'un chiffre-clé, lue par son intitulé. */
function chiffre(intitule: string) {
  const dl = screen.getByText(intitule).closest('dl');
  if (!dl) throw new Error(`pas de chiffre-clé « ${intitule} »`);
  // Le premier `dd` est la valeur ; le second, s'il existe, sa précision.
  return within(dl)
    .getAllByRole('definition')[0]
    ?.textContent?.replace(/\s/g, ' ');
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dwc_locale', 'fr');
  useTaux.setState({
    etat: {
      marche: { source: 'marche', date: AUJOURDHUI, taux: { EGP: 58.83 } },
    },
    pret: true,
    chargement: false,
    echec: false,
  });
  usePreferences.setState({
    reference: 'EUR',
    devise: 'EGP',
    periode: '1A',
  });
  useConversion.setState({ saisie: { champ: 'devise', texte: '' } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('l’historique (récit 3)', () => {
  it('la courbe d’un an, ses extrêmes et sa variation', async () => {
    vi.spyOn(serviceTaux, 'serie').mockResolvedValue(unAn);
    monter();
    expect(
      await screen.findByRole('heading', {
        name: /^Évolution de 1\s€ en EGP sur 1 an$/,
      })
    ).toBeTruthy();
    expect(await screen.findByText('Plus haut')).toBeTruthy();
    expect(chiffre('Plus haut')).toBe('60,4 EGP');
    expect(chiffre('Plus bas')).toBe('50,9 EGP');
    expect(chiffre('Variation')).toContain('+4,7 %');
    expect(screen.getByText(/taux de marché, du 1 oct\. 2025 au/)).toBeTruthy();
  });

  it('compare le montant saisi au début de la période et aujourd’hui', async () => {
    vi.spyOn(serviceTaux, 'serie').mockResolvedValue(unAn);
    useConversion.setState({ saisie: { champ: 'devise', texte: '200' } });
    monter();
    expect(
      await screen.findByText(
        '200,00 EGP valaient 3,56 € le 1 oct. 2025, et valent 3,40 € aujourd’hui.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Écart : -0,16 € (-4,5 %).')).toBeTruthy();
  });

  it('compare aussi dans l’autre sens, en livres', async () => {
    vi.spyOn(serviceTaux, 'serie').mockResolvedValue(unAn);
    useConversion.setState({ saisie: { champ: 'reference', texte: '20' } });
    monter();
    expect(
      await screen.findByText(
        '20,00 € valaient 1 123,60 EGP le 1 oct. 2025, et valent 1 176,60 EGP aujourd’hui.'
      )
    ).toBeTruthy();
  });

  it('sans montant saisi, invite à en saisir un', async () => {
    vi.spyOn(serviceTaux, 'serie').mockResolvedValue(unAn);
    monter();
    expect(
      await screen.findByText(
        'Saisissez un montant dans Convertir pour le comparer.'
      )
    ).toBeTruthy();
  });

  it('change de période, et la garde', async () => {
    const serie = vi.spyOn(serviceTaux, 'serie').mockResolvedValue(unAn);
    monter();
    await userEvent.click(screen.getByRole('tab', { name: '1 mois' }));
    expect(serie).toHaveBeenLastCalledWith(
      'EUR',
      'EGP',
      '1M',
      expect.anything(),
      expect.any(AbortSignal)
    );
    expect(usePreferences.getState().periode).toBe('1M');
    expect(
      await screen.findByRole('heading', {
        name: /^Évolution de 1\s€ en EGP sur 1 mois$/,
      })
    ).toBeTruthy();
  });

  it('une période jamais lue, hors ligne, le dit', async () => {
    vi.spyOn(serviceTaux, 'serie').mockRejectedValue(new TypeError('réseau'));
    monter();
    expect(
      await screen.findByText(/n’a pas encore été consultée/)
    ).toBeTruthy();
  });

  it('une série trouée le signale', async () => {
    vi.spyOn(serviceTaux, 'serie').mockResolvedValue({
      ...unAn,
      complete: false,
    });
    monter();
    expect(await screen.findByText(/Quelques dates manquent/)).toBeTruthy();
  });

  it('une devise sans taux connu ne lit aucune série', () => {
    const serie = vi.spyOn(serviceTaux, 'serie');
    usePreferences.setState({ devise: 'XAU' });
    monter();
    expect(screen.getByText(/Aucun taux connu pour cette devise/)).toBeTruthy();
    expect(serie).not.toHaveBeenCalled();
  });
});
